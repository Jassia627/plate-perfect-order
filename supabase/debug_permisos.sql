-- Script para diagnosticar relaciones entre usuarios y permisos
-- =====================================================

-- 1. Verificar los perfiles de usuario
SELECT 
  up.user_id, 
  up.role, 
  up.admin_id,
  au.email as user_email,
  (SELECT email FROM auth.users WHERE id = up.admin_id) as admin_email
FROM 
  user_profiles up
JOIN 
  auth.users au ON up.user_id = au.id
ORDER BY 
  role, user_email;

-- 2. Verificar mesas y sus propietarios/administradores
SELECT 
  t.id,
  t.number,
  t.status,
  t.user_id,
  t.admin_id,
  (SELECT email FROM auth.users WHERE id = t.user_id) as user_email,
  (SELECT email FROM auth.users WHERE id = t.admin_id) as admin_email
FROM 
  tables t
ORDER BY 
  number;

-- 3. Verificar políticas de RLS actuales
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies
WHERE 
  tablename = 'tables'
ORDER BY 
  policyname;

-- 4. Verificar permisos específicos para dos IDs de usuario
-- Reemplazar estos IDs con los que aparecen en tu diagnóstico
\set id1 '6ceabe47-8e9a-4295-b2fb-34b4f92e1ef7'
\set id2 '878d6055-0000-0000-0000-000000000000'  -- Reemplazar con el ID completo del otro admin

-- Verificar si hay relación entre estos usuarios
SELECT 
  'ID1 es admin de ID2' as relacion
WHERE 
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = :'id2' AND admin_id = :'id1')
UNION ALL
SELECT 
  'ID2 es admin de ID1' as relacion
WHERE 
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = :'id1' AND admin_id = :'id2')
UNION ALL
SELECT 
  'No hay relación jerárquica' as relacion
WHERE 
  NOT EXISTS (SELECT 1 FROM user_profiles WHERE 
              (user_id = :'id1' AND admin_id = :'id2') OR 
              (user_id = :'id2' AND admin_id = :'id1'));

-- 5. Verificar todos los caminos posibles de visibilidad para el usuario ID1
WITH permisos AS (
  -- El usuario puede ver sus propias mesas
  SELECT
    t.id,
    t.number,
    'Es propietario' as razon
  FROM
    tables t
  WHERE
    t.user_id = :'id1'
  
  UNION ALL
  
  -- El usuario puede ver mesas donde es admin
  SELECT
    t.id,
    t.number,
    'Es administrador' as razon
  FROM
    tables t
  WHERE
    t.admin_id = :'id1'
    AND t.user_id <> :'id1'
  
  UNION ALL
  
  -- El usuario puede ver mesas creadas por usuarios que administra
  SELECT
    t.id,
    t.number,
    'Mesa creada por usuario que administra' as razon
  FROM
    tables t
  JOIN
    user_profiles up ON t.user_id = up.user_id
  WHERE
    up.admin_id = :'id1'
    AND t.user_id <> :'id1'
)
SELECT * FROM permisos ORDER BY number; 