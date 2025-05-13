import { Table } from "@/hooks/use-tables";
import { Order, OrderItem } from "@/hooks/use-orders";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Receipt, Printer, Clock, User } from "lucide-react";

type BillDetailsProps = {
  bill: { table: Table; orders: Order[] } | null;
  onProcessPayment: (bill: { table: Table; orders: Order[] }) => void;
};

const BillDetails = ({ bill, onProcessPayment }: BillDetailsProps) => {
  if (!bill) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="pt-6 text-center">
          <Receipt className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Selecciona una cuenta para ver los detalles</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular el total de la cuenta
  const total = bill.orders.reduce((sum, order) => sum + order.total, 0);
  
  // Organizar todos los ítems de todos los pedidos de manera más eficiente
  const allItems = bill.orders.flatMap(order => 
    Array.isArray(order.items) 
      ? order.items.map(item => ({
          ...item,
          orderNumber: order.id.slice(-4),
          orderTime: order.created_at
        }))
      : []
  );

  // Imprimir la cuenta (simulado)
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Detalle de Cuenta - Mesa {bill.table.number}</span>
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription className="flex flex-col">
          <span className="flex items-center">
            <User className="h-3.5 w-3.5 mr-1" />
            Atendido por: {bill.orders[0]?.server || "No especificado"}
          </span>
          <span className="flex items-center mt-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {new Date(bill.orders[0]?.created_at || "").toLocaleString()}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="font-medium text-sm mb-2">Detalle de pedidos</div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {bill.orders.map(order => (
              <div key={order.id} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Pedido #{order.id.slice(-4)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at || "").toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {(order.items || []).map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} x ${item.price.toFixed(2)}
                        </div>
                      </div>
                      <span>${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-2 pt-2 border-t text-sm">
                  <span>Subtotal del pedido</span>
                  <span className="font-medium">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Propina sugerida (10%)</span>
            <span>${(total * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 flex-col gap-2">
        <Button 
          className="w-full" 
          onClick={() => onProcessPayment(bill)}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Procesar Pago
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BillDetails; 