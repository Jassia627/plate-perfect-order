#!/bin/bash

# Script interactivo para actualizar el número de WhatsApp y la información del restaurante
# Ejecutar con permisos adecuados: chmod +x actualizar_whatsapp.sh

echo "=== Actualización de WhatsApp para Restaurante ==="
echo "Este script te ayudará a configurar el WhatsApp y la información de tu restaurante"
echo ""

# Verificar que el comando supabase está disponible
if ! command -v supabase &> /dev/null; then
    echo "Error: No se encuentra el comando 'supabase'. Por favor instala Supabase CLI primero."
    echo "Visita https://supabase.io/docs/guides/cli para más información."
    exit 1
fi

# Solicitar el UUID del administrador
read -p "Ingresa tu admin_id (formato UUID, ejemplo: 123e4567-e89b-12d3-a456-426614174000): " admin_id

# Validar formato básico de UUID
if [[ ! $admin_id =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
    echo "Error: El admin_id no tiene formato UUID válido."
    echo "Debe tener el formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx donde x son caracteres hexadecimales."
    exit 1
fi

# Solicitar el número de WhatsApp
read -p "Ingresa tu número de WhatsApp (con código de país, ejemplo: +34612345678): " whatsapp

# Validar formato básico de número con código de país
if [[ ! $whatsapp =~ ^\+[0-9]{6,15}$ ]]; then
    echo "Advertencia: El formato del número de WhatsApp podría no ser válido."
    echo "Debe comenzar con '+' seguido del código de país y el número."
    read -p "¿Deseas continuar de todos modos? (s/n): " confirmar
    if [[ $confirmar != "s" && $confirmar != "S" ]]; then
        echo "Operación cancelada."
        exit 1
    fi
fi

# Solicitar información adicional del restaurante
read -p "Nombre del restaurante: " nombre
read -p "Descripción breve: " descripcion
read -p "Dirección: " direccion

# Crear archivo SQL temporal
temp_sql=$(mktemp)

# Generar contenido SQL
cat << EOF > "$temp_sql"
-- Script generado automáticamente para actualizar el número de WhatsApp
-- Fecha: $(date)

-- Primero verificamos si existe el registro para el admin_id específico
DO \$\$
DECLARE
    admin_id_param UUID := '$admin_id';
    restaurant_exists BOOLEAN;
BEGIN
    -- Verificar si existe el registro
    SELECT EXISTS (
        SELECT 1 FROM restaurant_settings 
        WHERE admin_id = admin_id_param
    ) INTO restaurant_exists;
    
    IF restaurant_exists THEN
        -- Actualizar el número de WhatsApp
        UPDATE restaurant_settings
        SET 
            whatsapp = '$whatsapp',
            name = '$nombre',
            description = '$descripcion',
            address = '$direccion'
        WHERE admin_id = admin_id_param;
        
        RAISE NOTICE 'Información actualizada con éxito para el restaurante con admin_id: %', admin_id_param;
    ELSE
        -- Si no existe, insertamos un nuevo registro
        INSERT INTO restaurant_settings (
            admin_id, 
            name, 
            description, 
            address, 
            whatsapp
        ) VALUES (
            admin_id_param,
            '$nombre',
            '$descripcion',
            '$direccion',
            '$whatsapp'
        );
        
        RAISE NOTICE 'Creado nuevo registro de restaurant_settings con WhatsApp para admin_id: %', admin_id_param;
    END IF;
END \$\$;

-- Verificar que se haya actualizado correctamente
SELECT admin_id, name, description, address, whatsapp, phone
FROM restaurant_settings
WHERE admin_id = '$admin_id';
EOF

echo ""
echo "Ejecutando actualización de datos del restaurante..."

# Ejecutar script SQL
supabase db execute --file="$temp_sql"
resultado=$?

# Verificar resultado
if [ $resultado -eq 0 ]; then
    echo ""
    echo "✅ ¡Actualización completada con éxito!"
    echo "La información de tu restaurante y el número de WhatsApp han sido actualizados."
    echo ""
    echo "Para comprobar que todo funciona correctamente:"
    echo "1. Visita tu menú público"
    echo "2. Verifica que aparece la información del restaurante"
    echo "3. Intenta hacer un pedido de prueba por WhatsApp"
else
    echo ""
    echo "❌ Hubo un error al ejecutar la actualización."
    echo "Por favor revisa los mensajes de error anteriores."
fi

# Eliminar archivo temporal
rm -f "$temp_sql" 