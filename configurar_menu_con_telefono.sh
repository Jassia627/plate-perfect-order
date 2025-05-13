#!/bin/bash

# Script completo para configurar el menú público con información del restaurante
# Ejecutar con permisos adecuados: chmod +x configurar_menu_con_telefono.sh

echo "=== Configuración del Menú Público con Información del Restaurante ==="
echo "Este script realizará todas las actualizaciones necesarias para mostrar correctamente"
echo "la información del restaurante (nombre, dirección, teléfono, WhatsApp) en el menú público."
echo ""

# Verificar que el comando supabase está disponible
if ! command -v supabase &> /dev/null; then
    echo "Error: No se encuentra el comando 'supabase'. Por favor instala Supabase CLI primero."
    echo "Visita https://supabase.io/docs/guides/cli para más información."
    exit 1
fi

# Paso 1: Añadir las columnas whatsapp y logo_url si no existen
echo "Paso 1: Añadiendo columnas necesarias a restaurant_settings..."
supabase db execute --file=actualizar_columnas_restaurant_settings.sql

# Paso 2: Actualizar las políticas RLS para permitir acceso público a restaurant_settings
echo "Paso 2: Configurando políticas de seguridad RLS..."
supabase db execute --file=fix_public_menu_access.sql

echo ""
echo "✅ Configuración completada con éxito!"
echo ""
echo "Ahora tu menú público mostrará:"
echo "- Nombre del restaurante"
echo "- Descripción"
echo "- Dirección"
echo "- Número de teléfono"
echo "- Número de WhatsApp (con enlace clickeable para contacto)"
echo ""
echo "Puedes verificar los cambios accediendo a tu menú público."
echo "Recuerda que los números de WhatsApp se han generado a partir de los números"
echo "de teléfono existentes, añadiendo el código de país (+57)."
echo ""
echo "Si deseas personalizar esta información, puedes modificarla directamente"
echo "en la tabla restaurant_settings de tu base de datos Supabase." 