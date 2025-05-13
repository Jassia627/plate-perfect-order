import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Trash2, Plus, Minus, Send, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCart, CartItem, DeliveryDetails } from './CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/hooks/use-currency';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantInfo: any;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  open, 
  onOpenChange,
  restaurantInfo 
}) => {
  const [activeTab, setActiveTab] = useState('items');
  const { 
    items, 
    totalItems, 
    totalPrice, 
    updateItem, 
    removeItem, 
    clearCart,
    deliveryDetails,
    updateDeliveryDetails
  } = useCart();
  const { currencyCode, phonePrefix, countryInfo, formatPhoneNumber, formatPrice } = useCurrency();

  // Cambiar automáticamente a la pestaña de productos cuando se abre el carrito vacío
  useEffect(() => {
    if (open && items.length === 0 && activeTab === 'delivery') {
      setActiveTab('items');
    }
  }, [open, items.length, activeTab]);

  // Función para enviar el pedido por WhatsApp
  const handleSendOrder = () => {
    if (!restaurantInfo?.whatsapp) {
      alert('El restaurante no tiene un número de WhatsApp configurado');
      return;
    }
    
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    if (!deliveryDetails.address || !deliveryDetails.phone || !deliveryDetails.name) {
      setActiveTab('delivery');
      alert('Por favor completa los datos de entrega');
      return;
    }
    
    // Formatear el número de WhatsApp del restaurante con el prefijo correcto
    const formattedWhatsApp = formatPhoneNumber(restaurantInfo.whatsapp);
    // Eliminar el "+" para el formato de WhatsApp API
    const whatsappNumber = formattedWhatsApp.startsWith('+') 
      ? formattedWhatsApp.substring(1) 
      : formattedWhatsApp;
    
    // Crear mensaje para WhatsApp
    let message = `*NUEVO PEDIDO A DOMICILIO*\n\n`;
    message += `*Restaurante:* ${restaurantInfo.name}\n\n`;
    
    message += `*PRODUCTOS:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.quantity}x ${item.menuItem.name}* - ${formatPrice(item.menuItem.price * item.quantity)}\n`;
      if (item.notes) {
        message += `   _Notas: ${item.notes}_\n`;
      }
    });
    
    message += `\n*TOTAL: ${formatPrice(totalPrice)}*\n\n`;
    
    message += `*DATOS DE ENTREGA:*\n`;
    message += `*Nombre:* ${deliveryDetails.name}\n`;
    
    // Formatear el teléfono del cliente con el prefijo correcto
    const formattedClientPhone = formatPhoneNumber(deliveryDetails.phone);
    message += `*Teléfono:* ${formattedClientPhone}\n`;
    
    message += `*Dirección:* ${deliveryDetails.address}\n`;
    message += `*Método de pago:* ${getPaymentMethodText(deliveryDetails.paymentMethod)}\n`;
    
    if (deliveryDetails.additionalInstructions) {
      message += `\n*Instrucciones adicionales:*\n${deliveryDetails.additionalInstructions}\n`;
    }
    
    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp en nueva pestaña
    window.open(whatsappURL, '_blank');
    
    // Cerrar el drawer
    onOpenChange(false);
  };

  // Obtener el texto del método de pago
  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'transferencia': return 'Transferencia';
      case 'tarjeta': return 'Tarjeta';
      default: return 'No especificado';
    }
  };

  // Renderizar un ítem del carrito
  const renderCartItem = (item: CartItem) => (
    <div key={item.id} className="flex flex-col p-3 border rounded-md mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.menuItem.name}</div>
          <div className="text-sm text-muted-foreground">
            {formatPrice(item.menuItem.price)} x {item.quantity}
          </div>
          {item.notes && (
            <div className="text-xs italic mt-1 text-muted-foreground line-clamp-1">
              {item.notes}
            </div>
          )}
        </div>
        <div className="font-bold text-right ml-2">
          {formatPrice(item.menuItem.price * item.quantity)}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => updateItem(item.id, item.quantity - 1, item.notes)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="mx-2 w-6 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => updateItem(item.id, item.quantity + 1, item.notes)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          <span>Eliminar</span>
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b sticky top-0 bg-white z-10">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tu Pedido
          </SheetTitle>
          <SheetDescription>
            {totalItems === 0 
              ? 'Tu carrito está vacío' 
              : (
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mr-2">
                    {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                  </Badge>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
              )
            }
          </SheetDescription>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="px-4 pt-2 sticky top-[73px] bg-white z-10 w-full">
            <TabsTrigger value="items" className="flex-1 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Productos</span>
              {totalItems > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {totalItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex-1 flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Envío</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="items" className="flex-1 overflow-auto p-4 pt-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 h-full">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-1">Tu carrito está vacío</h3>
                <p className="text-sm text-muted-foreground">
                  Añade productos desde el menú para realizar tu pedido
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  {items.map(renderCartItem)}
                </div>
                <div className="sticky bottom-0 pt-2 pb-4 bg-background">
                  <div className="bg-muted p-3 rounded-md mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total a pagar:</span>
                      <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={clearCart}
                    >
                      Vaciar Carrito
                    </Button>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setActiveTab('delivery')}
                    >
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="delivery" className="flex-1 overflow-auto p-4 pt-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 h-full">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-1">No hay productos en tu carrito</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Debes añadir productos antes de completar tus datos de envío
                </p>
                <Button onClick={() => setActiveTab('items')}>
                  Ver productos
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-muted border-0">
                  <AlertDescription className="text-xs">
                    El número de teléfono que ingreses se formateará automáticamente con el prefijo {phonePrefix} para {countryInfo.country} {countryInfo.flag}
                  </AlertDescription>
                </Alert>
              
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input 
                    id="name" 
                    value={deliveryDetails.name}
                    onChange={(e) => updateDeliveryDetails({ name: e.target.value })}
                    placeholder="Tu nombre completo"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono de contacto</Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        {countryInfo.flag} {phonePrefix}
                      </span>
                    </div>
                    <Input 
                      id="phone" 
                      value={deliveryDetails.phone}
                      onChange={(e) => updateDeliveryDetails({ phone: e.target.value })}
                      placeholder="Número sin prefijo"
                      className="pl-16"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Dirección de entrega</Label>
                  <Input 
                    id="address" 
                    value={deliveryDetails.address}
                    onChange={(e) => updateDeliveryDetails({ address: e.target.value })}
                    placeholder="Calle, número, piso, etc."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Método de pago</Label>
                  <RadioGroup 
                    value={deliveryDetails.paymentMethod}
                    onValueChange={(value) => updateDeliveryDetails({ 
                      paymentMethod: value as DeliveryDetails['paymentMethod'] 
                    })}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-2">
                      <RadioGroupItem value="efectivo" id="efectivo" />
                      <Label htmlFor="efectivo" className="flex-1 cursor-pointer">Efectivo</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-2">
                      <RadioGroupItem value="transferencia" id="transferencia" />
                      <Label htmlFor="transferencia" className="flex-1 cursor-pointer">Transferencia</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-2">
                      <RadioGroupItem value="tarjeta" id="tarjeta" />
                      <Label htmlFor="tarjeta" className="flex-1 cursor-pointer">Tarjeta (datáfono)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <Label htmlFor="instructions">Instrucciones adicionales (opcional)</Label>
                  <Textarea 
                    id="instructions" 
                    value={deliveryDetails.additionalInstructions}
                    onChange={(e) => updateDeliveryDetails({ 
                      additionalInstructions: e.target.value 
                    })}
                    placeholder="Información para encontrar la dirección, preferencias de entrega, etc."
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="sticky bottom-0 pt-4 pb-4 mt-6 bg-background">
                  <div className="bg-muted p-3 rounded-md mb-4">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total:</span>
                      <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</span>
                      <button className="underline" onClick={() => setActiveTab('items')}>Ver detalles</button>
                    </div>
                  </div>
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                    onClick={handleSendOrder}
                  >
                    <Send className="h-4 w-4" />
                    Enviar Pedido por WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer; 