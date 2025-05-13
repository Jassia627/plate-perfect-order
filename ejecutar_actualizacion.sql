-- Script maestro para actualizar la base de datos con la jerarquía de usuarios

-- 1. Crear tabla de perfiles de usuario
\i create_user_profiles_table.sql

-- 2. Crear tabla de staff
\i create_staff_table.sql

-- 3. Modificar tablas existentes para añadir admin_id
\i update_tables_for_user_hierarchy.sql

-- 4. Crear funciones RPC para gestión de personal
\i create_staff_rpc_functions.sql

-- 5. Actualizar datos existentes (opcional, ejecutar solo si hay datos que migrar)
-- \i update_existing_data.sql

-- Instrucciones tras la ejecución:
-- 1. Todos los usuarios existentes son ahora administradores
-- 2. Cuando un administrador cree un nuevo usuario (mesero), debe asignarle su ID como admin_id
-- 3. Cada administrador verá solo sus propios datos (mesas, menú, pedidos)
-- 4. Los meseros verán solo los datos de su administrador 