#!/bin/bash

# Verificar que se tengan las variables de entorno necesarias
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  echo "Ejemplo de uso:"
  echo "NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta ./fix-tables-permissions.sh"
  exit 1
fi

# Función para ejecutar un script SQL
function ejecutar_sql() {
  local archivo=$1
  echo "Ejecutando script SQL: $archivo"
  
  # Usando curl para hacer una petición a la función RPC
  curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(cat $archivo | jq -Rs .)}"
  
  echo ""
}

# Verificar si la función exec_sql existe, si no, crearla
echo "Verificando si existen las funciones auxiliares..."
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/function_exists" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"function_name\": \"exec_sql\"}" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Creando funciones auxiliares primero..."
  
  # Crear manualmente la función exec_sql usando la API de Supabase SQL
  curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(cat create_helper_functions.sql | jq -Rs .)}"
  
  echo "Funciones auxiliares creadas."
fi

# Ejecutar el script para corregir las políticas RLS
ejecutar_sql "fix_tables_rls.sql"

echo "¡Corrección de permisos completada!"
echo "Ahora los meseros deberían poder ver las mesas del administrador correctamente." 