-- Modificar las tablas tables, reservations, orders y order_items para añadir user_id
-- y configurar Row Level Security (RLS)

-- Añadir el campo user_id a la tabla tables
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Añadir el campo user_id a la tabla reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Añadir el campo user_id a la tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Añadir el campo user_id a la tabla order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Habilitar RLS en la tabla tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en la tabla order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para tables si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias mesas" ON tables;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias mesas" ON tables;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias mesas" ON tables;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias mesas" ON tables;

-- Crear políticas para tables
CREATE POLICY "Usuarios pueden ver sus propias mesas" 
ON tables FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias mesas" 
ON tables FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias mesas" 
ON tables FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias mesas" 
ON tables FOR DELETE 
USING (auth.uid() = user_id);

-- Eliminar políticas existentes para reservations si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias reservas" ON reservations;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias reservas" ON reservations;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias reservas" ON reservations;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias reservas" ON reservations;

-- Crear políticas para reservations
CREATE POLICY "Usuarios pueden ver sus propias reservas" 
ON reservations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias reservas" 
ON reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias reservas" 
ON reservations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias reservas" 
ON reservations FOR DELETE 
USING (auth.uid() = user_id);

-- Eliminar políticas existentes para orders si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios pedidos" ON orders;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pedidos" ON orders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios pedidos" ON orders;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios pedidos" ON orders;

-- Crear políticas para orders
CREATE POLICY "Usuarios pueden ver sus propios pedidos" 
ON orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios pedidos" 
ON orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios pedidos" 
ON orders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios pedidos" 
ON orders FOR DELETE 
USING (auth.uid() = user_id);

-- Eliminar políticas existentes para order_items si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios ítems de pedidos" ON order_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios ítems de pedidos" ON order_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios ítems de pedidos" ON order_items;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios ítems de pedidos" ON order_items;

-- Crear políticas para order_items
CREATE POLICY "Usuarios pueden ver sus propios ítems de pedidos" 
ON order_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios ítems de pedidos" 
ON order_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios ítems de pedidos" 
ON order_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios ítems de pedidos" 
ON order_items FOR DELETE 
USING (auth.uid() = user_id);

-- Actualizar los registros existentes para asignarles un usuario (opcional)
-- Este comando debe ejecutarse solo si hay un usuario administrador existente
-- Reemplaza 'ID_DE_USUARIO_ADMIN' con el ID real del usuario administrador
-- UPDATE tables SET user_id = 'ID_DE_USUARIO_ADMIN' WHERE user_id IS NULL;
-- UPDATE reservations SET user_id = 'ID_DE_USUARIO_ADMIN' WHERE user_id IS NULL;
-- UPDATE orders SET user_id = 'ID_DE_USUARIO_ADMIN' WHERE user_id IS NULL;
-- UPDATE order_items SET user_id = 'ID_DE_USUARIO_ADMIN' WHERE user_id IS NULL; 