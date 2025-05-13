-- Script para corregir problemas de acceso a secciones para camareros
-- Este script añade políticas RLS permisivas para todas las tablas relacionadas
-- con las funcionalidades que los camareros deben acceder

-- Política para acceder a las mesas
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
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

-- Política para acceder a los items
DROP POLICY IF EXISTS menu_items_select_policy ON public.menu_items;
CREATE POLICY menu_items_select_policy
ON public.menu_items
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
    AND user_profiles.admin_id = menu_items.user_id
  )
  OR
  -- El usuario es administrador del dueño de los items
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = menu_items.user_id 
    AND user_profiles.admin_id = auth.uid()
  )
);

-- Política para acceder a las categorías
DROP POLICY IF EXISTS menu_categories_select_policy ON public.menu_categories;
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

-- Crear políticas RLS básicas para INSERT/UPDATE/DELETE en todas las tablas
-- para camareros que comparten el mismo admin_id

-- Políticas para orders
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
CREATE POLICY orders_insert_policy
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  true  -- Permitir inserción para todos los usuarios autenticados
);

DROP POLICY IF EXISTS orders_update_policy ON public.orders;
CREATE POLICY orders_update_policy
ON public.orders
FOR UPDATE
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
)
WITH CHECK (
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
);

-- Función para identificar el administrador de un usuario
CREATE OR REPLACE FUNCTION public.get_user_admin(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Intentar obtener directamente el admin_id del perfil
  SELECT admin_id INTO v_admin_id
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- Si es nulo y el usuario no es admin, devolver null
  IF v_admin_id IS NULL THEN
    SELECT user_id INTO v_admin_id
    FROM public.user_profiles
    WHERE role = 'admin'
    LIMIT 1;
  END IF;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER para actualizar automáticamente el user_id y admin_id en nuevas filas
CREATE OR REPLACE FUNCTION public.set_user_and_admin_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Establecer user_id si está vacío
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Establecer admin_id si está vacío y no es un admin
  IF NEW.admin_id IS NULL THEN
    -- Verificar si el usuario es admin
    IF EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = NEW.user_id AND role = 'admin'
    ) THEN
      -- Si es admin, su admin_id es el mismo que su user_id
      NEW.admin_id := NEW.user_id;
    ELSE
      -- Si no es admin, obtener su admin_id
      NEW.admin_id := public.get_user_admin(NEW.user_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 