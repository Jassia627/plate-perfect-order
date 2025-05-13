-- Script para añadir la columna whatsapp a la tabla restaurant_settings

-- Verificar si la columna ya existe para evitar errores
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
        RAISE NOTICE 'La columna whatsapp ya existe en la tabla restaurant_settings. No se realizaron cambios.';
    END IF;
END $$;

-- Actualizar registros existentes con un valor por defecto si es necesario
-- (opcional: ajusta según tus necesidades)
UPDATE restaurant_settings
SET whatsapp = phone
WHERE whatsapp IS NULL AND phone IS NOT NULL;

-- Actualizar el hook usePublicMenu para manejar correctamente este caso
-- Este comentario es solo informativo, la actualización del código debe hacerse en el archivo use-public-menu.tsx 