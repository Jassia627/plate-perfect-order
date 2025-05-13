-- Script para corregir políticas RLS de acceso al menú para meseros
-- Asegura que los meseros puedan ver las categorías y productos del menú de su administrador

-- 1. Eliminar políticas existentes para menu_categories
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias categorías" ON public.menu_categories;
DROP POLICY IF EXISTS menu_categories_select_policy ON public.menu_categories;

-- 2. Eliminar políticas existentes para menu_items
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios productos" ON public.menu_items;
DROP POLICY IF EXISTS menu_items_select_policy ON public.menu_items;

-- 3. Crear política permisiva para SELECT de menu_categories
CREATE POLICY menu_categories_select_policy
ON public.menu_categories
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de las categorías
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de las categorías
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = menu_categories.user_id
  )
  OR
  -- El usuario es administrador del dueño de las categorías
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = menu_categories.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
);

-- 4. Crear política permisiva para SELECT de menu_items
CREATE POLICY menu_items_select_policy
ON public.menu_items
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de los productos
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de los productos
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = menu_items.user_id
  )
  OR
  -- El usuario es administrador del dueño de los productos
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = menu_items.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
);

-- 5. Crear políticas restrictivas para INSERT/UPDATE/DELETE
-- Para menu_categories (solo administradores)
DROP POLICY IF EXISTS menu_categories_insert_policy ON public.menu_categories;
CREATE POLICY menu_categories_insert_policy
ON public.menu_categories
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo administradores pueden insertar
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS menu_categories_update_policy ON public.menu_categories;
CREATE POLICY menu_categories_update_policy
ON public.menu_categories
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño y admin
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  -- El usuario es dueño y admin
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS menu_categories_delete_policy ON public.menu_categories;
CREATE POLICY menu_categories_delete_policy
ON public.menu_categories
FOR DELETE
TO authenticated
USING (
  -- El usuario es dueño y admin
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Para menu_items (solo administradores)
DROP POLICY IF EXISTS menu_items_insert_policy ON public.menu_items;
CREATE POLICY menu_items_insert_policy
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo administradores pueden insertar
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS menu_items_update_policy ON public.menu_items;
CREATE POLICY menu_items_update_policy
ON public.menu_items
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño y admin
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  -- El usuario es dueño y admin
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS menu_items_delete_policy ON public.menu_items;
CREATE POLICY menu_items_delete_policy
ON public.menu_items
FOR DELETE
TO authenticated
USING (
  -- El usuario es dueño y admin
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- 6. Crear una función de diagnóstico para ayudar a solucionar problemas
CREATE OR REPLACE FUNCTION debug_menu_access(p_user_id UUID, p_menu_type TEXT, p_item_id UUID)
RETURNS TABLE(
  has_access BOOLEAN,
  reason TEXT,
  user_role TEXT,
  admin_id UUID
) AS $$
DECLARE
  v_role TEXT;
  v_admin_id UUID;
  v_owner_id UUID;
  v_table_name TEXT;
BEGIN
  -- Determinar tabla
  IF p_menu_type = 'category' THEN
    v_table_name := 'menu_categories';
  ELSE
    v_table_name := 'menu_items';
  END IF;
  
  -- Obtener información del usuario
  SELECT role, admin_id INTO v_role, v_admin_id
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- Obtener propietario del ítem
  EXECUTE format('SELECT user_id FROM public.%I WHERE id = $1', v_table_name)
  INTO v_owner_id
  USING p_item_id;
  
  -- Devolver diagnóstico
  RETURN QUERY
  SELECT 
    CASE
      WHEN v_owner_id = p_user_id THEN TRUE
      WHEN v_admin_id = v_owner_id THEN TRUE
      WHEN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_id = v_owner_id 
        AND admin_id = p_user_id
      ) THEN TRUE
      ELSE FALSE
    END,
    CASE
      WHEN v_owner_id = p_user_id THEN 'Usuario es propietario'
      WHEN v_admin_id = v_owner_id THEN 'Usuario es administrado por el propietario'
      WHEN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_id = v_owner_id 
        AND admin_id = p_user_id
      ) THEN 'Usuario es administrador del propietario'
      ELSE 'No tiene acceso'
    END,
    v_role,
    v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 