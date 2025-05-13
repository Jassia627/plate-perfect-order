import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableStatus } from "@/hooks/use-tables";
import { Reservation } from "@/hooks/use-reservations";
import { Calendar, Clock, Users, AlertTriangle, Receipt, CreditCard, CalendarClock, ClipboardList, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import OrderDialog from "./order/OrderDialog";
import { useOrders } from "@/hooks/use-orders";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TableDetailsProps = {
  table: Table | null;
  onStatusChange: (tableId: string, status: TableStatus) => void;
  reservations?: Reservation[];
  onAction?: (action: string, table: Table) => void;
};

const TableDetails = ({ table, onStatusChange, reservations = [], onAction }: TableDetailsProps) => {
  const { getOrdersByTable, updateOrderStatus } = useOrders();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!table) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Selecciona una mesa para ver sus detalles</p>
        </CardContent>
      </Card>
    );
  }

  const handleStatusChange = (status: TableStatus) => {
    onStatusChange(table.id, status);
  };

  const formatDateTime = (time?: string) => {
    if (!time) return '';
    return time;
  };

  // Cargar pedidos y generar la cuenta
  const handleGenerateBill = async () => {
    setLoading(true);
    try {
      // Obtener todos los pedidos de la mesa
      const orders = await getOrdersByTable(table.id);
      
      // Filtrar solo los pedidos pendientes o listos
      const activeOrders = orders.filter(order => 
        order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
      );
      
      if (activeOrders.length === 0) {
        toast.error("No hay pedidos activos para generar la cuenta");
        return;
      }
      
      setTableOrders(activeOrders);
      setIsGeneratingBill(true);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Confirmar y enviar la cuenta al cajero
  const confirmGenerateBill = async () => {
    setLoading(true);
    try {
      if (tableOrders.length === 0) {
        toast.error("No hay pedidos para generar la cuenta");
        return;
      }
      
      // Cambiar el estado de todos los pedidos a "delivered"
      const updatePromises = tableOrders.map(order => 
        updateOrderStatus(order.id, "delivered")
      );
      
      // Esperar a que todas las actualizaciones se completen
      await Promise.all(updatePromises);
      
      setIsGeneratingBill(false);
      toast.success("Cuenta enviada al cajero correctamente");
    } catch (error) {
      console.error("Error al generar la cuenta:", error);
      toast.error("Error al generar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Mesa {table.number}</CardTitle>
              <CardDescription className="mt-1">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" /> {table.capacity} personas
                </span>
              </CardDescription>
            </div>
            <Badge
              variant={
                table.status === "available" ? "outline" :
                table.status === "occupied" ? "default" : "secondary"
              }
              className={
                table.status === "available" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                table.status === "occupied" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                "bg-amber-100 text-amber-800 hover:bg-amber-100"
              }
            >
              {table.status === "available" ? "Disponible" : 
              table.status === "occupied" ? "Ocupada" : "Reservada"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información adicional de la mesa */}
          {table.status === "occupied" && (
            <div className="rounded-md bg-blue-50 p-3">
              <div className="text-sm font-medium">Información de ocupación</div>
              <div className="text-sm mt-1">
                <div>Mesero: {table.server || "No asignado"}</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1" /> 
                  Desde: {formatDateTime(table.startTime)}
                </div>
              </div>
            </div>
          )}

          {/* Reservas asociadas */}
          {reservations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Reservas para esta mesa</h3>
              
              {reservations.map(reservation => (
                <div 
                  key={reservation.id} 
                  className="rounded-md bg-muted/40 p-3"
                >
                  <div className="font-medium">{reservation.customerName}</div>
                  <div className="text-sm flex items-center mt-1">
                    <Users className="h-3.5 w-3.5 mr-1" /> 
                    {reservation.people} personas
                  </div>
                  <div className="text-sm flex items-center mt-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" /> 
                    {reservation.date} - {reservation.time}
                  </div>
                  {reservation.contact && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      Contacto: {reservation.contact}
                    </div>
                  )}
                  <Badge 
                    className="mt-2" 
                    variant={
                      reservation.status === "confirmed" ? "default" :
                      reservation.status === "pending" ? "outline" : "secondary"
                    }
                  >
                    {reservation.status === "confirmed" ? "Confirmada" :
                    reservation.status === "pending" ? "Pendiente" : "Completada"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Selector de estado */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Cambiar estado de la mesa</h3>
            
            <RadioGroup 
              defaultValue={table.status}
              onValueChange={(value) => handleStatusChange(value as TableStatus)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available" />
                <Label htmlFor="available">Disponible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="occupied" id="occupied" />
                <Label htmlFor="occupied">Ocupada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reserved" id="reserved" />
                <Label htmlFor="reserved">Reservada</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Acciones rápidas */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Acciones rápidas</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center"
                onClick={() => onAction && onAction("orders", table)}
              >
                <Receipt className="h-4 w-4 mr-1" />
                <span>Crear Pedido</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center"
                onClick={() => setShowOrderDialog(true)}
              >
                <ClipboardList className="h-4 w-4 mr-1" />
                <span>Ver Pedidos</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center"
                onClick={() => onAction && onAction("reserve", table)}
              >
                <CalendarClock className="h-4 w-4 mr-1" />
                <span>Reservar</span>
              </Button>

              {table.status === "occupied" && (
                <Button 
                  variant="default" 
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={handleGenerateBill}
                  disabled={loading}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  <span>Generar Cuenta</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showOrderDialog && (
        <OrderDialog 
          tableId={table.id}
          tableName={`Mesa ${table.number}`}
          isOpen={showOrderDialog}
          onClose={() => setShowOrderDialog(false)}
        />
      )}

      {/* Diálogo para generar la cuenta */}
      <Dialog open={isGeneratingBill} onOpenChange={setIsGeneratingBill}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Cuenta - Mesa {table.number}</DialogTitle>
            <DialogDescription>
              Esta acción enviará la cuenta al cajero para su procesamiento. 
              ¿Estás seguro?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-sm font-medium mb-2">Resumen de pedidos</div>
            
            {tableOrders.map(order => (
              <div key={order.id} className="border-b py-2">
                <div className="font-medium">Pedido #{order.id.slice(-4)}</div>
                <div className="text-sm">Total: ${order.total.toFixed(2)}</div>
              </div>
            ))}
            
            <div className="mt-4 pt-2 border-t flex justify-between font-bold">
              <span>Total a cobrar:</span>
              <span>
                ${tableOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGeneratingBill(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmGenerateBill} disabled={loading}>
              Enviar al Cajero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableDetails;
