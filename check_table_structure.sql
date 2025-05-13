-- Script para verificar la estructura de la tabla restaurant_settings
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'restaurant_settings'
ORDER BY 
    ordinal_position; 