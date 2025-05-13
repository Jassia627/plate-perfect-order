# Guía de Implementación: Sistema de Jerarquía de Usuarios para PlatePerfect Order

Esta guía explica cómo implementar un sistema donde cada administrador tiene sus propios datos (mesas, menú, pedidos) y cuando crea cuentas de meseros, estos solo pueden ver y trabajar con los datos de su administrador.

## 1. Estructura de la Solución

La solución implementa un sistema jerárquico donde:
- Cada usuario nuevo se registra como administrador por defecto
- Los administradores pueden crear cuentas para sus meseros
- Cada mesero está vinculado a un administrador específico
- Los meseros solo ven y trabajan con los datos de su administrador

## 2. Pasos para la Implementación

### 2.1. Ejecutar el Script SQL en Supabase

La forma más sencilla de implementar esta solución es ejecutar un único script de verificación:

1. Accede al Editor SQL de Supabase
2. Ejecuta el script: `check_and_update_schema.sql`

Este script verificará automáticamente:
- Si las tablas necesarias existen, y las creará si no
- Si las columnas requeridas existen, y las añadirá si no
- Creará las funciones RPC necesarias

#### 2.1.1. Error "column s.user_id does not exist"

Si encuentras este error específico al intentar crear un usuario o acceder a la sección de personal, significa que hay un problema con la tabla `staff`. Para solucionarlo:

1. Accede al Editor SQL de Supabase
2. Ejecuta el script específico: `update_staff_table.sql`
3. Este script:
   - Verificará si la tabla `staff` existe
   - Si existe pero con una estructura incorrecta, la respaldará como `staff_backup` y creará una nueva con la estructura correcta
   - Si no existe, la creará
   - Establecerá las políticas RLS correctas

Después de ejecutar este script, el error debería resolverse y podrás acceder a la sección de personal.

### 2.2. Actualizar los Hooks de la Aplicación

Reemplaza los siguientes archivos con las versiones modificadas:
- `src/hooks/use-tables.tsx`
- `src/hooks/use-menu.tsx`
- `src/hooks/use-orders.tsx`
- `src/hooks/use-staff.tsx`

### 2.3. Crear Interfaz de Administración de Personal (Opcional)

Implementa una interfaz de usuario para que los administradores puedan:
- Crear cuentas para sus meseros
- Asignar roles a los usuarios
- Gestionar los permisos

## 3. Cómo Funciona el Sistema

### 3.1. Roles de Usuario
- **Administrador**: Crea y gestiona sus propias mesas, menú y puede crear usuarios meseros
- **Mesero**: Ve y trabaja con las mesas, menú y pedidos de su administrador

### 3.2. Flujo de Creación de Usuarios
1. Un administrador accede a la sección de personal
2. Crea una nueva cuenta con email, contraseña y rol (mesero, chef, etc.)
3. El sistema vincula automáticamente el nuevo usuario al administrador
4. El nuevo usuario puede iniciar sesión y verá los datos de su administrador

### 3.3. Seguridad de Datos
- Cada tabla principal (tables, menu_categories, menu_items, orders) ahora tiene un campo `user_id` y `admin_id`
- Las políticas de Row Level Security (RLS) aseguran que cada usuario solo acceda a los datos que le corresponden
- Los administradores solo ven sus propios datos
- Los meseros ven los datos de su administrador

## 4. Migración de Datos Existentes

Si ya tienes datos en tu sistema:

1. Todos los usuarios existentes se convierten en administradores
2. Los datos existentes son asignados a su creador (usuario que los subió)
3. El script `check_and_update_schema.sql` se encarga de actualizar automáticamente los datos existentes

## 5. Gestión de Usuarios

### 5.1. Crear un Nuevo Mesero (como Administrador)
1. Accede a la sección de personal
2. Utiliza la función para crear un nuevo usuario
3. Proporciona email, contraseña y rol
4. El sistema asignará automáticamente tu ID como `admin_id` del nuevo usuario

### 5.2. Iniciar Sesión (como Mesero)
1. El mesero inicia sesión con sus credenciales
2. Automáticamente ve las mesas, menú y pedidos de su administrador
3. Puede crear pedidos que se asociarán al administrador

## 6. Consideraciones Importantes

- **Respaldo**: Antes de implementar estos cambios, haz un respaldo de tu base de datos
- **Pruebas**: Prueba el sistema en un entorno de desarrollo antes de implementarlo en producción
- **Roles adicionales**: El sistema está preparado para añadir más roles (chef, cajero, gerente)

## 7. Solución de Problemas

### 7.1. Errores Comunes

1. **Error con la función RPC**: Si ves errores relacionados con las funciones RPC, asegúrate de ejecutar el script `check_and_update_schema.sql`

2. **Error "column s.user_id does not exist"**: Este error indica que la tabla staff no tiene la estructura correcta. Ejecuta el script `update_staff_table.sql` para corregirlo.

3. **Error "Could not find a relationship between 'user_profiles' and 'user_id'"**: Este error ocurre cuando se intenta consultar la tabla de usuarios. Ejecuta el script `update_staff_table.sql` para asegurarte de que la tabla staff tiene la estructura correcta.

4. **Problemas con los permisos RLS**: Asegúrate de que las políticas RLS estén correctamente configuradas ejecutando el script `check_and_update_schema.sql`

### 7.2. Verificación

Para verificar que la configuración es correcta:

1. Regístrate como un nuevo usuario (se te asignará el rol "admin")
2. Crea algunas mesas y elementos del menú
3. Crea un usuario mesero usando la sección de personal
4. Inicia sesión con la cuenta del mesero y verifica que pueda ver los datos del administrador

Para cualquier consulta adicional, contacta con el soporte técnico.

--- 