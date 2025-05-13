import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrders, Order as OrderType, OrderItem as OrderItemType, OrderStatus } from "@/hooks/use-orders";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useSound } from "@/hooks/use-sound";

const Kitchen = () => {
  const { 
    orders, 
    loading, 
    error, 
    updateOrderStatus, 
    updateOrderItemStatus,
    refreshOrders
  } = useOrders();
  
  // Hook para sonidos
  const { playSound } = useSound();
  
  // Estado local para mantener registro de qué órdenes se están actualizando
  const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({});
  
  // Estadísticas de órdenes
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const preparingOrders = orders.filter(o => o.status === "preparing").length;
  const readyOrders = orders.filter(o => o.status === "ready").length;

  // Automáticamente recargar las órdenes cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Función para obtener el siguiente estado de una orden
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    switch (currentStatus) {
      case "pending":
        return "preparing";
      case "preparing":
        return "ready";
      case "ready":
        return "delivered";
      default:
        return currentStatus;
    }
  };

  // Función para actualizar el estado de una orden
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const newStatus = getNextStatus(currentStatus);
    
    // Mostrar una carga local mientras se actualiza
    toast.loading(`Actualizando orden a: ${getStatusText(newStatus)}...`);
    
    // Actualizar el estado local para mostrar carga en el botón
    setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
    
    try {
      // Actualizar el estado en la base de datos
      const success = await updateOrderStatus(orderId, newStatus);
      
      if (success) {
        toast.success(`Orden actualizada a: ${getStatusText(newStatus)}`);
        
        // Reproducir sonido si la orden está lista
        if (newStatus === 'ready') {
          playSound('success');
        }
        
        // Actualizar todos los items de la orden al mismo estado
        const orderItems = orders.find(o => o.id === orderId)?.items || [];
        
        await Promise.all(
          orderItems.map(item => 
            updateOrderItemStatus(item.id, newStatus as any)
          )
        );
        
        // Recargar las órdenes para mostrar el cambio inmediatamente
        await refreshOrders();
      } else {
        toast.error("No se pudo actualizar el estado de la orden");
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar el estado de la orden");
    } finally {
      // Eliminar el estado de carga local
      setUpdatingOrders(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  // Función para formatear fecha
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "HH:mm - dd MMM", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  // Texto para el botón según el estado
  const getButtonText = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "Iniciar preparación";
      case "preparing":
        return "Marcar como listo";
      case "ready":
        return "Marcar como entregado";
      default:
        return "Completado";
    }
  };

  // Clase CSS para el botón según el estado
  const getButtonVariant = (status: OrderStatus): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "pending":
        return "default";
      case "preparing":
        return "default";
      case "ready":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Clase para el estado
  const getStatusVariant = (status: OrderStatus): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "pending":
        return "default";
      case "preparing":
        return "outline";
      case "ready":
        return "secondary";
      case "delivered":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Texto para el estado
  const getStatusText = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "preparing":
        return "En preparación";
      case "ready":
        return "Listo";
      case "delivered":
        return "Entregado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <MainLayout 
      title="Cocina" 
      subtitle="Control de pedidos"
    >
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pendientes</CardTitle>
            <CardDescription>Órdenes en espera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">En preparación</CardTitle>
            <CardDescription>Órdenes actuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{preparingOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Listos</CardTitle>
            <CardDescription>Para servir/entregar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{readyOrders}</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al cargar órdenes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de órdenes */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Órdenes Actuales</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshOrders()}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center my-12 p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No hay órdenes pendientes en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              // Filtrar solo órdenes activas (no entregadas ni canceladas)
              .filter(order => !["delivered", "cancelled"].includes(order.status))
              // Ordenar primero por estado (pending primero, luego preparing, luego ready)
              .sort((a, b) => {
                const statusOrder = { pending: 0, preparing: 1, ready: 2 };
                return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
              })
              // Luego ordenar por fecha (más antiguas primero)
              .sort((a, b) => {
                if (a.status === b.status) {
                  return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
                }
                return 0;
              })
              .map(order => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        Mesa {order.table_id?.split('-').pop() || "?"} 
                      </CardTitle>
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Mesero: {order.server}</span>
                      <span>{formatDate(order.created_at || "")}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="flex justify-between py-2 border-b"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium">{item.quantity}x</span>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {order.notes && (
                      <div className="mb-4 p-2 bg-muted rounded-md text-sm">
                        <p className="font-medium">Notas:</p>
                        <p>{order.notes}</p>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full"
                      variant={getButtonVariant(order.status)}
                      disabled={["delivered", "cancelled"].includes(order.status) || loading || updatingOrders[order.id]}
                      onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                    >
                      {updatingOrders[order.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        getButtonText(order.status)
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Kitchen;
