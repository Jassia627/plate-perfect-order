# Solución: Problema de mesas compartidas entre usuarios

## Problema identificado
Las mesas aparecen para todos los usuarios, independientemente de qué cuenta las creó. Esto ocurre porque:

1. El campo `admin_id` en la tabla `tables` no está correctamente asignado
2. Las políticas RLS (Row Level Security) no están utilizando correctamente este campo para filtrar

## Solución completa en dos pasos

### Paso 1: Corregir los datos existentes
El primer script (`fix_tables_admin_id.sql`) actualiza todas las mesas existentes:

1. Verifica si existe la columna `admin_id` y la crea si es necesario
2. Actualiza el campo `admin_id` para todas las mesas donde está vacío:
   - Para mesas creadas por administradores, asigna `admin_id = user_id`
   - Para mesas creadas por meseros, asigna el `admin_id` del perfil del mesero
3. Muestra las mesas actualizadas para verificación
4. Actualiza la política RLS para considerar correctamente el campo `admin_id`

### Paso 2: Corregir la creación de mesas nuevas
El segundo script (`fix_tables_triggers.sql`) actualiza el trigger que se ejecuta al crear mesas:

1. Crea una nueva función `set_admin_id()` que asigna automáticamente tanto `user_id` como `admin_id`
2. Reemplaza el trigger existente por uno que use esta nueva función
3. Así, cada nueva mesa tendrá correctamente asignado el `admin_id`

## Cómo aplicar la solución

1. Abre el SQL Editor en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto "Plate Perfect Order"
3. Ejecuta **primero** el script `fix_tables_admin_id.sql` completo
4. Verifica los resultados mostrados (debería verse qué `admin_id` se asignó a cada mesa)
5. Ejecuta **después** el script `fix_tables_triggers.sql`
6. Verifica que el trigger nuevo aparezca en los resultados

## Verificación
Para comprobar que la solución funciona:

1. Inicia sesión como un administrador y verifica que solo ves tus propias mesas
2. Crea una nueva mesa y verifica que tiene correctamente asignado tu ID como `admin_id`
3. Si tienes meseros, verifica que solo ven las mesas creadas por ti (su administrador)

## ¿Cómo funciona la solución?

1. La política RLS actualizada filtra las mesas basándose en estas condiciones:
   - El usuario es propietario de la mesa (user_id = auth.uid())
   - O el usuario es mesero viendo mesas de su administrador
   - O el usuario es administrador viendo mesas creadas por sus meseros
   - O la mesa tiene este usuario como admin_id

2. El trigger asegura que cada nueva mesa tenga:
   - Si el creador es admin: admin_id = user_id (su propio id)
   - Si el creador es mesero: admin_id = el id de su administrador

Esta combinación garantiza que cada mesa solo sea visible para el administrador que la creó, sus meseros, o administradores que gestionan al creador. 