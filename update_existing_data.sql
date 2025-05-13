-- Script para asignar un ID de usuario a los datos existentes
-- Reemplaza 'ID_DE_USUARIO' con el ID real del usuario que está ejecutando el script

-- Para encontrar tu ID de usuario puedes usar la función auth.uid() en una consulta:
-- SELECT auth.uid() as mi_id_usuario;

-- Actualizar las categorías de menú existentes
UPDATE menu_categories 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- Actualizar los elementos de menú existentes
UPDATE menu_items 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- Actualizar las mesas existentes
UPDATE tables 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- Actualizar las reservas existentes
UPDATE reservations 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- Actualizar los pedidos existentes
UPDATE orders 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- Actualizar los elementos de pedidos existentes
UPDATE order_items 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- IMPORTANTE: Después de ejecutar este script, cada usuario solo verá sus propios datos
-- Los nuevos usuarios que se registren tendrán sus propios datos separados
-- Para que los nuevos usuarios puedan ver datos, deberás crear algunos datos de ejemplo
-- para cada nuevo usuario que se registre 