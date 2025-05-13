-- Script para actualizar el WhatsApp para un usuario específico
-- Solo necesitas especificar el user_id y el script se encargará del resto

-- Configura este valor con tu ID de usuario
\set user_id '''TU_USER_ID_AQUI''' -- Reemplaza con tu user_id real (formato UUID)

-- No necesitas modificar nada debajo de esta línea
-- =================================================

DO $$
DECLARE
    user_id_param UUID;
    record_exists BOOLEAN;
    current_phone TEXT;
BEGIN
    -- Asignar el user_id desde la variable
    user_id_param := :'91d4306c-9c10-4d1a-9f9f-5e1651b96066';
    
    -- Verificar si existe la columna whatsapp
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'restaurant_settings'
        AND column_name = 'whatsapp'
    ) THEN
        -- Añadir la columna whatsapp si no existe
        ALTER TABLE restaurant_settings
        ADD COLUMN whatsapp TEXT;
        
        RAISE NOTICE 'Columna whatsapp añadida con éxito a la tabla restaurant_settings';
    END IF;
    
    -- Verificar si existe el registro para el user_id
    SELECT 
        EXISTS(SELECT 1 FROM restaurant_settings WHERE user_id = user_id_param), 
        phone 
    INTO record_exists, current_phone
    FROM restaurant_settings 
    WHERE user_id = user_id_param;
    
    IF record_exists THEN
        -- Actualizar el whatsapp basado en el phone existente
        UPDATE restaurant_settings
        SET whatsapp = CASE 
            -- Si el teléfono ya tiene formato de WhatsApp (+XX...) mantenerlo
            WHEN phone LIKE '+%' THEN phone
            -- Si no, convertir al formato WhatsApp agregando '+34' (código de España)
            -- Puedes ajustar este código según tu país
            ELSE '+57' || regexp_replace(phone, '[^0-9]', '', 'g')
        END
        WHERE user_id = user_id_param
        AND whatsapp IS NULL;
        
        RAISE NOTICE 'WhatsApp actualizado para el usuario con id: %', user_id_param;
        RAISE NOTICE 'Número de teléfono: %', current_phone;
        RAISE NOTICE 'Convertido a formato WhatsApp';
    ELSE
        RAISE NOTICE 'No se encontró ningún registro para el user_id: %', user_id_param;
        RAISE NOTICE 'Verifica que el ID de usuario sea correcto';
    END IF;
END $$;

-- Mostrar los datos actualizados
SELECT user_id, name, phone, whatsapp
FROM restaurant_settings
WHERE user_id = :'91d4306c-9c10-4d1a-9f9f-5e1651b96066'; 