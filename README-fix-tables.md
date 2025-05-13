# Solución: Problema de mesas visibles para todos los usuarios

## Problema identificado
Se ha detectado un problema en las políticas de seguridad de Row Level Security (RLS) donde todos los usuarios pueden ver las mismas mesas, independientemente de a qué cuenta pertenecen.

## Causa del problema
El error se encuentra en la política `tables_isolation_policy` en la tabla `tables`. La condición en la cláusula `IN` está mal formulada, provocando que todos los usuarios vean todas las mesas.

```sql
-- Política incorrecta:
CREATE POLICY tables_isolation_policy ON tables
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE admin_id = user_id
    )
  );
```

Esta consulta está intentando verificar si el usuario actual es administrador o está administrado por alguien, pero la condición `admin_id = user_id` es incorrecta y causa que la política no filtre correctamente.

## Solución actualizada

El script `fix_tables_visibility.sql` ha sido actualizado para manejar el caso de que existan políticas con los mismos nombres:

1. Abre el SQL Editor en la interfaz de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto de "Plate Perfect Order"
3. Copia y pega el contenido completo del archivo `fix_tables_visibility.sql` en el editor
4. Ejecuta la consulta

El script ahora:
- Elimina todas las políticas existentes relacionadas con la tabla `tables`
- Crea nuevas políticas con nombres diferentes para evitar conflictos
- Verifica la existencia de la función `set_auth_user` antes de crearla
- Muestra todas las políticas aplicadas al final para verificación

## Nuevas políticas creadas

El script crea las siguientes políticas con nuevos nombres:

1. `tables_visibility_fixed` - Para SELECT (reemplaza a `tables_isolation_policy`)
2. `tables_insert_fixed` - Para INSERT
3. `tables_update_fixed` - Para UPDATE
4. `tables_delete_fixed` - Para DELETE

## Verificación
Después de aplicar el cambio, haz las siguientes verificaciones:

1. Inicia sesión con la cuenta de administrador 1 y verifica que solo puedes ver las mesas de esa cuenta
2. Inicia sesión con la cuenta de administrador 2 y verifica que solo puedes ver las mesas de esa cuenta
3. Inicia sesión con la cuenta de un mesero y verifica que solo puedes ver las mesas del administrador que te creó

## Si sigues teniendo problemas
Si después de ejecutar el script sigues viendo el mismo comportamiento, podría ser necesario:

1. Realizar un análisis más profundo de las demás políticas en la base de datos
2. Verificar manualmente que las relaciones entre meseros y administradores estén correctamente configuradas en la tabla `user_profiles`
3. Comprobar que el campo `admin_id` esté correctamente configurado en los registros de la tabla `tables`

## Notas adicionales
Esta solución arregla el problema inmediato de visibilidad de mesas, pero es recomendable revisar todas las otras políticas RLS para asegurarte de que están correctamente implementadas. 