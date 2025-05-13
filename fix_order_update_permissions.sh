#!/bin/bash

# Verificar que se tengan las variables de entorno necesarias
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  echo "Ejemplo de uso:"
  echo "NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta ./fix_order_update_permissions.sh"
  exit 1
fi

echo "Iniciando corrección de políticas RLS para actualización de órdenes..."

# Ejecutar directamente el SQL con la API de Supabase
echo "Ejecutando script SQL: fix_order_update_permissions.sql"

curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(cat fix_order_update_permissions.sql | jq -Rs .)}"

echo -e "\n¡Corrección de permisos de actualización de órdenes completada!"
echo "Ahora los chefs y meseros deberían poder actualizar el estado de las órdenes correctamente." 