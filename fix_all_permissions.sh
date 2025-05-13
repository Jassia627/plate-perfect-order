#!/bin/bash

# Verificar que se tengan las variables de entorno necesarias
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  echo "Ejemplo de uso:"
  echo "NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta ./fix_all_permissions.sh"
  exit 1
fi

echo "=== INICIANDO CORRECCIÓN COMPLETA DE PERMISOS ==="
echo ""

# 1. Corregir permisos de las tablas
echo "--- Corrigiendo permisos de las mesas ---"
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(cat fix_tables_rls.sql | jq -Rs .)}"
echo -e "\n✅ Permisos de mesas actualizados\n"

# 2. Corregir permisos del menú
echo "--- Corrigiendo permisos del menú ---"
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(cat fix_menu_access.sql | jq -Rs .)}"
echo -e "\n✅ Permisos de menú actualizados\n"

# 3. Corregir permisos de las órdenes
echo "--- Corrigiendo permisos de las órdenes ---"
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(cat fix_orders_access.sql | jq -Rs .)}"
echo -e "\n✅ Permisos de órdenes actualizados\n"

echo "=== CORRECCIÓN DE PERMISOS COMPLETADA ==="
echo ""
echo "La jerarquía de usuarios ahora debería funcionar correctamente para todos los roles:"
echo "✓ Los meseros pueden ver las mesas, el menú y las órdenes de su administrador"
echo "✓ Los chefs pueden ver y actualizar las órdenes de su administrador"
echo "✓ Los administradores pueden ver y gestionar sus propios datos" 