-- Script para corregir políticas RLS de acceso a órdenes para chefs
-- Asegura que los chefs puedan ver las órdenes y sus items del administrador

-- 1. Eliminar políticas existentes para orders
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios pedidos" ON public.orders;
DROP POLICY IF EXISTS orders_select_policy ON public.orders;

-- 2. Eliminar políticas existentes para order_items
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios ítems de pedidos" ON public.order_items;
DROP POLICY IF EXISTS order_items_select_policy ON public.order_items;

-- 3. Crear política permisiva para SELECT de orders
CREATE POLICY orders_select_policy
ON public.orders
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de las órdenes
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de las órdenes
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = orders.user_id
  )
  OR
  -- El usuario es administrador del dueño de las órdenes
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = orders.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
);

-- 4. Crear política permisiva para SELECT de order_items
CREATE POLICY order_items_select_policy
ON public.order_items
FOR SELECT
TO authenticated
USING (
  -- El usuario es dueño de los items
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de los items
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = order_items.user_id
  )
  OR
  -- El usuario es administrador del dueño de los items
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = order_items.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
);

-- 5. Políticas para UPDATE (permitir a meseros y chefs actualizar estados)
DROP POLICY IF EXISTS orders_update_policy ON public.orders;
CREATE POLICY orders_update_policy
ON public.orders
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño de las órdenes
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de las órdenes y tiene rol de mesero o chef
  (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.admin_id = orders.user_id
      AND (user_profiles.role = 'waiter' OR user_profiles.role = 'chef' OR user_profiles.role LIKE '%chef%' OR user_profiles.role LIKE '%cocina%')
    )
  )
)
WITH CHECK (
  -- Las mismas condiciones que USING
  user_id = auth.uid()
  OR
  (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.admin_id = orders.user_id
      AND (user_profiles.role = 'waiter' OR user_profiles.role = 'chef' OR user_profiles.role LIKE '%chef%' OR user_profiles.role LIKE '%cocina%')
    )
  )
);

-- 6. Políticas para UPDATE de order_items (permitir a meseros y chefs actualizar estados)
DROP POLICY IF EXISTS order_items_update_policy ON public.order_items;
CREATE POLICY order_items_update_policy
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño de los items
  user_id = auth.uid()
  OR
  -- El usuario es administrado por el dueño de los items y tiene rol de mesero o chef
  (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.admin_id = order_items.user_id
      AND (user_profiles.role = 'waiter' OR user_profiles.role = 'chef' OR user_profiles.role LIKE '%chef%' OR user_profiles.role LIKE '%cocina%')
    )
  )
)
WITH CHECK (
  -- Las mismas condiciones que USING
  user_id = auth.uid()
  OR
  (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.admin_id = order_items.user_id
      AND (user_profiles.role = 'waiter' OR user_profiles.role = 'chef' OR user_profiles.role LIKE '%chef%' OR user_profiles.role LIKE '%cocina%')
    )
  )
);

-- 7. Políticas para INSERT (permitir a meseros crear órdenes)
-- Para orders
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
CREATE POLICY orders_insert_policy
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- El usuario es mesero
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND (user_profiles.role = 'waiter' OR user_profiles.role LIKE '%mesero%' OR user_profiles.role LIKE '%camarero%')
  )
);

-- Para order_items
DROP POLICY IF EXISTS order_items_insert_policy ON public.order_items;
CREATE POLICY order_items_insert_policy
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario es administrador
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- El usuario es mesero
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND (user_profiles.role = 'waiter' OR user_profiles.role LIKE '%mesero%' OR user_profiles.role LIKE '%camarero%')
  )
);

-- 8. Función de diagnóstico para ayudar a solucionar problemas
CREATE OR REPLACE FUNCTION debug_orders_access(p_user_id UUID, p_order_id UUID)
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
BEGIN
  -- Obtener información del usuario
  SELECT role, admin_id INTO v_role, v_admin_id
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- Obtener propietario de la orden
  SELECT user_id INTO v_owner_id
  FROM public.orders
  WHERE id = p_order_id;
  
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