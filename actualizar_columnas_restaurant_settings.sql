-- Script para añadir las columnas necesarias a restaurant_settings
-- Este script añade tanto whatsapp como logo_url si no existen

-- 1. Añadir la columna whatsapp si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'restaurant_settings'
        AND column_name = 'whatsapp'
    ) THEN
        -- Añadir la columna whatsapp
        ALTER TABLE restaurant_settings
        ADD COLUMN whatsapp TEXT;
        
        RAISE NOTICE 'Columna whatsapp añadida con éxito a la tabla restaurant_settings';
    ELSE
        RAISE NOTICE 'La columna whatsapp ya existe en la tabla restaurant_settings';
    END IF;
END $$;

-- 2. Añadir la columna logo_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'restaurant_settings'
        AND column_name = 'logo_url'
    ) THEN
        -- Añadir la columna logo_url
        ALTER TABLE restaurant_settings
        ADD COLUMN logo_url TEXT;
        
        RAISE NOTICE 'Columna logo_url añadida con éxito a la tabla restaurant_settings';
    ELSE
        RAISE NOTICE 'La columna logo_url ya existe en la tabla restaurant_settings';
    END IF;
END $$;

-- 3. Copiar el número de teléfono a whatsapp si whatsapp está vacío
UPDATE restaurant_settings
SET whatsapp = CASE 
    -- Si el teléfono ya tiene formato de WhatsApp (+XX...) mantenerlo
    WHEN phone LIKE '+%' THEN phone
    -- Si no, convertir al formato WhatsApp agregando el código de país
    ELSE '+57' || regexp_replace(phone, '[^0-9]', '', 'g')
END
WHERE whatsapp IS NULL AND phone IS NOT NULL;

-- 4. Mostrar los resultados actualizados
SELECT id, name, phone, whatsapp, logo_url, address, description, user_id
FROM restaurant_settings
ORDER BY created_at DESC; 