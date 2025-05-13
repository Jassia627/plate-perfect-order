-- =========================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- Este script crea un trigger para asignar automáticamente 
-- admin_id al crear nuevas mesas
-- =========================================================

-- Crear función para asignar admin_id basado en el user_id
CREATE OR REPLACE FUNCTION set_admin_id() RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_admin_id UUID;
BEGIN
  -- Asignar user_id (ya tiene trigger existente pero aseguramos)
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  -- Determinar si el usuario es admin o mesero
  SELECT role, admin_id INTO v_role, v_admin_id
  FROM user_profiles
  WHERE user_id = NEW.user_id;
  
  -- Si es admin, admin_id = user_id
  IF v_role = 'admin' THEN
    NEW.admin_id = NEW.user_id;
  -- Si es mesero, usar el admin_id del perfil
  ELSIF v_admin_id IS NOT NULL THEN
    NEW.admin_id = v_admin_id;
  -- En otros casos, dejar como está
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger existente (solo asigna user_id)
DROP TRIGGER IF EXISTS set_user_id_on_tables ON tables;

-- Crear nuevo trigger que asigne tanto user_id como admin_id
CREATE TRIGGER set_user_and_admin_id_on_tables
  BEFORE INSERT ON tables
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_id();

-- Verificar que el trigger se ha creado
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  event_object_table = 'tables'
ORDER BY 
  trigger_name; 