-- Script para actualizar manualmente el número de WhatsApp de un restaurante
-- INSTRUCCIONES:
-- 1. Reemplaza los valores entre comillas simples con tus datos reales
-- 2. El admin_id debe ser un UUID válido, por ejemplo: '123e4567-e89b-12d3-a456-426614174000'
-- 3. El número de WhatsApp debe incluir el código de país, por ejemplo: '+34612345678'

-- Configuración: Reemplaza estos valores con tus datos reales
\set admin_id_valor '''aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee''' -- Reemplaza con tu UUID real
\set whatsapp_valor '''+1234567890''' -- Reemplaza con tu número de WhatsApp real
\set nombre_valor '''Mi Restaurante''' -- Reemplaza con el nombre de tu restaurante
\set descripcion_valor '''La mejor comida de la ciudad''' -- Reemplaza con la descripción
\set direccion_valor '''Calle Principal 123, Ciudad''' -- Reemplaza con tu dirección

-- No necesitas modificar nada debajo de esta línea
-- -----------------------------------------------

-- Primero verificamos si existe el registro para el admin_id específico
DO $$
DECLARE
    admin_id_param UUID;
    whatsapp_param TEXT;
    nombre_param TEXT;
    descripcion_param TEXT;
    direccion_param TEXT;
    restaurant_exists BOOLEAN;
BEGIN
    -- Asignar valores desde las variables
    admin_id_param := :'admin_id_valor';
    whatsapp_param := :'whatsapp_valor';
    nombre_param := :'nombre_valor';
    descripcion_param := :'descripcion_valor';
    direccion_param := :'direccion_valor';
    
    -- Verificar si existe el registro
    SELECT EXISTS (
        SELECT 1 FROM restaurant_settings 
        WHERE admin_id = admin_id_param
    ) INTO restaurant_exists;
    
    IF restaurant_exists THEN
        -- Actualizar el número de WhatsApp
        UPDATE restaurant_settings
        SET whatsapp = whatsapp_param
        WHERE admin_id = admin_id_param;
        
        RAISE NOTICE 'Número de WhatsApp actualizado con éxito para el restaurante con admin_id: %', admin_id_param;
    ELSE
        -- Si no existe, insertamos un nuevo registro
        INSERT INTO restaurant_settings (
            admin_id, 
            name, 
            description, 
            address, 
            whatsapp
        ) VALUES (
            admin_id_param,
            nombre_param,
            descripcion_param,
            direccion_param,
            whatsapp_param
        );
        
        RAISE NOTICE 'Creado nuevo registro de restaurant_settings con WhatsApp para admin_id: %', admin_id_param;
    END IF;
END $$;

-- Verificar que se haya actualizado correctamente
SELECT admin_id, name, description, address, whatsapp, phone
FROM restaurant_settings
WHERE admin_id = :'admin_id_valor';

-- EJEMPLO DE USO CORRECTO:
-- supabase db execute --file=actualizar_restaurant_settings.sql 