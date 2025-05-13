-- Script para corregir la política RLS de visibilidad de mesas
-- Este script soluciona el problema de que todos los usuarios ven las mismas mesas

-- Primero, eliminar todas las políticas existentes relacionadas con la tabla tables
DROP POLICY IF EXISTS tables_isolation_policy ON tables;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias mesas" ON tables;
DROP POLICY IF EXISTS "tables_select_policy" ON tables;
DROP POLICY IF EXISTS tables_select_policy ON tables;

-- Crear la política corregida con nuevo nombre para evitar conflictos
CREATE POLICY tables_visibility_fixed ON tables
  FOR SELECT
  USING (
    -- El usuario es propietario de las mesas (usuario admin)
    auth.uid() = user_id 
    OR 
    -- O el usuario es empleado del propietario (mesero viendo mesas de su admin)
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE admin_id = tables.user_id
    )
    OR
    -- O el usuario es admin y la mesa pertenece a uno de sus empleados
    user_id IN (
      SELECT user_id FROM user_profiles WHERE admin_id = auth.uid()
    )
  );

-- Eliminar políticas de inserción existentes
DROP POLICY IF EXISTS tables_insert_policy ON tables;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias mesas" ON tables;

-- Crear nueva política de inserción
CREATE POLICY tables_insert_fixed ON tables 
  FOR INSERT
  WITH CHECK (
    -- Se permite insertar a todos los usuarios autenticados
    -- El trigger set_user_id_on_tables asignará el user_id correcto
    true
  );

-- Eliminar políticas de actualización existentes
DROP POLICY IF EXISTS tables_update_policy ON tables;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias mesas" ON tables;

-- Crear nueva política de actualización
CREATE POLICY tables_update_fixed ON tables
  FOR UPDATE
  USING (
    -- El usuario es dueño de las mesas
    auth.uid() = user_id
    OR
    -- O el usuario es empleado responsable de la mesa
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE admin_id = tables.user_id
    )
  );

-- Eliminar políticas de eliminación existentes
DROP POLICY IF EXISTS tables_delete_policy ON tables;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias mesas" ON tables;

-- Crear nueva política de eliminación
CREATE POLICY tables_delete_fixed ON tables
  FOR DELETE
  USING (
    -- Solo el propietario puede eliminar
    auth.uid() = user_id
  );

-- Verificar que el trigger para asignar user_id existe
DROP TRIGGER IF EXISTS set_user_id_on_tables ON tables;

-- Crear o reemplazar la función set_auth_user
CREATE OR REPLACE FUNCTION set_auth_user() RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
CREATE TRIGGER set_user_id_on_tables
  BEFORE INSERT ON tables
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user();

-- Mostrar las políticas resultantes
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies
WHERE 
  tablename = 'tables'
ORDER BY 
  policyname; 