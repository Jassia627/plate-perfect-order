-- Script que sólo añade políticas RLS y la función RPC sin modificar la estructura

-- 1. Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS restaurant_settings_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_select_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_insert_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_update_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_delete_policy ON public.restaurant_settings;

-- 2. Habilitar RLS (Row Level Security) para la tabla
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- 3. Crear una política más permisiva para SELECT
CREATE POLICY restaurant_settings_select_policy
ON public.restaurant_settings
FOR SELECT
TO authenticated
USING (
    -- El usuario es dueño de los settings
    user_id = auth.uid()
    OR
    -- El usuario es administrado por el dueño de los settings
    EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.admin_id = restaurant_settings.user_id
    )
    OR
    -- El usuario es administrador del dueño de los settings
    EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.user_id = restaurant_settings.user_id 
        AND user_profiles.admin_id = auth.uid()
    )
);

-- 4. Política para INSERT - solo el propietario puede insertar sus propios settings
CREATE POLICY restaurant_settings_insert_policy
ON public.restaurant_settings
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

-- 5. Política para UPDATE - solo el propietario o administrador puede actualizar
CREATE POLICY restaurant_settings_update_policy
ON public.restaurant_settings
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.user_id = restaurant_settings.user_id 
        AND user_profiles.admin_id = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.user_id = restaurant_settings.user_id 
        AND user_profiles.admin_id = auth.uid()
    )
);

-- 6. Política para DELETE - solo el propietario o administrador puede eliminar
CREATE POLICY restaurant_settings_delete_policy
ON public.restaurant_settings
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.user_id = restaurant_settings.user_id 
        AND user_profiles.admin_id = auth.uid()
    )
);

-- 7. Función para obtener configuraciones del restaurante para cualquier usuario
DROP FUNCTION IF EXISTS public.get_restaurant_settings_for_user(UUID);
CREATE OR REPLACE FUNCTION public.get_restaurant_settings_for_user(
  user_id_param UUID
) RETURNS SETOF public.restaurant_settings AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Intentar obtener el admin_id del usuario
  SELECT admin_id INTO v_admin_id 
  FROM public.user_profiles 
  WHERE user_id = user_id_param;
  
  -- Si el usuario tiene un admin_id, devolver las configuraciones de ese admin
  IF v_admin_id IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.restaurant_settings
    WHERE user_id = v_admin_id;
  ELSE
    -- Si no tiene admin_id, devolver las configuraciones del propio usuario
    RETURN QUERY
    SELECT * FROM public.restaurant_settings
    WHERE user_id = user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 