-- POLÍTICAS DE SEGURIDAD PARA AISLAR DATOS ENTRE ADMINISTRADORES
-- Este archivo contiene políticas RLS (Row Level Security) para asegurar
-- que cada administrador solo pueda ver y gestionar sus propios datos

-- Activar RLS en todas las tablas principales
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Política para tablas: cada administrador solo ve sus propias mesas
DROP POLICY IF EXISTS tables_isolation_policy ON tables;
CREATE POLICY tables_isolation_policy ON tables
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT admin_id FROM user_profiles WHERE user_id = auth.uid()
    ) OR
    user_id IN (
      SELECT user_id FROM user_profiles WHERE admin_id = auth.uid()
    )
  );

-- Política para reservas: cada administrador solo ve sus propias reservas
DROP POLICY IF EXISTS reservations_isolation_policy ON reservations;
CREATE POLICY reservations_isolation_policy ON reservations
  USING (
    table_id IN (
      SELECT id FROM tables WHERE user_id = auth.uid() OR 
      user_id IN (
        SELECT user_id FROM user_profiles WHERE admin_id = auth.uid()
      )
    )
  );

-- Política para staff: cada administrador solo ve su propio staff
DROP POLICY IF EXISTS staff_isolation_policy ON staff;
CREATE POLICY staff_isolation_policy ON staff
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid()
  );

-- Política para perfiles de usuario: cada administrador solo ve sus propios perfiles
DROP POLICY IF EXISTS user_profiles_isolation_policy ON user_profiles;
CREATE POLICY user_profiles_isolation_policy ON user_profiles
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid()
  );

-- Política para órdenes: cada administrador solo ve sus propias órdenes
DROP POLICY IF EXISTS orders_isolation_policy ON orders;
CREATE POLICY orders_isolation_policy ON orders
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid() OR
    table_id IN (
      SELECT id FROM tables WHERE user_id = auth.uid() OR 
      user_id IN (
        SELECT user_id FROM user_profiles WHERE admin_id = auth.uid()
      )
    )
  );

-- Política para items de orden: solo se ven los de las órdenes a las que se tiene acceso
DROP POLICY IF EXISTS order_items_isolation_policy ON order_items;
CREATE POLICY order_items_isolation_policy ON order_items
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid() OR
    order_id IN (
      SELECT id FROM orders WHERE 
      user_id = auth.uid() OR 
      admin_id = auth.uid()
    )
  );

-- Política para categorías de menú: cada administrador solo ve sus propias categorías
DROP POLICY IF EXISTS menu_categories_isolation_policy ON menu_categories;
CREATE POLICY menu_categories_isolation_policy ON menu_categories
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid()
  );

-- Política para items de menú: cada administrador solo ve sus propios items
DROP POLICY IF EXISTS menu_items_isolation_policy ON menu_items;
CREATE POLICY menu_items_isolation_policy ON menu_items
  USING (
    user_id = auth.uid() OR 
    admin_id = auth.uid() OR
    category_id IN (
      SELECT id FROM menu_categories WHERE 
      user_id = auth.uid() OR 
      admin_id = auth.uid()
    )
  );

-- Asegurarse que las políticas de inserción también estén correctas
-- Estas políticas permiten a los usuarios insertar datos pero siempre
-- asignando su propio ID como user_id
DROP POLICY IF EXISTS tables_insert_policy ON tables;
CREATE POLICY tables_insert_policy ON tables FOR INSERT
  WITH CHECK (true);  -- Permitir inserción, pero el trigger asignará el user_id correcto

DROP POLICY IF EXISTS orders_insert_policy ON orders;
CREATE POLICY orders_insert_policy ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid() OR admin_id = auth.uid());

-- Trigger para asegurar que al insertar registros siempre se asigne el usuario actual
CREATE OR REPLACE FUNCTION set_auth_user() RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a las tablas principales
DROP TRIGGER IF EXISTS set_user_id_on_tables ON tables;
CREATE TRIGGER set_user_id_on_tables
  BEFORE INSERT ON tables
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user();

DROP TRIGGER IF EXISTS set_user_id_on_menu_categories ON menu_categories;
CREATE TRIGGER set_user_id_on_menu_categories
  BEFORE INSERT ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user();

DROP TRIGGER IF EXISTS set_user_id_on_menu_items ON menu_items;
CREATE TRIGGER set_user_id_on_menu_items
  BEFORE INSERT ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user(); 