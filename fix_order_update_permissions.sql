-- Script para corregir las políticas RLS de actualización de estado en órdenes
-- Objetivo: Permitir que los chefs y meseros puedan actualizar el estado de órdenes y sus ítems

-- 1. Eliminar las políticas de actualización actuales para orders
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios pedidos" ON public.orders;
DROP POLICY IF EXISTS orders_update_policy ON public.orders;

-- 2. Eliminar las políticas de actualización actuales para order_items
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios ítems de pedidos" ON public.order_items;
DROP POLICY IF EXISTS order_items_update_policy ON public.order_items;

-- 3. Crear una nueva política de actualización para orders que permita a chefs y meseros
CREATE POLICY orders_update_policy
ON public.orders
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño de las órdenes
  user_id = auth.uid()
  OR
  -- El usuario es chef o mesero que trabaja para el dueño de las órdenes
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = orders.user_id
    AND (
      user_profiles.role = 'waiter' 
      OR user_profiles.role = 'chef' 
      OR user_profiles.role LIKE '%chef%' 
      OR user_profiles.role LIKE '%mesero%' 
      OR user_profiles.role LIKE '%camarero%'
      OR user_profiles.role LIKE '%cocina%'
    )
  )
)
WITH CHECK (
  -- Las mismas condiciones que en USING
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = orders.user_id
    AND (
      user_profiles.role = 'waiter' 
      OR user_profiles.role = 'chef' 
      OR user_profiles.role LIKE '%chef%' 
      OR user_profiles.role LIKE '%mesero%' 
      OR user_profiles.role LIKE '%camarero%'
      OR user_profiles.role LIKE '%cocina%'
    )
  )
);

-- 4. Crear una nueva política de actualización para order_items que permita a chefs y meseros
CREATE POLICY order_items_update_policy
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  -- El usuario es dueño de los items
  user_id = auth.uid()
  OR
  -- El usuario es chef o mesero que trabaja para el dueño de los items
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = order_items.user_id
    AND (
      user_profiles.role = 'waiter' 
      OR user_profiles.role = 'chef' 
      OR user_profiles.role LIKE '%chef%' 
      OR user_profiles.role LIKE '%mesero%' 
      OR user_profiles.role LIKE '%camarero%'
      OR user_profiles.role LIKE '%cocina%'
    )
  )
)
WITH CHECK (
  -- Las mismas condiciones que en USING
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.admin_id = order_items.user_id
    AND (
      user_profiles.role = 'waiter' 
      OR user_profiles.role = 'chef' 
      OR user_profiles.role LIKE '%chef%' 
      OR user_profiles.role LIKE '%mesero%' 
      OR user_profiles.role LIKE '%camarero%'
      OR user_profiles.role LIKE '%cocina%'
    )
  )
);

-- 5. Función de diagnóstico para pruebas de acceso
CREATE OR REPLACE FUNCTION debug_order_update_access(user_id UUID, order_id UUID)
RETURNS TABLE(
  has_access BOOLEAN,
  reason TEXT,
  user_role TEXT
) AS $$
DECLARE
  v_role TEXT;
  v_admin_id UUID;
  v_order_owner_id UUID;
BEGIN
  -- Obtener información del usuario
  SELECT role, admin_id INTO v_role, v_admin_id
  FROM public.user_profiles
  WHERE user_id = $1;
  
  -- Obtener propietario de la orden
  SELECT user_id INTO v_order_owner_id
  FROM public.orders
  WHERE id = $2;
  
  -- Determinar acceso
  RETURN QUERY
  SELECT 
    CASE
      WHEN v_order_owner_id = $1 THEN TRUE
      WHEN v_admin_id = v_order_owner_id AND 
           (v_role = 'waiter' OR v_role = 'chef' OR 
            v_role LIKE '%chef%' OR v_role LIKE '%mesero%' OR 
            v_role LIKE '%camarero%' OR v_role LIKE '%cocina%') THEN TRUE
      ELSE FALSE
    END,
    CASE
      WHEN v_order_owner_id = $1 THEN 'Usuario es propietario de la orden'
      WHEN v_admin_id = v_order_owner_id AND 
           (v_role = 'waiter' OR v_role = 'chef' OR 
            v_role LIKE '%chef%' OR v_role LIKE '%mesero%' OR 
            v_role LIKE '%camarero%' OR v_role LIKE '%cocina%') THEN 'Usuario es empleado con rol permitido'
      ELSE 'No tiene acceso'
    END,
    v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 