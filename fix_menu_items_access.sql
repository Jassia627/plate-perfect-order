-- Script para corregir las políticas de RLS de menu_items
-- Asegura que los items del menú solo sean visibles para el restaurante correcto

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios productos" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios productos" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios productos" ON menu_items;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios productos" ON menu_items;
DROP POLICY IF EXISTS menu_items_select_policy ON menu_items;
DROP POLICY IF EXISTS menu_items_insert_policy ON menu_items;
DROP POLICY IF EXISTS menu_items_update_policy ON menu_items;
DROP POLICY IF EXISTS menu_items_delete_policy ON menu_items;

-- 2. Crear nuevas políticas más restrictivas
CREATE POLICY menu_items_select_policy
ON menu_items
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño del item
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño del item
  EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = menu_items.admin_id
  )
  OR
  -- El usuario es el administrador del item
  admin_id = auth.uid()
);

CREATE POLICY menu_items_insert_policy
ON menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo administradores pueden insertar
  EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  AND
  -- El admin_id debe coincidir con el usuario actual
  admin_id = auth.uid()
);

CREATE POLICY menu_items_update_policy
ON menu_items
FOR UPDATE
TO authenticated
USING (
  -- El usuario es el administrador del item
  admin_id = auth.uid()
)
WITH CHECK (
  -- El usuario es el administrador del item
  admin_id = auth.uid()
);

CREATE POLICY menu_items_delete_policy
ON menu_items
FOR DELETE
TO authenticated
USING (
  -- El usuario es el administrador del item
  admin_id = auth.uid()
);

-- 3. Actualizar los registros existentes para asegurar que tienen admin_id
UPDATE menu_items
SET admin_id = user_id
WHERE admin_id IS NULL;

-- 4. Crear un trigger para asegurar que siempre se asigne el admin_id correcto
CREATE OR REPLACE FUNCTION set_menu_item_admin_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona admin_id, usar el user_id del usuario actual
  IF NEW.admin_id IS NULL THEN
    NEW.admin_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_menu_item_admin_id_trigger ON menu_items;
CREATE TRIGGER set_menu_item_admin_id_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_menu_item_admin_id(); 