-- Script para verificar y corregir permisos de usuarios camareros
DO $$
DECLARE
    v_camarero_id UUID;
    v_admin_id UUID;
    v_admin_profiles RECORD;
    v_admin_count INTEGER;
BEGIN
    -- 1. Verificar usuarios con rol 'admin'
    SELECT COUNT(*) INTO v_admin_count FROM public.user_profiles WHERE role = 'admin';
    
    RAISE NOTICE 'Cantidad de administradores encontrados: %', v_admin_count;
    
    -- Si no hay administradores, no podemos continuar
    IF v_admin_count = 0 THEN
        RAISE EXCEPTION 'No se encontraron usuarios con rol admin';
    END IF;
    
    -- 2. Mostrar todos los administradores para depuración
    FOR v_admin_profiles IN
        SELECT * FROM public.user_profiles WHERE role = 'admin'
    LOOP
        RAISE NOTICE 'Admin encontrado - ID: %, User ID: %', v_admin_profiles.id, v_admin_profiles.user_id;
    END LOOP;
    
    -- 3. Obtener el primer administrador (se usará si los camareros no tienen admin_id)
    SELECT user_id INTO v_admin_id FROM public.user_profiles 
    WHERE role = 'admin' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    RAISE NOTICE 'Usando administrador con ID: % como administrador por defecto', v_admin_id;
    
    -- 4. Asegurarse de que todos los camareros estén vinculados a un administrador
    FOR v_camarero_id IN
        SELECT user_id 
        FROM public.user_profiles 
        WHERE (role = 'waiter' OR role LIKE '%amarero%') 
        AND (admin_id IS NULL OR admin_id::TEXT = '')
    LOOP
        -- Actualizar el perfil del camarero con el admin_id
        UPDATE public.user_profiles
        SET 
            admin_id = v_admin_id,
            updated_at = NOW()
        WHERE user_id = v_camarero_id;
        
        RAISE NOTICE 'Camarero % actualizado con admin_id: %', v_camarero_id, v_admin_id;
    END LOOP;
    
    -- 5. Verificar si hay entradas en la tabla staff para los camareros
    FOR v_camarero_id IN
        SELECT up.user_id 
        FROM public.user_profiles up
        LEFT JOIN public.staff s ON up.user_id = s.user_id
        WHERE (up.role = 'waiter' OR up.role LIKE '%amarero%') 
        AND s.id IS NULL
    LOOP
        -- Intentar crear una entrada en la tabla staff para este camarero
        BEGIN
            INSERT INTO public.staff (
                user_id,
                name,
                role,
                admin_id,
                status,
                created_at,
                updated_at
            )
            SELECT 
                up.user_id,
                COALESCE((SELECT username FROM auth.users WHERE id = up.user_id), 'Camarero'),
                up.role,
                up.admin_id,
                'active',
                NOW(),
                NOW()
            FROM public.user_profiles up
            WHERE up.user_id = v_camarero_id;
            
            RAISE NOTICE 'Creada entrada en staff para camarero: %', v_camarero_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error al crear entrada en staff para camarero %: %', v_camarero_id, SQLERRM;
        END;
    END LOOP;
    
    -- 6. Asegurarse de que las entradas existentes en staff tengan el mismo admin_id que en user_profiles
    UPDATE public.staff s
    SET 
        admin_id = up.admin_id,
        updated_at = NOW()
    FROM public.user_profiles up
    WHERE s.user_id = up.user_id
    AND (s.admin_id IS NULL OR s.admin_id <> up.admin_id)
    AND up.admin_id IS NOT NULL;
    
    RAISE NOTICE 'Actualización de tabla staff completada';
    
    -- 7. Verificar si hay configuraciones de restaurant para el administrador
    DECLARE
        v_restaurant_count INTEGER;
        v_columns TEXT[];
        v_column_names TEXT;
        v_column_values TEXT;
        v_sql TEXT;
    BEGIN
        -- Obtener lista de columnas existentes en la tabla restaurant_settings
        SELECT array_agg(column_name::TEXT)
        INTO v_columns
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'restaurant_settings';
        
        -- Comprobar si la tabla existe
        IF v_columns IS NULL THEN
            RAISE NOTICE 'La tabla restaurant_settings no existe. Por favor, créala primero.';
            RETURN;
        END IF;
        
        -- Verificar si el administrador ya tiene configuraciones
        SELECT COUNT(*) INTO v_restaurant_count 
        FROM public.restaurant_settings 
        WHERE user_id = v_admin_id;
        
        IF v_restaurant_count = 0 THEN
            RAISE NOTICE 'El administrador % no tiene configuraciones de restaurante. Insertando...', v_admin_id;
            
            -- Construir lista de columnas y valores dinámicamente
            v_column_names := 'user_id';
            v_column_values := quote_literal(v_admin_id);
            
            -- Añadir columnas que existan en la tabla
            IF 'name' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', name';
                v_column_values := v_column_values || ', ' || quote_literal('Mi Restaurante');
            END IF;
            
            IF 'address' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', address';
                v_column_values := v_column_values || ', ' || quote_literal('Dirección del Restaurante');
            END IF;
            
            IF 'phone' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', phone';
                v_column_values := v_column_values || ', ' || quote_literal('123456789');
            END IF;
            
            IF 'description' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', description';
                v_column_values := v_column_values || ', ' || quote_literal('Restaurante de comida mediterránea');
            END IF;
            
            IF 'dark_mode' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', dark_mode';
                v_column_values := v_column_values || ', false';
            END IF;
            
            IF 'auto_print' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', auto_print';
                v_column_values := v_column_values || ', false';
            END IF;
            
            IF 'currency' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', currency';
                v_column_values := v_column_values || ', ' || quote_literal('EUR');
            END IF;
            
            IF 'created_at' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', created_at';
                v_column_values := v_column_values || ', NOW()';
            END IF;
            
            IF 'updated_at' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', updated_at';
                v_column_values := v_column_values || ', NOW()';
            END IF;
            
            -- Construir y ejecutar la consulta SQL
            v_sql := 'INSERT INTO public.restaurant_settings (' || 
                     v_column_names || ') VALUES (' || 
                     v_column_values || ')';
                     
            RAISE NOTICE 'Ejecutando SQL: %', v_sql;
            BEGIN
                EXECUTE v_sql;
                RAISE NOTICE 'Configuraciones básicas creadas para el administrador %', v_admin_id;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error al crear configuraciones para el administrador %: %', v_admin_id, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'El administrador % ya tiene configuraciones de restaurante', v_admin_id;
        END IF;
    END;
END $$;

-- Asegurarse de que la política RLS para staff es la correcta
DROP POLICY IF EXISTS staff_select_policy ON public.staff;
CREATE POLICY staff_select_policy
ON public.staff
FOR SELECT
TO authenticated
USING (
  -- Un usuario puede ver los registros donde es el administrador
  -- o donde él mismo es el miembro del staff
  -- o donde comparte el mismo administrador
  admin_id = auth.uid() OR 
  user_id = auth.uid() OR
  admin_id IN (SELECT admin_id FROM public.user_profiles WHERE user_id = auth.uid())
);

-- Asegurarse de que las políticas de acceso a otras tablas relacionadas son correctas
-- Para menus, categories, items, etc.
DROP POLICY IF EXISTS tables_select_policy ON public.tables;
CREATE POLICY tables_select_policy
ON public.tables
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de las mesas
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de las mesas
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = tables.user_id
  )
  OR
  -- El usuario es administrador del dueño de las mesas
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = tables.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
); 