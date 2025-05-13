-- Script para verificar y corregir el usuario camarero con ID específico
DO $$
DECLARE
    v_user_id UUID := 'aff6464b-7354-4979-b2ab-7826a646c217'; -- ID del usuario con problemas
    v_admin_id UUID;
    v_user_role TEXT;
    v_admin_has_settings BOOLEAN;
    v_user_has_settings BOOLEAN;
    v_settings_id UUID;
BEGIN
    -- 1. Verificar el perfil del usuario y su rol
    SELECT role, admin_id INTO v_user_role, v_admin_id 
    FROM public.user_profiles 
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Usuario % tiene rol % y admin_id %', v_user_id, v_user_role, v_admin_id;
    
    -- 2. Si no tiene admin_id, buscar un administrador para asignarle
    IF v_admin_id IS NULL THEN
        SELECT user_id INTO v_admin_id 
        FROM public.user_profiles 
        WHERE role = 'admin' 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF v_admin_id IS NOT NULL THEN
            -- Actualizar el perfil del usuario con el admin_id
            UPDATE public.user_profiles
            SET 
                admin_id = v_admin_id,
                updated_at = NOW()
            WHERE user_id = v_user_id;
            
            RAISE NOTICE 'Se asignó el administrador % al usuario %', v_admin_id, v_user_id;
        ELSE
            RAISE NOTICE 'No se encontraron administradores para asignar al usuario %', v_user_id;
        END IF;
    END IF;
    
    -- 3. Verificar si el administrador tiene configuraciones de restaurante
    IF v_admin_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.restaurant_settings WHERE user_id = v_admin_id
        ) INTO v_admin_has_settings;
        
        IF NOT v_admin_has_settings THEN
            -- Crear configuraciones para el administrador
            INSERT INTO public.restaurant_settings (
                user_id, 
                name, 
                phone, 
                address, 
                description, 
                dark_mode, 
                auto_print, 
                currency,
                created_at,
                updated_at
            ) VALUES (
                v_admin_id,
                'Mi Restaurante',
                '123456789',
                'Dirección del Restaurante',
                'Restaurante de comida mediterránea',
                false,
                false,
                'EUR',
                NOW(),
                NOW()
            ) RETURNING id INTO v_settings_id;
            
            RAISE NOTICE 'Se crearon configuraciones de restaurante para el administrador % con ID %', v_admin_id, v_settings_id;
        ELSE
            RAISE NOTICE 'El administrador % ya tiene configuraciones de restaurante', v_admin_id;
        END IF;
    END IF;
    
    -- 4. Verificar si el usuario ya tiene sus propias configuraciones
    SELECT EXISTS (
        SELECT 1 FROM public.restaurant_settings WHERE user_id = v_user_id
    ) INTO v_user_has_settings;
    
    IF v_user_has_settings THEN
        RAISE NOTICE 'El usuario % ya tiene sus propias configuraciones de restaurante (esto podría causar confusión)', v_user_id;
        -- Opcional: eliminar las configuraciones del usuario para que use las del admin
        -- DELETE FROM public.restaurant_settings WHERE user_id = v_user_id;
        -- RAISE NOTICE 'Se eliminaron las configuraciones propias del usuario para que use las del administrador';
    END IF;
    
    -- 5. Verificar entradas en la tabla staff
    IF NOT EXISTS (
        SELECT 1 FROM public.staff WHERE user_id = v_user_id
    ) THEN
        -- Crear una entrada en la tabla staff
        INSERT INTO public.staff (
            user_id,
            name,
            role,
            admin_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            COALESCE((SELECT username FROM auth.users WHERE id = v_user_id), 'Camarero'),
            v_user_role,
            v_admin_id,
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Se creó una entrada en la tabla staff para el usuario %', v_user_id;
    ELSE
        -- Actualizar la entrada existente para asegurar que tenga el admin_id correcto
        UPDATE public.staff
        SET 
            admin_id = v_admin_id,
            updated_at = NOW()
        WHERE user_id = v_user_id AND (admin_id IS NULL OR admin_id <> v_admin_id);
        
        RAISE NOTICE 'Se actualizó la entrada en la tabla staff para el usuario %', v_user_id;
    END IF;
    
    RAISE NOTICE 'Verificación y corrección del usuario % completada', v_user_id;
END $$; 