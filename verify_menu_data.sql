-- Script para verificar los datos existentes en las tablas de menú

-- Reemplaza este valor con el UUID del administrador que deseas consultar
\set admin_id '91d4306c-9c10-4d1a-9f9f-5e1651b96066'

-- 1. Verificar el conteo total de categorías y productos en la base de datos
SELECT 'Total de categorías en la base de datos' as info, COUNT(*) as count FROM menu_categories;
SELECT 'Total de productos en la base de datos' as info, COUNT(*) as count FROM menu_items;

-- 2. Verificar la existencia del adminId proporcionado
SELECT 'Existe el usuario en auth.users' as info, 
  EXISTS(SELECT 1 FROM auth.users WHERE id = :'admin_id') as resultado;
SELECT 'Existe el usuario en user_profiles' as info, 
  EXISTS(SELECT 1 FROM user_profiles WHERE user_id = :'admin_id') as resultado;

-- 3. Verificar categorías del administrador específico
SELECT 'Categorías del admin (por user_id)' as info, COUNT(*) as count 
FROM menu_categories WHERE user_id = :'admin_id';
SELECT 'Categorías del admin (por admin_id)' as info, COUNT(*) as count 
FROM menu_categories WHERE admin_id = :'admin_id';

-- 4. Verificar productos del administrador específico
SELECT 'Productos del admin (por user_id)' as info, COUNT(*) as count 
FROM menu_items WHERE user_id = :'admin_id';
SELECT 'Productos del admin (por admin_id)' as info, COUNT(*) as count 
FROM menu_items WHERE admin_id = :'admin_id';
SELECT 'Productos disponibles del admin' as info, COUNT(*) as count 
FROM menu_items WHERE admin_id = :'admin_id' AND available = true;

-- 5. Mostrar las primeras categorías del administrador si existen
SELECT 'Primeras 5 categorías del admin' as info;
SELECT id, name, description, admin_id, user_id 
FROM menu_categories 
WHERE admin_id = :'admin_id' OR user_id = :'admin_id'
LIMIT 5;

-- 6. Mostrar los primeros productos del administrador si existen
SELECT 'Primeros 5 productos del admin' as info;
SELECT id, name, description, price, available, admin_id, user_id, category_id
FROM menu_items 
WHERE admin_id = :'admin_id' OR user_id = :'admin_id'
LIMIT 5;

-- 7. Verificar si el admin_id está correctamente configurado
SELECT 'Categorías con admin_id NULL pero user_id configurado' as info, COUNT(*) as count 
FROM menu_categories WHERE admin_id IS NULL AND user_id = :'admin_id';
SELECT 'Productos con admin_id NULL pero user_id configurado' as info, COUNT(*) as count 
FROM menu_items WHERE admin_id IS NULL AND user_id = :'admin_id';

-- 8. Verificar las políticas RLS de las tablas
SELECT 'Políticas RLS para menu_categories' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'menu_categories';

SELECT 'Políticas RLS para menu_items' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'menu_items';

-- 9. Verificar si RLS está habilitado en las tablas
SELECT 'RLS habilitado en menu_categories' as info, 
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'menu_categories') as resultado;
SELECT 'RLS habilitado en menu_items' as info, 
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'menu_items') as resultado; 