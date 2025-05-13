-- Script para verificar las relaciones entre usuarios
-- Este script mostrará información detallada sobre los usuarios, 
-- sus roles y las relaciones admin-camarero

-- 1. Ver todos los usuarios en la tabla user_profiles
SELECT 
    up.id,
    up.user_id,
    up.role,
    up.admin_id,
    up.created_at,
    (SELECT role FROM public.user_profiles WHERE user_id = up.admin_id) AS admin_role
FROM 
    public.user_profiles up
ORDER BY 
    up.role, up.created_at;

-- 2. Ver las relaciones entre administradores y camareros
SELECT 
    admin.user_id AS admin_user_id,
    admin.role AS admin_role,
    camarero.user_id AS camarero_user_id,
    camarero.role AS camarero_role
FROM 
    public.user_profiles admin
JOIN 
    public.user_profiles camarero ON camarero.admin_id = admin.user_id
WHERE 
    admin.role = 'admin'
    AND (camarero.role = 'waiter' OR camarero.role LIKE '%amarero%')
ORDER BY 
    admin.created_at, camarero.created_at;

-- 3. Verificar usuarios sin admin_id
SELECT 
    up.id,
    up.user_id,
    up.role,
    up.created_at
FROM 
    public.user_profiles up
WHERE 
    up.admin_id IS NULL
    AND up.role != 'admin'
ORDER BY 
    up.role, up.created_at;

-- 4. Verificar la tabla staff y sus relaciones
SELECT 
    s.id,
    s.user_id,
    s.name,
    s.role,
    s.admin_id,
    s.status,
    up.role AS user_profile_role,
    up.admin_id AS user_profile_admin_id,
    (up.admin_id = s.admin_id) AS admin_id_match
FROM 
    public.staff s
JOIN 
    public.user_profiles up ON s.user_id = up.user_id
ORDER BY 
    s.role, s.created_at;

-- 5. Verificar las configuraciones de restaurante existentes
SELECT 
    rs.id,
    rs.user_id,
    (SELECT role FROM public.user_profiles WHERE user_id = rs.user_id) AS user_role,
    rs.created_at
FROM 
    public.restaurant_settings rs
ORDER BY 
    rs.created_at; 