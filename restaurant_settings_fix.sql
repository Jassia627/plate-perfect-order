-- Script para corregir la tabla restaurant_settings y sus políticas

-- 1. Verificar y crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    description TEXT,
    logo_url TEXT,
    dark_mode BOOLEAN DEFAULT false,
    auto_print BOOLEAN DEFAULT false,
    currency TEXT DEFAULT 'EUR',
    tax_percentage NUMERIC DEFAULT 21.0,
    service_charge_percentage NUMERIC DEFAULT 0,
    default_language TEXT DEFAULT 'es',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS restaurant_settings_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_select_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_insert_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_update_policy ON public.restaurant_settings;
DROP POLICY IF EXISTS restaurant_settings_delete_policy ON public.restaurant_settings;

-- 3. Habilitar RLS (Row Level Security) para la tabla
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- 4. Crear una política más permisiva para SELECT
-- Esta política permite que cualquier usuario autenticado pueda ver configuraciones del restaurante
-- si es el propietario O si está asociado a un administrador en user_profiles
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

-- 5. Política para INSERT - solo el propietario puede insertar sus propios settings
CREATE POLICY restaurant_settings_insert_policy
ON public.restaurant_settings
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

-- 6. Política para UPDATE - solo el propietario o administrador puede actualizar
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

-- 7. Política para DELETE - solo el propietario o administrador puede eliminar
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

-- 8. Función para obtener configuraciones del restaurante para cualquier usuario
-- Esta función tiene SECURITY DEFINER para eludir políticas RLS
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

-- 9. Insertar configuraciones por defecto para el usuario administrador si no existen
DO $$
DECLARE
  v_admin_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Obtener todos los usuarios con rol 'admin'
  FOR v_admin_id IN 
    SELECT user_id FROM public.user_profiles WHERE role = 'admin'
  LOOP
    -- Verificar si ya tiene configuraciones
    SELECT EXISTS (
      SELECT 1 FROM public.restaurant_settings WHERE user_id = v_admin_id
    ) INTO v_exists;
    
    -- Si no tiene configuraciones, insertar por defecto
    IF NOT v_exists THEN
      INSERT INTO public.restaurant_settings (
        user_id,
        name,
        address,
        phone,
        email,
        description,
        dark_mode,
        auto_print,
        currency,
        tax_percentage,
        service_charge_percentage,
        default_language,
        theme
      ) VALUES (
        v_admin_id,
        'Mi Restaurante',
        'Dirección del Restaurante',
        '123456789',
        'info@mirestaurante.com',
        'Restaurante de comida mediterránea',
        false,
        false,
        'EUR',
        21.0,
        0,
        'es',
        'light'
      );
    END IF;
  END LOOP;
END $$; 