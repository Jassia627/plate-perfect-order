# Implementación de Carrito y Pedidos Múltiples

Este documento explica cómo implementar las funcionalidades de carrito de compras y pedidos múltiples en la aplicación "Plate Perfect Order".

## Componentes implementados

Hemos creado los siguientes componentes nuevos:

1. **Contexto del Carrito** (`CartContext.tsx`)
   - Maneja el estado global del carrito
   - Almacena productos seleccionados, cantidades y notas
   - Guarda datos de entrega (dirección, teléfono, método de pago)

2. **Botón del Carrito** (`CartButton.tsx`)
   - Muestra la cantidad de productos y precio total
   - Disponible en versión flotante para móviles

3. **Drawer del Carrito** (`CartDrawer.tsx`)
   - Panel lateral para gestionar productos en el carrito
   - Formulario para datos de entrega
   - Envío del pedido completo por WhatsApp

4. **Item del Menú Público** (`PublicMenuItem.tsx`)
   - Componente reutilizable para mostrar productos
   - Botón para añadir al carrito

## Archivos a crear

Para implementar esta funcionalidad, debes crear los siguientes archivos:

- `src/components/cart/CartContext.tsx` - Contexto para gestionar el estado del carrito
- `src/components/cart/CartButton.tsx` - Botón para abrir el carrito
- `src/components/cart/CartDrawer.tsx` - Panel del carrito con productos y formulario de envío
- `src/components/menu/PublicMenuItem.tsx` - Componente para mostrar productos en el menú público

También, hemos actualizado:
- `src/pages/PublicMenu.tsx` - Para integrar el carrito y permitir selección de múltiples productos

## Dependencias requeridas

Necesitarás las siguientes dependencias:

```bash
# Para notificaciones toast
npm install sonner

# Para componentes UI (si no los tienes ya)
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
```

## Funcionalidades implementadas

La implementación incluye:

- **Selección de múltiples productos**
  - Añadir productos al carrito con cantidades específicas
  - Agregar notas especiales a cada producto
  - Ver lista de productos seleccionados

- **Datos de entrega**
  - Formulario para nombre, teléfono y dirección
  - Selección de método de pago (efectivo, transferencia, tarjeta)
  - Campo para instrucciones adicionales

- **Envío de pedido completo**
  - Formateo del mensaje con todos los productos
  - Inclusión de datos de entrega
  - Envío directo por WhatsApp al restaurante

## Cómo usar

1. Abre el menú público
2. Haz clic en los productos para añadirlos al carrito
3. Ajusta cantidades y añade notas según sea necesario
4. Haz clic en el botón del carrito para ver los productos seleccionados
5. Completa el formulario de datos de entrega
6. Haz clic en "Enviar Pedido" para enviar todo por WhatsApp

## Personalización

Puedes personalizar:

- El estilo visual de los componentes
- Los métodos de pago disponibles
- El formato del mensaje de WhatsApp
- El comportamiento de almacenamiento local del carrito 