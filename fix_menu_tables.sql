-- Script para asegurarse de que admin_id está correctamente configurado
-- en todas las tablas relacionadas con el menú

-- 1. Verificar y añadir la columna admin_id a menu_categories si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_categories' 
        AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.menu_categories ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Verificar y añadir la columna admin_id a menu_items si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.menu_items ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Actualizar admin_id en menu_categories para que sea igual a user_id
UPDATE public.menu_categories
SET admin_id = user_id
WHERE admin_id IS NULL AND user_id IS NOT NULL;

-- 4. Actualizar admin_id en menu_items para que sea igual a user_id
UPDATE public.menu_items
SET admin_id = user_id
WHERE admin_id IS NULL AND user_id IS NOT NULL;

-- 5. Añadir un índice a las columnas admin_id para mejorar el rendimiento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'menu_categories' 
        AND indexname = 'idx_menu_categories_admin_id'
    ) THEN
        CREATE INDEX idx_menu_categories_admin_id ON public.menu_categories(admin_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'menu_items' 
        AND indexname = 'idx_menu_items_admin_id'
    ) THEN
        CREATE INDEX idx_menu_items_admin_id ON public.menu_items(admin_id);
    END IF;
END $$;

-- 6. Crear o reemplazar el trigger para asegurar que admin_id siempre se establece
CREATE OR REPLACE FUNCTION public.set_menu_item_admin_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Si admin_id es NULL, establecerlo al mismo valor que user_id
    IF NEW.admin_id IS NULL THEN
        NEW.admin_id := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar y crear el trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_menu_item_admin_id_trigger'
    ) THEN
        CREATE TRIGGER set_menu_item_admin_id_trigger
        BEFORE INSERT OR UPDATE ON public.menu_items
        FOR EACH ROW
        EXECUTE FUNCTION public.set_menu_item_admin_id();
    END IF;
END $$;

-- 7. Crear o reemplazar el trigger para asegurar que admin_id siempre se establece en categorías
CREATE OR REPLACE FUNCTION public.set_menu_category_admin_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Si admin_id es NULL, establecerlo al mismo valor que user_id
    IF NEW.admin_id IS NULL THEN
        NEW.admin_id := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar y crear el trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_menu_category_admin_id_trigger'
    ) THEN
        CREATE TRIGGER set_menu_category_admin_id_trigger
        BEFORE INSERT OR UPDATE ON public.menu_categories
        FOR EACH ROW
        EXECUTE FUNCTION public.set_menu_category_admin_id();
    END IF;
END $$;

-- 8. Revisar y actualizar las políticas RLS para usar admin_id
-- Eliminar políticas RLS existentes para menu_items
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios items" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios items" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios items" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios items" ON menu_items;
DROP POLICY IF EXISTS "select_menu_items" ON menu_items;
DROP POLICY IF EXISTS "insert_menu_items" ON menu_items;
DROP POLICY IF EXISTS "update_menu_items" ON menu_items;
DROP POLICY IF EXISTS "delete_menu_items" ON menu_items;

-- Crear nuevas políticas basadas en admin_id
CREATE POLICY "select_menu_items" ON menu_items FOR SELECT
USING (
    -- El usuario puede ver sus propios items o los items donde es admin
    user_id = auth.uid() OR 
    admin_id = auth.uid() OR
    -- O si el item pertenece a un restaurante donde el usuario es empleado
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = menu_items.admin_id
    )
);

CREATE POLICY "insert_menu_items" ON menu_items FOR INSERT
WITH CHECK (
    -- Un usuario solo puede insertar items propios
    user_id = auth.uid()
);

CREATE POLICY "update_menu_items" ON menu_items FOR UPDATE
USING (
    -- El propietario o el admin puede actualizar
    user_id = auth.uid() OR admin_id = auth.uid()
)
WITH CHECK (
    -- El propietario o el admin puede actualizar
    user_id = auth.uid() OR admin_id = auth.uid()
);

CREATE POLICY "delete_menu_items" ON menu_items FOR DELETE
USING (
    -- El propietario o el admin puede eliminar
    user_id = auth.uid() OR admin_id = auth.uid()
);

-- Eliminar políticas RLS existentes para menu_categories
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias categorias" ON menu_categories;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias categorias" ON menu_categories;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias categorias" ON menu_categories;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias categorias" ON menu_categories;
DROP POLICY IF EXISTS "select_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "insert_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "update_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "delete_menu_categories" ON menu_categories;

-- Crear nuevas políticas basadas en admin_id
CREATE POLICY "select_menu_categories" ON menu_categories FOR SELECT
USING (
    -- El usuario puede ver sus propias categorías o las categorías donde es admin
    user_id = auth.uid() OR 
    admin_id = auth.uid() OR
    -- O si la categoría pertenece a un restaurante donde el usuario es empleado
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = menu_categories.admin_id
    )
);

CREATE POLICY "insert_menu_categories" ON menu_categories FOR INSERT
WITH CHECK (
    -- Un usuario solo puede insertar categorías propias
    user_id = auth.uid()
);

CREATE POLICY "update_menu_categories" ON menu_categories FOR UPDATE
USING (
    -- El propietario o el admin puede actualizar
    user_id = auth.uid() OR admin_id = auth.uid()
)
WITH CHECK (
    -- El propietario o el admin puede actualizar
    user_id = auth.uid() OR admin_id = auth.uid()
);

CREATE POLICY "delete_menu_categories" ON menu_categories FOR DELETE
USING (
    -- El propietario o el admin puede eliminar
    user_id = auth.uid() OR admin_id = auth.uid()
); 