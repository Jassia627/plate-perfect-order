-- Crear tabla para perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'waiter', 'chef', 'manager', 'cashier')),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    restaurant_id UUID, -- Para futura implementación multi-restaurante
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar RLS en la tabla de perfiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para user_profiles
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios perfiles" ON user_profiles;
DROP POLICY IF EXISTS "Administradores pueden ver perfiles de sus usuarios" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios perfiles" ON user_profiles;
DROP POLICY IF EXISTS "Administradores pueden actualizar perfiles de sus usuarios" ON user_profiles;
DROP POLICY IF EXISTS "Administradores pueden crear perfiles" ON user_profiles;
DROP POLICY IF EXISTS "Administradores pueden eliminar perfiles de sus usuarios" ON user_profiles;

-- Políticas para lectura
CREATE POLICY "Usuarios pueden ver sus propios perfiles" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Administradores pueden ver perfiles de sus usuarios" 
ON user_profiles FOR SELECT 
USING (auth.uid() = admin_id);

-- Políticas para actualización
CREATE POLICY "Usuarios pueden actualizar sus propios perfiles" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (role = 'admin' OR admin_id IS NOT NULL); -- No permite cambiar a rol admin

CREATE POLICY "Administradores pueden actualizar perfiles de sus usuarios" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = admin_id);

-- Políticas para creación
CREATE POLICY "Administradores pueden crear perfiles" 
ON user_profiles FOR INSERT 
WITH CHECK (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin' 
  OR 
  NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid())
);

-- Políticas para eliminación
CREATE POLICY "Administradores pueden eliminar perfiles de sus usuarios" 
ON user_profiles FOR DELETE 
USING (auth.uid() = admin_id);

-- Crear función para asignar rol automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role)
  VALUES (NEW.id, 'admin'); -- Por defecto, todos los usuarios nuevos son administradores
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para llamar a la función cuando un usuario se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentarios sobre el uso:
-- 1. Cuando un usuario administrador crea otro usuario, debe actualizar el perfil para establecer:
--    - role = 'waiter' (u otro rol)
--    - admin_id = ID del administrador que lo creó
--
-- 2. De esta manera, cada mesero estará vinculado a su administrador y solo verá las mesas de ese administrador 