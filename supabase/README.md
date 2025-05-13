# Políticas de Seguridad para Plate Perfect Order

Este directorio contiene migraciones SQL y políticas de seguridad para la base de datos Supabase.

## Problema de Seguridad Detectado

Se ha detectado un problema de seguridad donde un administrador puede ver los datos de todos los demás administradores. Esto ocurre porque no se han aplicado correctamente las políticas de Row Level Security (RLS) en Supabase.

## Solución

Para corregir este problema, se ha creado el archivo `security_policies.sql` que contiene las políticas de RLS necesarias para asegurar que cada administrador solo pueda ver y modificar sus propios datos.

## Cómo Aplicar las Políticas

1. Inicia sesión en tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea un nuevo script y copia todo el contenido del archivo `security_policies.sql`
5. Ejecuta el script completo

## Verificación

Después de aplicar las políticas, deberías comprobar que:

1. Cada administrador solo puede ver sus propias mesas, reservas, pedidos, etc.
2. Los usuarios no administradores siguen pudiendo ver lo que necesitan para su trabajo (meseros ven mesas, chefs ven pedidos, etc.)

## Políticas Implementadas

- Aislamiento de datos entre administradores
- Triggers para asegurar que cada registro nuevo tiene el user_id correcto
- Políticas diferenciadas para lectura y escritura

## Notas Importantes

- Las políticas actuales asumen que todas las tablas tienen campos user_id y/o admin_id
- Si hay más tablas en la base de datos, deberás añadir políticas similares para ellas
- Si necesitas compartir datos entre dos administradores, deberás modificar estas políticas 