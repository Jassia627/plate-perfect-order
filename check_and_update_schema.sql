-- Script para verificar y actualizar el esquema de la base de datos

-- Función para verificar si una tabla existe
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) INTO exists;
  RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si una columna existe en una tabla
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text) 
RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1 
    AND column_name = $2
  ) INTO exists;
  RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Verificar y crear la tabla user_profiles si no existe
DO $$
BEGIN
  IF NOT table_exists('user_profiles') THEN
    CREATE TABLE public.user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'waiter', 'chef', 'manager', 'cashier')),
      admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      restaurant_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    -- Habilitar RLS en la tabla user_profiles
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Crear políticas RLS para user_profiles
    CREATE POLICY "Usuarios pueden ver sus propios perfiles" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Administradores pueden ver perfiles de sus usuarios" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = admin_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propios perfiles" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (role = 'admin' OR admin_id IS NOT NULL);
    
    CREATE POLICY "Administradores pueden actualizar perfiles de sus usuarios" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = admin_id);
    
    CREATE POLICY "Administradores pueden crear perfiles" 
    ON user_profiles FOR INSERT 
    WITH CHECK (
      (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin' 
      OR 
      NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid())
    );
    
    CREATE POLICY "Administradores pueden eliminar perfiles de sus usuarios" 
    ON user_profiles FOR DELETE 
    USING (auth.uid() = admin_id);
    
    -- Crear función para asignar rol automáticamente al registrarse
    CREATE OR REPLACE FUNCTION public.handle_new_user() 
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.user_profiles (user_id, role)
      VALUES (NEW.id, 'admin');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Crear trigger para llamar a la función cuando un usuario se registra
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      
    RAISE NOTICE 'Tabla user_profiles creada correctamente.';
  ELSE
    RAISE NOTICE 'La tabla user_profiles ya existe.';
  END IF;
  
  -- Verificar y crear la tabla staff si no existe
  IF NOT table_exists('staff') THEN
    CREATE TABLE public.staff (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      restaurant_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    -- Habilitar RLS en la tabla staff
    ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
    
    -- Crear políticas RLS para staff
    CREATE POLICY "Usuarios pueden ver sus propios datos de staff" 
    ON staff FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Administradores pueden ver datos de staff de sus usuarios" 
    ON staff FOR SELECT 
    USING (auth.uid() = admin_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propios datos de staff" 
    ON staff FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Administradores pueden actualizar datos de staff de sus usuarios" 
    ON staff FOR UPDATE 
    USING (auth.uid() = admin_id);
    
    CREATE POLICY "Administradores pueden crear datos de staff" 
    ON staff FOR INSERT 
    WITH CHECK (
      auth.uid() = admin_id OR 
      (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    );
    
    CREATE POLICY "Administradores pueden eliminar datos de staff de sus usuarios" 
    ON staff FOR DELETE 
    USING (auth.uid() = admin_id);
    
    RAISE NOTICE 'Tabla staff creada correctamente.';
  ELSE
    RAISE NOTICE 'La tabla staff ya existe.';
  END IF;
  
  -- Verificar y añadir la columna admin_id a las tablas existentes
  IF table_exists('tables') AND NOT column_exists('tables', 'admin_id') THEN
    ALTER TABLE tables ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    UPDATE tables SET admin_id = user_id WHERE admin_id IS NULL;
    RAISE NOTICE 'Columna admin_id añadida a la tabla tables.';
  END IF;
  
  IF table_exists('menu_categories') AND NOT column_exists('menu_categories', 'admin_id') THEN
    ALTER TABLE menu_categories ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    UPDATE menu_categories SET admin_id = user_id WHERE admin_id IS NULL;
    RAISE NOTICE 'Columna admin_id añadida a la tabla menu_categories.';
  END IF;
  
  IF table_exists('menu_items') AND NOT column_exists('menu_items', 'admin_id') THEN
    ALTER TABLE menu_items ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    UPDATE menu_items SET admin_id = user_id WHERE admin_id IS NULL;
    RAISE NOTICE 'Columna admin_id añadida a la tabla menu_items.';
  END IF;
  
  IF table_exists('orders') AND NOT column_exists('orders', 'admin_id') THEN
    ALTER TABLE orders ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    UPDATE orders SET admin_id = user_id WHERE admin_id IS NULL;
    RAISE NOTICE 'Columna admin_id añadida a la tabla orders.';
  END IF;
  
  IF table_exists('order_items') AND NOT column_exists('order_items', 'admin_id') THEN
    ALTER TABLE order_items ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    UPDATE order_items SET admin_id = user_id WHERE admin_id IS NULL;
    RAISE NOTICE 'Columna admin_id añadida a la tabla order_items.';
  END IF;
  
  -- Crear las funciones RPC necesarias
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
  
  RAISE NOTICE 'Funciones RPC creadas correctamente.';
END;
$$; 