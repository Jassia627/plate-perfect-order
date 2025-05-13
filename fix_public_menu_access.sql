-- Script para permitir acceso público a menús a través de las políticas RLS

-- 1. Crear una política de lectura pública para menu_categories
DROP POLICY IF EXISTS "public_view_menu_categories" ON menu_categories;

CREATE POLICY "public_view_menu_categories" 
ON menu_categories 
FOR SELECT 
TO PUBLIC
USING (true); -- Permitir que cualquier persona vea categorías de menú

-- 2. Crear una política de lectura pública para menu_items, pero solo de los items disponibles
DROP POLICY IF EXISTS "public_view_menu_items" ON menu_items;

CREATE POLICY "public_view_menu_items" 
ON menu_items 
FOR SELECT 
TO PUBLIC
USING (available = true); -- Solo mostrar elementos disponibles al público

-- 3. Crear una política de lectura pública para restaurant_settings
DROP POLICY IF EXISTS "public_view_restaurant_settings" ON restaurant_settings;

CREATE POLICY "public_view_restaurant_settings" 
ON restaurant_settings 
FOR SELECT 
TO PUBLIC
USING (true); -- Permitir que cualquier persona vea la información del restaurante

-- 4. Crear una función para diagnóstico y verificación de menús
CREATE OR REPLACE FUNCTION public.debug_menu_access(admin_uuid UUID)
RETURNS TABLE (
    category_count INTEGER,
    item_count INTEGER,
    available_item_count INTEGER
) AS $$
DECLARE
    cat_count INTEGER;
    itm_count INTEGER;
    avail_count INTEGER;
BEGIN
    -- Contar categorías
    SELECT COUNT(*) INTO cat_count 
    FROM menu_categories 
    WHERE admin_id = admin_uuid;
    
    -- Contar todos los items
    SELECT COUNT(*) INTO itm_count 
    FROM menu_items 
    WHERE admin_id = admin_uuid;
    
    -- Contar items disponibles
    SELECT COUNT(*) INTO avail_count 
    FROM menu_items 
    WHERE admin_id = admin_uuid AND available = true;
    
    -- Retornar resultados
    RETURN QUERY SELECT cat_count, itm_count, avail_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Asegurar que las tablas tienen habilitado RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar cualquier política antigua que pueda estar interfiriendo
-- (Adicionales a las ya manejadas en el script anterior)
DROP POLICY IF EXISTS "public_access_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "public_access_menu_items" ON menu_items;
DROP POLICY IF EXISTS "menu_categories_select_for_public" ON menu_categories;
DROP POLICY IF EXISTS "menu_items_select_for_public" ON menu_items;
DROP POLICY IF EXISTS "restaurant_settings_select_for_public" ON restaurant_settings;

-- 7. Asegurar que anon tiene acceso al buckets de storage para imágenes
-- Si estás usando Storage de Supabase para las imágenes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'Menu Images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Crear política pública para el bucket de imágenes
DROP POLICY IF EXISTS "Public Access to Menu Images" ON storage.objects;
CREATE POLICY "Public Access to Menu Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images'); 