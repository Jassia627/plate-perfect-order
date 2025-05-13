-- Modificar la tabla tables para añadir admin_id
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Modificar la tabla menu_categories para añadir admin_id
ALTER TABLE menu_categories 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Modificar la tabla menu_items para añadir admin_id
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Modificar la tabla orders para añadir admin_id
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Modificar la tabla order_items para añadir admin_id
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Actualizar los registros existentes para asignar el admin_id correctamente
-- Para cada tabla, establecer admin_id = user_id para los registros existentes
UPDATE tables SET admin_id = user_id WHERE admin_id IS NULL;
UPDATE menu_categories SET admin_id = user_id WHERE admin_id IS NULL;
UPDATE menu_items SET admin_id = user_id WHERE admin_id IS NULL;
UPDATE orders SET admin_id = user_id WHERE admin_id IS NULL;
UPDATE order_items SET admin_id = user_id WHERE admin_id IS NULL;

-- Actualizar las políticas RLS para las tablas
-- Tables
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias mesas" ON tables;
CREATE POLICY "Usuarios pueden ver mesas según jerarquía" 
ON tables FOR SELECT 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias mesas" ON tables;
CREATE POLICY "Administradores pueden insertar mesas" 
ON tables FOR INSERT 
WITH CHECK (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias mesas" ON tables;
CREATE POLICY "Usuarios pueden actualizar mesas según jerarquía" 
ON tables FOR UPDATE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias mesas" ON tables;
CREATE POLICY "Administradores pueden eliminar sus mesas" 
ON tables FOR DELETE 
USING (
  auth.uid() = user_id AND
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Menu Categories
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias categorías" ON menu_categories;
CREATE POLICY "Usuarios pueden ver categorías según jerarquía" 
ON menu_categories FOR SELECT 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias categorías" ON menu_categories;
CREATE POLICY "Administradores pueden insertar categorías" 
ON menu_categories FOR INSERT 
WITH CHECK (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias categorías" ON menu_categories;
CREATE POLICY "Usuarios pueden actualizar categorías según jerarquía" 
ON menu_categories FOR UPDATE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias categorías" ON menu_categories;
CREATE POLICY "Administradores pueden eliminar sus categorías" 
ON menu_categories FOR DELETE 
USING (
  auth.uid() = user_id AND
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Menu Items
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios productos" ON menu_items;
CREATE POLICY "Usuarios pueden ver productos según jerarquía" 
ON menu_items FOR SELECT 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios productos" ON menu_items;
CREATE POLICY "Administradores pueden insertar productos" 
ON menu_items FOR INSERT 
WITH CHECK (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios productos" ON menu_items;
CREATE POLICY "Usuarios pueden actualizar productos según jerarquía" 
ON menu_items FOR UPDATE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios productos" ON menu_items;
CREATE POLICY "Administradores pueden eliminar sus productos" 
ON menu_items FOR DELETE 
USING (
  auth.uid() = user_id AND
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Orders
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios pedidos" ON orders;
CREATE POLICY "Usuarios pueden ver pedidos según jerarquía" 
ON orders FOR SELECT 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pedidos" ON orders;
CREATE POLICY "Usuarios pueden insertar pedidos según jerarquía" 
ON orders FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios pedidos" ON orders;
CREATE POLICY "Usuarios pueden actualizar pedidos según jerarquía" 
ON orders FOR UPDATE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios pedidos" ON orders;
CREATE POLICY "Usuarios pueden eliminar pedidos según jerarquía" 
ON orders FOR DELETE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

-- Order Items
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios ítems de pedidos" ON order_items;
CREATE POLICY "Usuarios pueden ver ítems de pedidos según jerarquía" 
ON order_items FOR SELECT 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios ítems de pedidos" ON order_items;
CREATE POLICY "Usuarios pueden insertar ítems de pedidos según jerarquía" 
ON order_items FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios ítems de pedidos" ON order_items;
CREATE POLICY "Usuarios pueden actualizar ítems de pedidos según jerarquía" 
ON order_items FOR UPDATE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios ítems de pedidos" ON order_items;
CREATE POLICY "Usuarios pueden eliminar ítems de pedidos según jerarquía" 
ON order_items FOR DELETE 
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  auth.uid() IN (
    SELECT up.admin_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
); 