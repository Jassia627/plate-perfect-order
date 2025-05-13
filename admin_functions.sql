-- Script con funciones administrativas para gestionar personal y perfiles de usuario
-- Estas funciones tendrán SECURITY DEFINER para eludir políticas RLS

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS public.create_staff_member(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_or_update_user_profile(UUID, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.ensure_admin_role(UUID);
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);
DROP FUNCTION IF EXISTS public.delete_staff_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_staff_members_for_admin(UUID);
DROP FUNCTION IF EXISTS public.get_staff_member_by_id(UUID, UUID);

-- 1. Función para crear un miembro del staff
CREATE OR REPLACE FUNCTION public.create_staff_member(
  p_user_id UUID,
  p_name TEXT,
  p_role TEXT,
  p_admin_id UUID,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'active'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insertar el registro con privilegios de SECURITY DEFINER (bypassing RLS)
  INSERT INTO public.staff(
    user_id,
    name,
    role,
    admin_id,
    email,
    phone,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_name,
    p_role,
    p_admin_id,
    p_email,
    p_phone,
    p_status,
    NOW(),
    NOW()
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para crear o actualizar un perfil de usuario
CREATE OR REPLACE FUNCTION public.create_or_update_user_profile(
  p_user_id UUID,
  p_role TEXT,
  p_admin_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe un perfil para este usuario
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE user_id = p_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Actualizar perfil existente
    UPDATE public.user_profiles
    SET 
      role = p_role,
      admin_id = COALESCE(p_admin_id, admin_id),
      restaurant_id = COALESCE(p_restaurant_id, restaurant_id),
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING id INTO v_id;
  ELSE
    -- Crear nuevo perfil
    INSERT INTO public.user_profiles(
      user_id,
      role,
      admin_id,
      restaurant_id,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_role,
      p_admin_id,
      p_restaurant_id,
      NOW(),
      NOW()
    ) RETURNING id INTO v_id;
  END IF;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para verificar y asignar el rol de administrador a un usuario
CREATE OR REPLACE FUNCTION public.ensure_admin_role(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar si ya existe un perfil para este usuario
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE user_id = p_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Verificar si ya es admin
    SELECT (role = 'admin') FROM public.user_profiles
    WHERE user_id = p_user_id INTO v_is_admin;
    
    IF NOT v_is_admin THEN
      -- Actualizar a rol admin
      UPDATE public.user_profiles
      SET 
        role = 'admin',
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  ELSE
    -- Crear nuevo perfil con rol admin
    INSERT INTO public.user_profiles(
      user_id,
      role,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      'admin',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para obtener el perfil de un usuario
CREATE OR REPLACE FUNCTION public.get_user_profile(
  p_user_id UUID
) RETURNS SETOF public.user_profiles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.user_profiles
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para eliminar un miembro del staff
CREATE OR REPLACE FUNCTION public.delete_staff_member(
  p_id UUID,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN := FALSE;
BEGIN
  DELETE FROM public.staff
  WHERE id = p_id AND admin_id = p_admin_id
  RETURNING TRUE INTO v_deleted;
  
  RETURN COALESCE(v_deleted, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para obtener todos los miembros del staff para un admin específico
CREATE OR REPLACE FUNCTION public.get_staff_members_for_admin(
  admin_user_id UUID
) RETURNS SETOF public.staff AS $$
BEGIN
  RETURN QUERY
  SELECT s.* FROM public.staff s
  WHERE s.admin_id = admin_user_id
  OR s.user_id = admin_user_id; -- Incluir al propio admin
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener un miembro del staff por su ID
CREATE OR REPLACE FUNCTION public.get_staff_member_by_id(
  staff_id UUID,
  admin_user_id UUID
) RETURNS SETOF public.staff AS $$
BEGIN
  RETURN QUERY
  SELECT s.* FROM public.staff s
  WHERE s.id = staff_id
  AND (s.admin_id = admin_user_id OR s.user_id = admin_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 