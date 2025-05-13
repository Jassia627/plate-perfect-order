-- Crear función para obtener todos los miembros de personal para un administrador
CREATE OR REPLACE FUNCTION public.get_staff_members_for_admin(admin_user_id UUID)
RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', up.id,
      'user_id', up.user_id,
      'email', u.email,
      'role', up.role,
      'name', s.name,
      'admin_id', up.admin_id,
      'restaurant_id', up.restaurant_id,
      'created_at', up.created_at,
      'updated_at', up.updated_at
    )
  FROM 
    public.user_profiles up
  JOIN 
    auth.users u ON up.user_id = u.id
  LEFT JOIN 
    public.staff s ON s.user_id = up.user_id
  WHERE 
    up.admin_id = admin_user_id OR 
    up.user_id = admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para obtener un miembro de personal específico
CREATE OR REPLACE FUNCTION public.get_staff_member_by_id(staff_id UUID, admin_user_id UUID)
RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', up.id,
      'user_id', up.user_id,
      'email', u.email,
      'role', up.role,
      'name', s.name,
      'admin_id', up.admin_id,
      'restaurant_id', up.restaurant_id,
      'created_at', up.created_at,
      'updated_at', up.updated_at
    )
  FROM 
    public.user_profiles up
  JOIN 
    auth.users u ON up.user_id = u.id
  LEFT JOIN 
    public.staff s ON s.user_id = up.user_id
  WHERE 
    up.id = staff_id AND
    (up.admin_id = admin_user_id OR up.user_id = admin_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 