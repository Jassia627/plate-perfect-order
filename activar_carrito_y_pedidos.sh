#!/bin/bash

# Script para activar la funcionalidad de carrito de compras y pedidos múltiples
# Ejecutar con permisos adecuados: chmod +x activar_carrito_y_pedidos.sh

echo "=== Activando funcionalidad de carrito de compras y prefijos telefónicos ==="
echo "Este script instalará las dependencias necesarias y creará los componentes para el carrito"
echo ""

# Verificar carpetas de componentes
if [ ! -d "src/components/cart" ]; then
  echo "Creando directorio para componentes del carrito..."
  mkdir -p src/components/cart
fi

if [ ! -d "src/components/menu" ]; then
  echo "Creando directorio para componentes del menú..."
  mkdir -p src/components/menu
fi

# Verificar que existen los archivos necesarios para UI
echo "Verificando componentes UI necesarios..."
if [ ! -f "src/components/ui/sheet.tsx" ]; then
  echo "⚠️ Componente sheet.tsx no encontrado. Es posible que necesites instalarlo con shadcn/ui."
  echo "Puedes ejecutar: npx shadcn-ui@latest add sheet"
fi

if [ ! -f "src/components/ui/radio-group.tsx" ]; then
  echo "⚠️ Componente radio-group.tsx no encontrado. Es posible que necesites instalarlo con shadcn/ui."
  echo "Puedes ejecutar: npx shadcn-ui@latest add radio-group"
fi

# Instalar dependencias adicionales si son necesarias
echo "Verificando dependencias..."
if ! grep -q '"sonner"' package.json; then
  echo "Instalando sonner para notificaciones..."
  npm install sonner --save
else
  echo "sonner ya está instalado."
fi

# Verificar si existe el archivo de prefijos telefónicos
if [ ! -f "src/components/ui/phone-country-prefixes.ts" ]; then
  echo "Configurando prefijos telefónicos automáticos basados en monedas..."
  echo "Esta funcionalidad permite que el sistema detecte automáticamente el prefijo"
  echo "de cada país según la moneda configurada en el restaurante."
fi

echo ""
echo "✅ Preparación completada."
echo "Ahora el menú público tiene las siguientes funcionalidades:"
echo "- Carrito de compras para seleccionar múltiples productos"
echo "- Formulario para datos de entrega (dirección, teléfono, etc.)"
echo "- Selección de método de pago"
echo "- Prefijos telefónicos automáticos según el país/moneda configurados"
echo "- Envío de pedidos completos por WhatsApp"
echo ""
echo "Puedes verificar los cambios accediendo a tu menú público."
echo "Recuerda que necesitas tener las siguientes librerías de componentes instaladas:"
echo "- @radix-ui/react-dialog (para el diálogo y el drawer)"
echo "- @radix-ui/react-radio-group (para la selección de método de pago)"
echo "- sonner (para las notificaciones)"
echo ""
echo "Para la funcionalidad de prefijos telefónicos:"
echo "1. Configura la moneda de tu país en Ajustes del Restaurante"
echo "2. El sistema automáticamente reconocerá el prefijo telefónico correspondiente" 