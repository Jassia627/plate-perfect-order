-- =========================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- Este script corrige el campo admin_id en la tabla tables
-- y actualiza las políticas de seguridad RLS
-- =========================================================

-- 1. Primero verificar si existe el campo admin_id en la tabla tables
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tables' 
    AND column_name = 'admin_id'
  ) INTO column_exists;
  
  -- Si no existe, añadir la columna
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE tables ADD COLUMN admin_id UUID REFERENCES auth.users(id)';
    RAISE NOTICE 'Columna admin_id añadida a la tabla tables';
  ELSE
    RAISE NOTICE 'La columna admin_id ya existe en la tabla tables';
  END IF;
END $$;

-- 2. Para cada mesa, actualizar admin_id con el mismo valor que user_id
-- (asumiendo que el creador de la mesa es el administrador)
UPDATE tables 
SET admin_id = user_id 
WHERE admin_id IS NULL;

-- 3. Para mesas creadas por meseros, actualizar admin_id al administrador del mesero
UPDATE tables t
SET admin_id = up.admin_id
FROM user_profiles up
WHERE t.user_id = up.user_id
AND up.role != 'admin'
AND up.admin_id IS NOT NULL;

-- 4. Mostrar las mesas actualizadas para verificación
SELECT 
  id, 
  number, 
  status, 
  user_id, 
  admin_id,
  (SELECT email FROM auth.users WHERE id = tables.user_id) as user_email,
  (SELECT email FROM auth.users WHERE id = tables.admin_id) as admin_email
FROM 
  tables 
ORDER BY 
  number;

-- 5. Volver a aplicar las políticas RLS
DROP POLICY IF EXISTS tables_visibility_fixed ON tables;
CREATE POLICY tables_visibility_fixed ON tables
  FOR SELECT
  USING (
    -- El usuario es propietario de las mesas (usuario admin)
    auth.uid() = user_id 
    OR 
    -- O el usuario es mesero viendo mesas de su admin
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE admin_id = tables.user_id
    )
    OR
    -- O el usuario es admin y la mesa pertenece a uno de sus empleados
    user_id IN (
      SELECT user_id FROM user_profiles WHERE admin_id = auth.uid()
    )
    OR
    -- O esta mesa fue creada por el admin del usuario actual
    admin_id = auth.uid()
  ); 