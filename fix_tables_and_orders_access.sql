-- Script para corregir las políticas de RLS de tables y orders
-- Asegura que los pedidos solo puedan acceder a los menús del restaurante correcto

-- 1. Eliminar políticas existentes de tables
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias mesas" ON tables;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias mesas" ON tables;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias mesas" ON tables;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias mesas" ON tables;
DROP POLICY IF EXISTS tables_select_policy ON tables;
DROP POLICY IF EXISTS tables_insert_policy ON tables;
DROP POLICY IF EXISTS tables_update_policy ON tables;
DROP POLICY IF EXISTS tables_delete_policy ON tables;

-- 2. Crear nuevas políticas para tables
CREATE POLICY tables_select_policy
ON tables
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de la mesa
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de la mesa
  EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = tables.admin_id
  )
  OR
  -- El usuario es el administrador de la mesa
  admin_id = auth.uid()
);

CREATE POLICY tables_insert_policy
ON tables
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

CREATE POLICY tables_update_policy
ON tables
FOR UPDATE
TO authenticated
USING (
  -- El usuario es el administrador de la mesa
  admin_id = auth.uid()
)
WITH CHECK (
  -- El usuario es el administrador de la mesa
  admin_id = auth.uid()
);

CREATE POLICY tables_delete_policy
ON tables
FOR DELETE
TO authenticated
USING (
  -- El usuario es el administrador de la mesa
  admin_id = auth.uid()
);

-- 3. Actualizar los registros existentes de tables
UPDATE tables
SET admin_id = user_id
WHERE admin_id IS NULL;

-- 4. Crear trigger para tables
CREATE OR REPLACE FUNCTION set_table_admin_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NULL THEN
    NEW.admin_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_table_admin_id_trigger ON tables;
CREATE TRIGGER set_table_admin_id_trigger
  BEFORE INSERT OR UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION set_table_admin_id();

-- 5. Actualizar políticas de orders para que verifiquen el admin_id de la mesa
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios pedidos" ON orders;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pedidos" ON orders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios pedidos" ON orders;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios pedidos" ON orders;
DROP POLICY IF EXISTS orders_select_policy ON orders;
DROP POLICY IF EXISTS orders_insert_policy ON orders;
DROP POLICY IF EXISTS orders_update_policy ON orders;
DROP POLICY IF EXISTS orders_delete_policy ON orders;

CREATE POLICY orders_select_policy
ON orders
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño del pedido
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño del pedido
  EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = orders.admin_id
  )
  OR
  -- El usuario es el administrador del pedido
  admin_id = auth.uid()
  OR
  -- El pedido pertenece a una mesa del restaurante del usuario
  EXISTS (
    SELECT 1 
    FROM tables 
    WHERE tables.id = orders.table_id
    AND (
      tables.admin_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = tables.admin_id
      )
    )
  )
);

CREATE POLICY orders_insert_policy
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario es administrado por el dueño de la mesa
  EXISTS (
    SELECT 1 
    FROM tables 
    WHERE tables.id = table_id
    AND (
      tables.admin_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = tables.admin_id
      )
    )
  )
);

CREATE POLICY orders_update_policy
ON orders
FOR UPDATE
TO authenticated
USING (
  -- El usuario es el administrador del pedido
  admin_id = auth.uid()
  OR
  -- El pedido pertenece a una mesa del restaurante del usuario
  EXISTS (
    SELECT 1 
    FROM tables 
    WHERE tables.id = orders.table_id
    AND (
      tables.admin_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = tables.admin_id
      )
    )
  )
)
WITH CHECK (
  -- Las mismas condiciones que USING
  admin_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 
    FROM tables 
    WHERE tables.id = orders.table_id
    AND (
      tables.admin_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = tables.admin_id
      )
    )
  )
);

CREATE POLICY orders_delete_policy
ON orders
FOR DELETE
TO authenticated
USING (
  -- El usuario es el administrador del pedido
  admin_id = auth.uid()
);

-- 6. Actualizar los registros existentes de orders
UPDATE orders
SET admin_id = (
  SELECT admin_id 
  FROM tables 
  WHERE tables.id = orders.table_id
)
WHERE admin_id IS NULL;

-- 7. Crear trigger para orders
CREATE OR REPLACE FUNCTION set_order_admin_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NULL THEN
    SELECT admin_id INTO NEW.admin_id
    FROM tables
    WHERE tables.id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_admin_id_trigger ON orders;
CREATE TRIGGER set_order_admin_id_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_admin_id(); 