-- Script para añadir la columna logo_url a la tabla restaurant_settings

-- Verificar si la columna ya existe para evitar errores
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
        RAISE NOTICE 'La columna logo_url ya existe en la tabla restaurant_settings. No se realizaron cambios.';
    END IF;
END $$; 