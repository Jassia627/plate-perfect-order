-- Script para insertar configuraciones por defecto para administradores respetando
-- la estructura existente de la tabla
DO $$
DECLARE
    v_admin_id UUID;
    v_exists BOOLEAN;
    v_columns TEXT[];
    v_column_names TEXT;
    v_column_values TEXT;
    v_sql TEXT;
BEGIN
    -- Obtener lista de columnas existentes en la tabla
    SELECT array_agg(column_name::TEXT)
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'restaurant_settings';

    -- Obtener todos los usuarios con rol 'admin'
    FOR v_admin_id IN 
        SELECT user_id FROM public.user_profiles WHERE role = 'admin'
    LOOP
        -- Verificar si ya tiene configuraciones
        SELECT EXISTS (
        SELECT 1 FROM public.restaurant_settings WHERE user_id = v_admin_id
        ) INTO v_exists;
        
        -- Si no tiene configuraciones, insertar por defecto
        IF NOT v_exists THEN
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
            
            IF 'tax_percentage' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', tax_percentage';
                v_column_values := v_column_values || ', 21.0';
            END IF;
            
            IF 'service_charge_percentage' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', service_charge_percentage';
                v_column_values := v_column_values || ', 0';
            END IF;
            
            IF 'default_language' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', default_language';
                v_column_values := v_column_values || ', ' || quote_literal('es');
            END IF;
            
            IF 'theme' = ANY(v_columns) THEN
                v_column_names := v_column_names || ', theme';
                v_column_values := v_column_values || ', ' || quote_literal('light');
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
                    
            RAISE NOTICE 'Executing SQL: %', v_sql;
            EXECUTE v_sql;
            
            RAISE NOTICE 'Configuración de restaurante creada con éxito para el administrador: %', v_admin_id;
        ELSE
            RAISE NOTICE 'El administrador % ya tiene configuración de restaurante', v_admin_id;
        END IF;
    END LOOP;
END $$; 