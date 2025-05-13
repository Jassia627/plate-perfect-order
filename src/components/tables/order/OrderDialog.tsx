import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useOrders, Order, OrderStatus, OrderItem } from "@/hooks/use-orders";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  CookingPot, 
  AlertCircle,
  Plus,
  Trash
} from "lucide-react";

type OrderDialogProps = {
  tableId: string;
  tableName: string;
  isOpen: boolean;
  onClose: () => void;
};

const OrderDialog = ({ tableId, tableName, isOpen, onClose }: OrderDialogProps) => {
  const { getOrdersByTable, updateOrderStatus } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar pedidos cuando se abre el diálogo
  useEffect(() => {
    const fetchOrders = async () => {
      if (isOpen && tableId) {
        setLoading(true);
        try {
          const tableOrders = await getOrdersByTable(tableId);
          setOrders(tableOrders);
        } catch (error) {
          console.error("Error al cargar pedidos:", error);
          toast.error("Error al cargar los pedidos de esta mesa");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrders();
  }, [isOpen, tableId, getOrdersByTable]);

  // Función para formatear fecha
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "HH:mm - dd MMM", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Obtener ícono según estado
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "preparing":
        return <CookingPot className="h-4 w-4 text-blue-500" />;
      case "ready":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Obtener texto según estado
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "preparing":
        return "En preparación";
      case "ready":
        return "Listo para servir";
      case "delivered":
        return "Entregado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Obtener color según estado
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "delivered":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Manejar entrega de pedido
  const handleDeliverOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const success = await updateOrderStatus(orderId, "delivered");
      if (success) {
        toast.success("Pedido marcado como entregado");
        
        // Actualizar la lista local de pedidos
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: "delivered" } 
              : order
          )
        );
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar el estado del pedido");
    } finally {
      setLoading(false);
    }
  };

  // Verificar si hay pedidos listos para servir
  const hasReadyOrders = orders.some(order => order.status === "ready");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pedidos - {tableName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay pedidos para esta mesa.
            </div>
          ) : (
            <div className="space-y-6">
              {orders
                // Ordenar por fecha (más recientes primero)
                .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
                .map((order) => (
                  <div key={order.id} className="rounded-lg border overflow-hidden">
                    <div className="p-4 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Pedido #{order.id.slice(-4)}</span>
                          <Badge className={getStatusColor(order.status)}>
                            <span className="flex items-center">
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{getStatusText(order.status)}</span>
                            </span>
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.created_at || "")}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        <span>Mesero: {order.server}</span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* Ítems del pedido */}
                      <div className="space-y-2">
                        {order.items?.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex justify-between items-center py-2 border-b last:border-0"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-medium">{item.quantity}x</span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium">{item.name}</p>
                                  
                                  {/* Mostrar estado del ítem */}
                                  {item.status === "ready" && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                      Listo
                                    </Badge>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span>${formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total y notas */}
                      <div className="flex justify-between font-medium pt-2">
                        <span>Total</span>
                        <span>${formatPrice(order.total)}</span>
                      </div>
                      
                      {order.notes && (
                        <div className="mt-3 p-2 bg-muted rounded-sm text-sm">
                          <p className="font-medium">Notas:</p>
                          <p>{order.notes}</p>
                        </div>
                      )}
                      
                      {/* Botones de acción según estado */}
                      {order.status === "ready" && (
                        <Button 
                          className="w-full mt-4"
                          onClick={() => handleDeliverOrder(order.id)}
                          disabled={loading}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar como entregado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onClose()}>
            Cerrar
          </Button>
          <Button className="bg-primary" onClick={() => onClose()}>
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
