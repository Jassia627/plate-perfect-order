#!/bin/bash

# Script para actualizar la funcionalidad del menú público y añadir soporte para domicilios
# Ejecutar con permisos adecuados: chmod +x actualizar_menu_publico_para_domicilios.sh

echo "Actualizando menú público para soportar domicilios y mostrar información del restaurante..."

# Verificar que el comando supabase está disponible
if ! command -v supabase &> /dev/null; then
    echo "Error: No se encuentra el comando 'supabase'. Por favor instala Supabase CLI primero."
    echo "Visita https://supabase.io/docs/guides/cli para más información."
    exit 1
fi

# Añadir la columna whatsapp si no existe
echo "Añadiendo columna whatsapp a la tabla restaurant_settings (si no existe)..."
supabase db execute --file=add_whatsapp_column.sql

# Ejecutar el script SQL para permitir acceso público a restaurant_settings
echo "Aplicando políticas de seguridad RLS..."
supabase db execute --file=fix_public_menu_access.sql

echo "Actualización completada."
echo "Ahora el menú público:"
echo "- Muestra información del restaurante (nombre, descripción, dirección, etc.)"
echo "- Permite hacer pedidos por WhatsApp al hacer clic en un producto"
echo "- Proporciona una interfaz para personalizar los pedidos con cantidades y notas"
echo ""
echo "Recuerda actualizar la información de tu restaurante, incluyendo un número de WhatsApp válido"
echo "en la tabla restaurant_settings para que los clientes puedan hacer pedidos por WhatsApp."
echo ""
echo "Si anteriormente solo tenías un número de teléfono (campo 'phone'), este ha sido copiado"
echo "automáticamente al campo 'whatsapp' como valor predeterminado." 