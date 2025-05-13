-- Crear tablas de configuración para el sistema

-- Configuración del restaurante
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT 'PlatePerfect',
  phone TEXT NOT NULL DEFAULT '912 345 678',
  address TEXT NOT NULL DEFAULT 'Calle Principal 123, 28001 Madrid',
  description TEXT NOT NULL DEFAULT 'Restaurante de comida mediterránea',
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  auto_print BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuración del usuario
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL DEFAULT 'Admin Usuario',
  email TEXT NOT NULL DEFAULT 'admin@plateperfect.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuración de facturación
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL DEFAULT 'PlatePerfect Inc.',
  tax_id TEXT NOT NULL DEFAULT 'B12345678',
  billing_email TEXT NOT NULL DEFAULT 'billing@plateperfect.com',
  billing_address TEXT NOT NULL DEFAULT 'Calle Principal 123, 28001 Madrid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuración de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  new_orders BOOLEAN NOT NULL DEFAULT true,
  reservations BOOLEAN NOT NULL DEFAULT true,
  weekly_reports BOOLEAN NOT NULL DEFAULT false,
  inventory_alerts BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT NOT NULL DEFAULT 'admin@plateperfect.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar políticas de seguridad RLS (Row Level Security)
-- Esto permite que los usuarios solo vean y modifiquen sus propias configuraciones

-- Restaurante
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias configuraciones de restaurante"
ON public.restaurant_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias configuraciones de restaurante"
ON public.restaurant_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias configuraciones de restaurante"
ON public.restaurant_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Usuario
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias configuraciones de usuario"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias configuraciones de usuario"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias configuraciones de usuario"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Facturación
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias configuraciones de facturación"
ON public.billing_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias configuraciones de facturación"
ON public.billing_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias configuraciones de facturación"
ON public.billing_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Notificaciones
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias configuraciones de notificaciones"
ON public.notification_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias configuraciones de notificaciones"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias configuraciones de notificaciones"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = user_id); 