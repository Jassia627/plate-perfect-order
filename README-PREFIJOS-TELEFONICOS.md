# Prefijos Telefónicos Automáticos para Países

Esta funcionalidad permite que la aplicación reconozca automáticamente el prefijo telefónico del país basado en la moneda configurada en el restaurante.

## Características Implementadas

- **Detección automática de prefijos telefónicos** basada en la moneda configurada
- **Mostrar el prefijo y la bandera del país** en el formulario de pedido
- **Formateo automático de números de teléfono** para WhatsApp
- **Visualización de información del país** en los elementos del menú

## Países Soportados

La aplicación soporta prefijos telefónicos para los siguientes países latinoamericanos y España:

| Moneda | País | Prefijo | Flag |
|--------|------|---------|------|
| EUR | España | +34 | 🇪🇸 |
| ARS | Argentina | +54 | 🇦🇷 |
| BOB | Bolivia | +591 | 🇧🇴 |
| BRL | Brasil | +55 | 🇧🇷 |
| CLP | Chile | +56 | 🇨🇱 |
| COP | Colombia | +57 | 🇨🇴 |
| CRC | Costa Rica | +506 | 🇨🇷 |
| CUP | Cuba | +53 | 🇨🇺 |
| DOP | República Dominicana | +1 | 🇩🇴 |
| USD | Ecuador | +593 | 🇪🇨 |
| GTQ | Guatemala | +502 | 🇬🇹 |
| HNL | Honduras | +504 | 🇭🇳 |
| MXN | México | +52 | 🇲🇽 |
| NIO | Nicaragua | +505 | 🇳🇮 |
| PAB | Panamá | +507 | 🇵🇦 |
| PEN | Perú | +51 | 🇵🇪 |
| PYG | Paraguay | +595 | 🇵🇾 |
| UYU | Uruguay | +598 | 🇺🇾 |
| VES | Venezuela | +58 | 🇻🇪 |

## Cómo funciona

1. **Configuración del restaurante**: El administrador selecciona la moneda del país en la configuración del restaurante (por ejemplo, COP para Colombia).

2. **Detección automática**: La aplicación detecta automáticamente que la moneda corresponde a Colombia y establece el prefijo telefónico +57.

3. **Experiencia del usuario**: 
   - En el formulario de pedido se muestra automáticamente la bandera 🇨🇴 y el prefijo +57
   - El usuario solo tiene que introducir su número local (sin prefijo internacional)
   - Al enviar el pedido por WhatsApp, el sistema formatea correctamente todos los números con sus prefijos

## Archivos Principales

- `src/components/ui/phone-country-prefixes.ts`: Define los prefijos telefónicos para cada país basados en su código de moneda
- `src/hooks/use-currency.tsx`: Hook modificado para incluir información sobre prefijos telefónicos
- `src/components/cart/CartDrawer.tsx`: Componente actualizado para mostrar y usar los prefijos telefónicos

## Beneficios

- **Mejor experiencia de usuario**: Los clientes no necesitan preocuparse por el formato internacional del número
- **Reducción de errores**: Previene errores de formato en números de teléfono
- **Internacionalización automática**: Se adapta automáticamente según la configuración regional del restaurante
- **Mensajes de WhatsApp mejorados**: Los pedidos enviados incluyen números correctamente formateados

## Customización

Si necesitas añadir más países o modificar los prefijos existentes, puedes editar el archivo `src/components/ui/phone-country-prefixes.ts`. 