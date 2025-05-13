-- Script simplificado para añadir WhatsApp desde el teléfono existente

-- 1. Asegurarse de que existe la columna whatsapp
DO $$
BEGIN
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
    ELSE
        RAISE NOTICE 'La columna whatsapp ya existe en la tabla restaurant_settings';
    END IF;
END $$;

-- 2. Copiar el número de teléfono a whatsapp si whatsapp está vacío
UPDATE restaurant_settings
SET whatsapp = CASE 
    -- Si el teléfono ya tiene formato de WhatsApp (+XX...) mantenerlo
    WHEN phone LIKE '+%' THEN phone
    -- Si no, convertir al formato WhatsApp agregando el código de país
    ELSE '+57' || regexp_replace(phone, '[^0-9]', '', 'g')
END
WHERE whatsapp IS NULL AND phone IS NOT NULL;

-- 3. Mostrar los resultados actualizados
SELECT id, name, phone, whatsapp, address, description, user_id
FROM restaurant_settings
ORDER BY created_at DESC;

-- 4. Mensaje de ayuda
DO $$
BEGIN
    RAISE NOTICE '=== Actualización de WhatsApp Completada ===';
    RAISE NOTICE 'Se han convertido los números de teléfono al formato WhatsApp.';
    RAISE NOTICE 'Si necesitas cambiar el código de país utilizado (+57), modifica este script.';
END $$; 