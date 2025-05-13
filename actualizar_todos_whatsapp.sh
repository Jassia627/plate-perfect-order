#!/bin/bash

# Script para actualizar todos los números de WhatsApp basados en los números de teléfono existentes
# Ejecutar con permisos adecuados: chmod +x actualizar_todos_whatsapp.sh

echo "=== Actualización de WhatsApp para Todos los Restaurantes ==="
echo "Este script actualizará el campo whatsapp para todos los registros"
echo "usando el número de teléfono (phone) ya existente en la base de datos."
echo ""

# Verificar que el comando supabase está disponible
if ! command -v supabase &> /dev/null; then
    echo "Error: No se encuentra el comando 'supabase'. Por favor instala Supabase CLI primero."
    echo "Visita https://supabase.io/docs/guides/cli para más información."
    exit 1
fi

echo "Ejecutando actualización..."
echo ""

# Ejecutar el script SQL
supabase db execute --file=actualizar_whatsapp_desde_phone.sql

echo ""
echo "Proceso completado."
echo "Ahora puedes verificar tu menú público para confirmar que todo funciona correctamente." 