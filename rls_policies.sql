-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS staff_insert_policy ON public.staff;
DROP POLICY IF EXISTS staff_select_policy ON public.staff;
DROP POLICY IF EXISTS staff_update_policy ON public.staff;
DROP POLICY IF EXISTS staff_delete_policy ON public.staff;
DROP POLICY IF EXISTS user_profiles_insert_policy ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_select_policy ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_policy ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_policy ON public.user_profiles;
DROP POLICY IF EXISTS restaurant_settings_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_insert_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_select_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_update_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_delete_policy ON public.restaurant_settings;

-- Políticas RLS para la tabla staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Política para crear registros en la tabla staff
CREATE POLICY staff_insert_policy
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (true); -- Permitir la inserción a todos los usuarios autenticados

-- Política para leer registros en la tabla staff
CREATE POLICY staff_select_policy
ON public.staff
FOR SELECT
TO authenticated
USING (
  -- Un usuario puede ver los registros donde es el administrador
  -- o donde él mismo es el miembro del staff
  admin_id = auth.uid() OR 
  user_id = auth.uid()
);

-- Política para actualizar registros en la tabla staff
CREATE POLICY staff_update_policy
ON public.staff
FOR UPDATE
TO authenticated
USING (
  -- Solo el administrador puede actualizar sus staff
  admin_id = auth.uid()
)
WITH CHECK (
  -- Solo el administrador puede actualizar sus staff
  admin_id = auth.uid()
);

-- Política para eliminar registros en la tabla staff
CREATE POLICY staff_delete_policy
ON public.staff
FOR DELETE
TO authenticated
USING (
  -- Solo el administrador puede eliminar sus staff
  admin_id = auth.uid()
);

-- Políticas RLS para la tabla user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para crear perfiles de usuario
CREATE POLICY user_profiles_insert_policy
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (true); -- Permitir la inserción a todos los usuarios autenticados

-- Política para leer perfiles de usuario
CREATE POLICY user_profiles_select_policy
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Un usuario puede ver su propio perfil
  -- o los perfiles donde es el administrador
  user_id = auth.uid() OR 
  admin_id = auth.uid()
);

-- Política para actualizar perfiles de usuario
CREATE POLICY user_profiles_update_policy
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  -- Un usuario puede actualizar su propio perfil
  -- o los perfiles donde es el administrador
  user_id = auth.uid() OR 
  admin_id = auth.uid()
)
WITH CHECK (
  -- Un usuario puede actualizar su propio perfil
  -- o los perfiles donde es el administrador
  user_id = auth.uid() OR 
  admin_id = auth.uid()
);

-- Política para eliminar perfiles de usuario
CREATE POLICY user_profiles_delete_policy
ON public.user_profiles
FOR DELETE
TO authenticated
USING (
  -- Solo el administrador puede eliminar perfiles
  admin_id = auth.uid()
);

-- Asegurar que las tablas de restaurant_settings y otras tablas relacionadas 
-- también tengan políticas RLS apropiadas
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Políticas separadas para restaurant_settings en lugar de una política ALL
-- Política para seleccionar configuraciones del restaurante
CREATE POLICY restaurant_settings_select_policy
ON public.restaurant_settings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT user_id FROM public.user_profiles
    WHERE admin_id = auth.uid()
  )
);

-- Política para insertar configuraciones del restaurante
CREATE POLICY restaurant_settings_insert_policy
ON public.restaurant_settings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Política para actualizar configuraciones del restaurante
CREATE POLICY restaurant_settings_update_policy
ON public.restaurant_settings
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT user_id FROM public.user_profiles
    WHERE admin_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  user_id IN (
    SELECT user_id FROM public.user_profiles
    WHERE admin_id = auth.uid()
  )
);

-- Política para eliminar configuraciones del restaurante
CREATE POLICY restaurant_settings_delete_policy
ON public.restaurant_settings
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT user_id FROM public.user_profiles
    WHERE admin_id = auth.uid()
  )
); 