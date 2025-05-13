# Solución para permisos de actualización de órdenes

## Problema identificado

Después de aplicar las políticas RLS más estrictas para la tabla de mesas (`tables`), se identificó un nuevo problema: los chefs y meseros no podían actualizar el estado de las órdenes ni de los ítems de las órdenes.

Este problema ocurre porque las políticas RLS se volvieron demasiado restrictivas y sólo permitían que el propietario de la orden (típicamente el administrador) pudiera actualizarla. Sin embargo, en el flujo de trabajo del restaurante, los chefs necesitan cambiar el estado de las órdenes a "en preparación" y posteriormente a "listo" cuando terminan de cocinar.

## Solución implementada

Se crearon dos nuevos scripts para resolver este problema específico:

1. `fix_order_update_permissions.sql`: Este script:
   - Elimina las políticas de actualización existentes para las tablas `orders` y `order_items`.
   - Crea nuevas políticas que permiten actualizar las órdenes tanto al propietario como a los chefs y meseros que trabajan para ese propietario.
   - Define claramente los roles permitidos para actualización, incluyendo variaciones de nombres ("chef", "%chef%", "mesero", "camarero", etc.)
   - Implementa una función de diagnóstico `debug_order_update_access()` para facilitar la verificación de permisos.

2. `fix_order_update_permissions.sh`: Script shell que facilita la aplicación de las nuevas políticas utilizando la API REST de Supabase.

## Cómo aplicar la solución

1. Asegúrate de tener las variables de entorno necesarias:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta
   ```

2. Ejecuta el script de corrección:
   ```bash
   ./fix_order_update_permissions.sh
   ```

3. Verifica que ahora los chefs y meseros puedan actualizar órdenes correctamente.

## Verificación de permisos

Para verificar si un usuario específico tiene permiso para actualizar una orden determinada, puedes ejecutar la siguiente consulta SQL en la consola de Supabase:

```sql
SELECT * FROM debug_order_update_access('ID_DEL_USUARIO', 'ID_DE_LA_ORDEN');
```

Esto devolverá una tabla que indica:
- Si el usuario tiene acceso (`has_access`)
- La razón por la que tiene o no tiene acceso (`reason`)
- El rol del usuario (`user_role`)

## Solución de problemas

Si después de aplicar estos cambios siguen apareciendo problemas, verifica:

1. Que los usuarios tengan correctamente configurados sus roles en la tabla `user_profiles`.
2. Que las relaciones entre administradores y empleados (campo `admin_id`) estén correctamente establecidas.
3. Que el campo `user_id` de las órdenes esté correctamente asignado al administrador correspondiente.

Si necesitas realizar pruebas adicionales, puedes usar la función `debug_order_update_access()` para diagnosticar problemas específicos de permisos. 