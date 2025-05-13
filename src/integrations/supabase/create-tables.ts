import { supabase } from './client';

/**
 * Script para crear las tablas de configuración necesarias en Supabase
 * Este script proporciona el SQL necesario para crear las tablas de configuración
 * Ya que no podemos ejecutar RPC directamente, mostraremos el SQL para que el usuario
 * lo ejecute manualmente en el editor SQL de Supabase.
 */
export const createConfigurationTables = () => {
  console.log('Generando SQL para crear tablas de configuración...');
  
  const sqlScript = `
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
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas de seguridad para restaurant_settings
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

-- Configuración de usuario
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL DEFAULT 'Admin Usuario',
  email TEXT NOT NULL DEFAULT 'admin@plateperfect.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas de seguridad para user_settings
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

-- Políticas de seguridad para billing_settings
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

-- Políticas de seguridad para notification_settings
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
`;

  console.log('SQL generado para crear tablas de configuración:');
  console.log(sqlScript);
  console.log('Copia este SQL y ejecútalo en el editor SQL de Supabase.');
  
  return sqlScript;
};

/**
 * Función para verificar las tablas existentes manualmente
 * Ya que no podemos usar RPC, necesitamos hacer consultas directas
 */
export const checkExistingTables = async () => {
  try {
    console.log('Verificando tablas existentes...');
    
    // Intentamos seleccionar registros de cada tabla para ver si existen
    // Definimos explícitamente el tipo para que coincida con la definición en Database
    const tables = [
      'restaurant_settings',
      'user_settings',
      'billing_settings',
      'notification_settings'
    ] as const;
    
    type TableName = typeof tables[number];
    const existingTables: TableName[] = [];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
        console.log(`Tabla ${table} existe`);
      } else {
        console.log(`Tabla ${table} no existe o hay un error:`, error.message);
      }
    }
    
    console.log('Verificación completada. Tablas existentes:', existingTables);
    return existingTables;
  } catch (error) {
    console.error('Error al verificar tablas:', error);
    return [];
  }
};

// Para ejecutar el script y ver el SQL, descomenta la siguiente línea
// console.log(createConfigurationTables()); 