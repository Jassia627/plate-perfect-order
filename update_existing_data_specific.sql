-- Script para asignar un ID de usuario específico a los datos existentes
-- REEMPLAZA 'TU_ID_DE_USUARIO_AQUÍ' con el ID real del usuario obtenido con el componente de prueba

-- Actualizar las categorías de menú existentes
UPDATE menu_categories 
SET user_id = 'TU_ID_DE_USUARIO_AQUÍ' 
WHERE user_id IS NULL;

-- Actualizar los elementos de menú existentes
UPDATE menu_items 
SET user_id = 'TU_ID_DE_USUARIO_AQUÍ' 
WHERE user_id IS NULL;

-- Actualizar las mesas existentes
UPDATE tables 
SET user_id = 'TU_ID_DE_USUARIO_AQUÍ' 
WHERE user_id IS NULL;

-- Actualizar las reservas existentes
UPDATE reservations 
SET user_id = 'TU_ID_DE_USUARIO_AQUÍ' 
WHERE user_id IS NULL;

-- Actualizar los pedidos existentes
UPDATE orders 
SET user_id = 'TU_ID_DE_USUARIO_AQUÍ' 
WHERE user_id IS NULL;

-- Actualizar los elementos de pedidos existentes
UPDATE order_items 
SET user_id = 'TU_ID_DE_USUARIO_AQUÍ' 
WHERE user_id IS NULL;

-- Este script asigna todos los datos existentes a un solo usuario
-- Los nuevos usuarios que se registren tendrán que crear sus propios datos 