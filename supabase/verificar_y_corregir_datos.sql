-- Script para verificar y corregir datos para asegurar aislamiento entre administradores
-- ==============================================================================

-- 1. Listar administradores actuales
SELECT 
  up.user_id, 
  au.email,
  up.role 
FROM 
  user_profiles up
JOIN 
  auth.users au ON up.user_id = au.id
WHERE 
  up.role = 'admin'
ORDER BY 
  au.email;

-- 2. Mostrar mesas de cada administrador
SELECT 
  t.number,
  t.user_id,
  t.admin_id,
  (SELECT email FROM auth.users WHERE id = t.user_id) as user_email,
  (SELECT email FROM auth.users WHERE id = t.admin_id) as admin_email
FROM 
  tables t
ORDER BY 
  t.number;

-- 3. Corregir casos donde admin_id no coincide con user_id para mesas de administradores
UPDATE tables
SET admin_id = user_id
WHERE 
  user_id IN (
    SELECT user_id 
    FROM user_profiles 
    WHERE role = 'admin'
  )
  AND
  admin_id <> user_id;

-- 4. Crear una vista temporal para verificar las políticas
CREATE OR REPLACE VIEW debug_tables_visibility AS
WITH usuarios AS (
  SELECT 
    up.user_id, 
    up.role,
    up.admin_id,
    au.email,
    (SELECT COUNT(*) FROM tables WHERE user_id = up.user_id) as mesas_propias,
    (SELECT COUNT(*) FROM tables WHERE admin_id = up.user_id) as mesas_administradas,
    (
      SELECT ARRAY_AGG(t.number) 
      FROM tables t 
      WHERE t.user_id = up.user_id
    ) as mesas_propias_numeros
  FROM 
    user_profiles up
  JOIN 
    auth.users au ON up.user_id = au.id
),
mesas AS (
  SELECT 
    t.id,
    t.number,
    t.user_id,
    t.admin_id,
    (SELECT email FROM auth.users WHERE id = t.user_id) as user_email,
    (SELECT email FROM auth.users WHERE id = t.admin_id) as admin_email
  FROM 
    tables t
)
SELECT 
  u.email as usuario,
  u.role as rol,
  (CASE WHEN u.admin_id IS NULL THEN 'No tiene admin' ELSE (SELECT email FROM auth.users WHERE id = u.admin_id) END) as administrado_por,
  u.mesas_propias,
  u.mesas_propias_numeros,
  m.number as mesa,
  m.user_email as mesa_propietario,
  m.admin_email as mesa_admin,
  (
    CASE 
      WHEN m.user_id = u.user_id THEN 'Propietario'
      WHEN m.admin_id = u.user_id THEN 'Administrador'
      WHEN u.user_id IN (SELECT up.user_id FROM user_profiles up WHERE up.admin_id = m.user_id) THEN 'Subordinado del propietario'
      WHEN m.user_id IN (SELECT up.user_id FROM user_profiles up WHERE up.admin_id = u.user_id) THEN 'Propietario es subordinado'
      ELSE 'No debería ver esta mesa'
    END
  ) as relacion
FROM 
  usuarios u
CROSS JOIN
  mesas m
ORDER BY 
  u.email, m.number;

-- 5. Verificar las relaciones
SELECT * FROM debug_tables_visibility 
WHERE relacion = 'No debería ver esta mesa';

-- 6. CORREGIR: hacer que las mesas solo se vean para la jerarquía correcta
-- Esta sentencia anulará políticas demasiado permisivas
DO $$
DECLARE
  policy_already_exists BOOLEAN;
BEGIN
  -- Verificar si la política ya existe
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tables' 
    AND policyname = 'tables_strict_isolation'
  ) INTO policy_already_exists;
  
  -- Si no existe, crearla
  IF NOT policy_already_exists THEN
    -- Eliminar políticas más permisivas
    EXECUTE 'DROP POLICY IF EXISTS tables_visibility_fixed ON tables';
    EXECUTE 'DROP POLICY IF EXISTS tables_isolation_policy ON tables';
    EXECUTE 'DROP POLICY IF EXISTS "Usuarios pueden ver sus propias mesas" ON tables';
    
    -- Crear política estricta
    EXECUTE 'CREATE POLICY tables_strict_isolation ON tables
      FOR SELECT
      USING (
        -- El usuario es propietario de las mesas
        auth.uid() = user_id 
        OR 
        -- O el usuario es subordinado viendo mesas de su admin directo
        (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.admin_id = tables.user_id
          )
        )
        OR
        -- O el usuario es admin viendo mesas de sus subordinados directos
        (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = tables.user_id 
            AND user_profiles.admin_id = auth.uid()
          )
        )
      )';
  END IF;
END $$;

-- 7. Verificar nuevamente las políticas existentes
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  SUBSTRING(qual FOR 200) as condition_preview
FROM 
  pg_policies
WHERE 
  tablename = 'tables'
ORDER BY 
  policyname; 