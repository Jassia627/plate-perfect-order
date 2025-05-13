import { useState } from "react";
import { useOrders, OrderStatus, Order, OrderItem, OrderItemStatus } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Clock, ChefHat, CheckCircle, Truck, XCircle, RefreshCcw } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

// Mapeo de estados a colores y texto en español
const orderStatusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
  delivered: "bg-purple-100 text-purple-800 border-purple-300",
  cancelled: "bg-red-100 text-red-800 border-red-300"
};

const orderStatusText: Record<OrderStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

const orderItemStatusColors: Record<OrderItemStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
  delivered: "bg-purple-100 text-purple-800 border-purple-300",
  cancelled: "bg-red-100 text-red-800 border-red-300"
};

const orderItemStatusText: Record<OrderItemStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

// Componente para mostrar un pedido individual
const OrderCard = ({ 
  order, 
  onUpdateStatus,
  onUpdateItemStatus 
}: { 
  order: Order; 
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onUpdateItemStatus: (id: string, status: OrderItemStatus) => Promise<void>;
}) => {
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Determinar qué botones de acción mostrar según el estado actual
  const renderStatusActions = () => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
            >
              <ChefHat className="h-4 w-4" />
              <span>Preparar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
            >
              <XCircle className="h-4 w-4" />
              <span>Cancelar</span>
            </Button>
          </>
        );
      case 'preparing':
        return (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => onUpdateStatus(order.id, 'ready')}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Marcar como listo</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
            >
              <XCircle className="h-4 w-4" />
              <span>Cancelar</span>
            </Button>
          </>
        );
      case 'ready':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={() => onUpdateStatus(order.id, 'delivered')}
          >
            <Truck className="h-4 w-4" />
            <span>Marcar como entregado</span>
          </Button>
        );
      default:
        return null;
    }
  };

  // Renderizar acciones para cada item según su estado
  const renderItemActions = (item: OrderItem) => {
    if (['delivered', 'cancelled'].includes(order.status)) return null;
    
    switch (item.status) {
      case 'pending':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-blue-600"
            onClick={() => onUpdateItemStatus(item.id, 'preparing')}
          >
            Preparar
          </Button>
        );
      case 'preparing':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-green-600"
            onClick={() => onUpdateItemStatus(item.id, 'ready')}
          >
            Listo
          </Button>
        );
      case 'ready':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-purple-600"
            onClick={() => onUpdateItemStatus(item.id, 'delivered')}
          >
            Entregar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Pedido #{order.id.slice(-6)}
              <Badge className={`ml-2 ${orderStatusColors[order.status]}`}>
                {orderStatusText[order.status]}
              </Badge>
            </CardTitle>
            <CardDescription>
              Mesa: {order.table_id.slice(-6)} | Servidor: {order.server}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDateTime(order.created_at)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-medium">Items del pedido:</div>
          <div className="space-y-2">
            {order.items && order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-muted/40 rounded-md">
                <div className="flex-1 flex gap-2 items-center">
                  <Badge className={`${orderItemStatusColors[item.status]}`}>
                    {orderItemStatusText[item.status]}
                  </Badge>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  {renderItemActions(item)}
                </div>
              </div>
            ))}
          </div>
          {order.notes && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Notas:</span> {order.notes}
            </div>
          )}
          <div className="mt-2 text-right text-lg font-bold">
            Total: ${order.total.toFixed(2)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        {renderStatusActions()}
      </CardFooter>
    </Card>
  );
};

// Componente principal de la página de pedidos
const Orders = () => {
  const { orders, loading, error, updateOrderStatus, updateOrderItemStatus, refreshOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filtrar órdenes según la pestaña seleccionada
  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ["pending", "preparing", "ready"].includes(order.status);
    return order.status === activeTab;
  });

  // Manejador para actualizar estado del pedido
  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    await updateOrderStatus(id, status);
  };

  // Manejador para actualizar estado de un item del pedido
  const handleUpdateItemStatus = async (id: string, status: OrderItemStatus) => {
    await updateOrderItemStatus(id, status);
  };

  return (
    <MainLayout
      title="Pedidos"
      subtitle="Gestiona todos los pedidos del restaurante"
    >
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={refreshOrders}
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Actualizar</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Activos</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <span>Pendientes</span>
          </TabsTrigger>
          <TabsTrigger value="preparing" className="flex items-center gap-1">
            <span>Preparando</span>
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-1">
            <span>Listos</span>
          </TabsTrigger>
          <TabsTrigger value="delivered" className="flex items-center gap-1">
            <span>Entregados</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-1">
            <span>Cancelados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-muted-foreground">Cargando pedidos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
              {error}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay pedidos</h3>
              <p className="text-muted-foreground mt-1">
                No se encontraron pedidos con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-2 pr-4">
                {filteredOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateItemStatus={handleUpdateItemStatus}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Orders; 