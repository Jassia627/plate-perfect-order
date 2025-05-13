-- Script para corregir las políticas RLS de la tabla tables

-- 1. Eliminar la política existente
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias mesas" ON public.tables;
DROP POLICY IF EXISTS tables_select_policy ON public.tables;

-- 2. Crear la nueva política más permisiva que implementa la jerarquía de usuarios
CREATE POLICY tables_select_policy
ON public.tables
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de las mesas
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de las mesas (mesero que ve mesas de su admin)
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = tables.user_id
  )
  OR
  -- El usuario es administrador del dueño de las mesas (admin viendo mesas de sus meseros)
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = tables.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
);

-- 3. Política para la inserción (solo administradores)
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias mesas" ON public.tables;
CREATE POLICY tables_insert_policy
ON public.tables
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario es el creador de la mesa
  auth.uid() = user_id
  AND
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- 4. Política para actualización
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias mesas" ON public.tables;
CREATE POLICY tables_update_policy
ON public.tables
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño de las mesas
  user_id = auth.uid()
  OR
  -- El usuario es mesero responsable de esa mesa (si tiene server asignado)
  (
    server IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.admin_id = tables.user_id
    )
  )
)
WITH CHECK (
  -- Mismas condiciones que en USING
  user_id = auth.uid()
  OR
  (
    server IS NOT NULL 
    AND
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.admin_id = tables.user_id
    )
  )
);

-- 5. Política para eliminación (solo administradores)
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias mesas" ON public.tables;
CREATE POLICY tables_delete_policy
ON public.tables
FOR DELETE
TO authenticated
USING (
  -- Solo el dueño (admin) puede eliminar
  user_id = auth.uid()
);

-- 6. Actualizar registros existentes para asegurar que tengan valores consistentes
-- Poner server a NULL si está vacío para evitar problemas con la política
UPDATE public.tables
SET server = NULL
WHERE server = '';

-- Añadir una función para depuración si es necesario
CREATE OR REPLACE FUNCTION debug_table_access(table_id UUID)
RETURNS TABLE(
  has_access BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_role TEXT;
  current_user_admin_id UUID;
  table_owner_id UUID;
BEGIN
  -- Obtener información del usuario actual
  SELECT role, admin_id INTO current_user_role, current_user_admin_id
  FROM public.user_profiles
  WHERE user_id = current_user_id;
  
  -- Obtener propietario de la mesa
  SELECT user_id INTO table_owner_id
  FROM public.tables
  WHERE id = table_id;
  
  -- Comprobar acceso
  IF table_owner_id = current_user_id THEN
    RETURN QUERY SELECT TRUE, 'Usuario es propietario de la mesa';
  ELSIF current_user_admin_id = table_owner_id THEN
    RETURN QUERY SELECT TRUE, 'Usuario es administrado por el propietario de la mesa';
  ELSIF EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = table_owner_id 
    AND admin_id = current_user_id
  ) THEN
    RETURN QUERY SELECT TRUE, 'Usuario es administrador del propietario de la mesa';
  ELSE
    RETURN QUERY SELECT FALSE, 'No tiene acceso a esta mesa';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 