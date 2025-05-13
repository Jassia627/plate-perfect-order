-- Función RPC para crear un miembro del staff con privilegios elevados
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