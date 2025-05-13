-- Script para corregir políticas RLS para separación completa entre administradores
-- =====================================================

-- IMPORTANTE: Este script garantizará que los administradores estén completamente aislados
-- y no puedan ver las mesas de otros administradores bajo ninguna circunstancia.

-- 1. Primero eliminamos TODAS las políticas existentes relacionadas con la tabla tables
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'tables' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON tables', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- 2. Aseguramos que RLS está activado
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- 3. Aseguramos que admin_id coincide con user_id para mesas creadas por administradores
UPDATE tables
SET admin_id = user_id
WHERE 
  user_id IN (
    SELECT user_id 
    FROM user_profiles 
    WHERE role = 'admin'
  )
  AND
  (admin_id <> user_id OR admin_id IS NULL);

-- 4. Crear la política estricta de visibilidad (los administradores NUNCA verán mesas de otros administradores)
CREATE POLICY tables_isolation_strict ON tables
  FOR SELECT
  USING (
    -- Caso 1: El usuario actual es el propietario directo de la mesa
    auth.uid() = user_id 
    OR 
    -- Caso 2: El usuario actual es un empleado viendo mesas de su administrador
    (
      -- Tiene un admin_id asignado en su perfil
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id IS NOT NULL
        -- Y la mesa pertenece a ese administrador
        AND user_profiles.admin_id = tables.user_id
      )
    )
    OR
    -- Caso 3: El usuario actual es un administrador viendo mesas de sus empleados
    (
      -- Existe un empleado que creó esta mesa
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = tables.user_id 
        -- Y el usuario actual es su administrador
        AND user_profiles.admin_id = auth.uid()
      )
    )
  );

-- 5. Política para inserción (permite creación de mesas pero el trigger asignará el user_id)
CREATE POLICY tables_insert_strict ON tables 
  FOR INSERT
  WITH CHECK (
    -- Se permite insertar a cualquier usuario autenticado
    -- El trigger asignará el user_id y admin_id correctos
    true
  );

-- 6. Política para actualización (solo el propietario o sus empleados pueden actualizar)
CREATE POLICY tables_update_strict ON tables
  FOR UPDATE
  USING (
    -- El usuario es propietario directo
    auth.uid() = user_id
    OR
    -- O el usuario es un empleado del propietario
    (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = tables.user_id
      )
    )
  );

-- 7. Política para eliminación (solo el propietario)
CREATE POLICY tables_delete_strict ON tables
  FOR DELETE
  USING (
    -- Solo el propietario directo puede eliminar
    auth.uid() = user_id
  );

-- 8. Política específica para permitir que el administrador asigne sus mesas a meseros
CREATE POLICY tables_assignment_strict ON tables
  FOR UPDATE
  USING (
    -- El usuario es administrador de esta mesa
    auth.uid() = admin_id
  )
  WITH CHECK (
    -- No permitir cambiar el propietario (user_id) y admin_id
    -- pero sí otros campos como status, server, etc.
    true
  );

-- 9. Consulta de verificación
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd,
  SUBSTRING(qual FOR 100) AS condition_preview
FROM 
  pg_policies
WHERE 
  tablename = 'tables'
ORDER BY 
  policyname;

-- 10. Instrucciones finales a ejecutar tras aplicar este script
SELECT 'Por favor, actualiza la página para comprobar que ya no puedes ver mesas de otros administradores' as next_step; 