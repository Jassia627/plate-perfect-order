import { useState } from "react";
import { Table } from "@/hooks/use-tables";
import { Order } from "@/hooks/use-orders";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Banknote, Wallet, ArrowLeft, CheckSquare, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type ProcessPaymentProps = {
  bill: { table: Table; orders: Order[] } | null;
  onCancel: () => void;
  onComplete: (paymentMethod: string) => void;
};

type PaymentMethod = "cash" | "card" | "app";

const ProcessPayment = ({ bill, onCancel, onComplete }: ProcessPaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [tip, setTip] = useState("0");
  
  if (!bill) return null;
  
  // Calcular totales
  const subtotal = bill.orders.reduce((sum, order) => sum + order.total, 0);
  const tipAmount = parseFloat(tip) || 0;
  const total = subtotal + tipAmount;
  
  // Calcular cambio
  const received = parseFloat(receivedAmount) || 0;
  const change = Math.max(0, received - total);
  
  // Manejar cambio de método de pago
  const handlePaymentMethodChange = (value: PaymentMethod) => {
    setPaymentMethod(value);
    // Si cambia a tarjeta o app, resetear monto recibido
    if (value !== "cash") {
      setReceivedAmount("");
    }
  };
  
  // Manejar finalización del pago
  const handleCompletePayment = () => {
    // Validar según método de pago
    if (paymentMethod === "cash" && received < total) {
      toast.error("El monto recibido es insuficiente");
      return; // No proceder si el monto es insuficiente
    }
    
    // Preparar datos del pago
    const paymentData = {
      method: paymentMethod,
      tipAmount,
      received,
      change,
      total
    };
    
    // Convertir a string para enviar al componente padre
    onComplete(`${paymentMethod}|${tipAmount}|${received}|${change}`);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span>Procesar Pago - Mesa {bill.table.number}</span>
        </CardTitle>
        <CardDescription>
          Complete los detalles para procesar el pago de la cuenta
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-6">
          {/* Resumen de la cuenta */}
          <div className="bg-muted/20 p-4 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center my-2">
              <Label htmlFor="tipAmount" className="text-sm">Propina</Label>
              <Input 
                id="tipAmount"
                type="number"
                placeholder="0.00"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                className="w-24 text-right"
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-bold">
              <span>Total a pagar</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Método de pago */}
          <div>
            <Label className="text-base">Método de pago</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
              className="mt-2 flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center cursor-pointer">
                  <Banknote className="h-4 w-4 mr-2" />
                  Efectivo
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tarjeta de crédito/débito
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="app" id="app" />
                <Label htmlFor="app" className="flex items-center cursor-pointer">
                  <Wallet className="h-4 w-4 mr-2" />
                  Aplicación móvil
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Campos específicos según método de pago */}
          {paymentMethod === "cash" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="receivedAmount">Monto recibido</Label>
                <Input 
                  id="receivedAmount"
                  type="number"
                  placeholder="0.00"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-24 text-right"
                />
              </div>
              
              {received >= total && (
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex justify-between font-medium text-green-700">
                    <span>Cambio a devolver</span>
                    <span>${change.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {received > 0 && received < total && (
                <div className="bg-red-50 p-3 rounded-md">
                  <div className="flex justify-between font-medium text-red-700">
                    <span>Monto insuficiente</span>
                    <span>Faltan ${(total - received).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {paymentMethod === "card" && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                Por favor, procesa el pago con tarjeta en el terminal POS y marca como completado.
              </p>
            </div>
          )}
          
          {paymentMethod === "app" && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                Solicita al cliente que complete el pago a través de la aplicación móvil y marca como completado.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={handleCompletePayment}
          disabled={paymentMethod === "cash" && received < total}
          className="flex items-center gap-1"
        >
          Completar Pago
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProcessPayment; 