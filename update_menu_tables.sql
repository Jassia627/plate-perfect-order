-- Modificar las tablas menu_categories y menu_items para añadir user_id
-- y configurar Row Level Security (RLS)

-- Añadir el campo user_id a la tabla menu_categories
ALTER TABLE menu_categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Añadir el campo user_id a la tabla menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Habilitar RLS en la tabla menu_categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla menu_items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para menu_categories si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias categorías" ON menu_categories;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias categorías" ON menu_categories;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias categorías" ON menu_categories;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias categorías" ON menu_categories;

-- Crear políticas para menu_categories
CREATE POLICY "Usuarios pueden ver sus propias categorías" 
ON menu_categories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias categorías" 
ON menu_categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias categorías" 
ON menu_categories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias categorías" 
ON menu_categories FOR DELETE 
USING (auth.uid() = user_id);

-- Eliminar políticas existentes para menu_items si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios productos" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios productos" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios productos" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios productos" ON menu_items;

-- Crear políticas para menu_items
CREATE POLICY "Usuarios pueden ver sus propios productos" 
ON menu_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios productos" 
ON menu_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios productos" 
ON menu_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios productos" 
ON menu_items FOR DELETE 
USING (auth.uid() = user_id);

-- Actualizar los registros existentes para asignarles un usuario (opcional)
-- Este comando debe ejecutarse solo si hay un usuario administrador existente
-- Reemplaza 'ID_DE_USUARIO_ADMIN' con el ID real del usuario administrador
-- UPDATE menu_categories SET user_id = 'ID_DE_USUARIO_ADMIN' WHERE user_id IS NULL;
-- UPDATE menu_items SET user_id = 'ID_DE_USUARIO_ADMIN' WHERE user_id IS NULL; 