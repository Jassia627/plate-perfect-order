
import { useState } from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Tipos para las órdenes
export type OrderStatus = "pending" | "preparing" | "ready" | "served";
export type OrderType = "dine-in" | "takeout" | "delivery";

export type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  notes?: string;
  special?: boolean;
};

export type Order = {
  id: number;
  tableNumber?: number;
  items: OrderItem[];
  status: OrderStatus;
  type: OrderType;
  time: string;
  priority: boolean;
};

type OrderListProps = {
  orders: Order[];
  onStatusChange: (orderId: number, status: OrderStatus) => void;
};

const OrderCard = ({ 
  order,
  onStatusChange,
}: { 
  order: Order;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
}) => {
  // Calcula el tiempo estimado (en minutos) basado en el estado actual
  const getTimeRemaining = (status: OrderStatus): number => {
    switch (status) {
      case "pending":
        return 15;
      case "preparing":
        return 8;
      case "ready":
        return 0;
      case "served":
        return 0;
    }
  };

  // Obtener el siguiente estado
  const getNextStatus = (status: OrderStatus): OrderStatus => {
    switch (status) {
      case "pending":
        return "preparing";
      case "preparing":
        return "ready";
      case "ready":
        return "served";
      default:
        return status;
    }
  };

  // Texto para el botón de acción
  const getActionText = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "Iniciar preparación";
      case "preparing":
        return "Marcar como listo";
      case "ready":
        return "Marcar como servido";
      case "served":
        return "Completado";
    }
  };

  // Clase para el estado
  const getStatusClass = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-300 animate-pulse-subtle";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "served":
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Icono para el estado
  const StatusIcon = ({ status }: { status: OrderStatus }) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "preparing":
        return <AlertCircle size={16} />;
      case "ready":
      case "served":
        return <Check size={16} />;
    }
  };

  // Texto para el tipo de orden
  const getOrderTypeText = (type: OrderType): string => {
    switch (type) {
      case "dine-in":
        return "En mesa";
      case "takeout":
        return "Para llevar";
      case "delivery":
        return "Delivery";
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      order.priority && "border-l-4 border-l-red-500"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">
              {order.tableNumber 
                ? `Mesa ${order.tableNumber}` 
                : `Orden #${order.id}`
              }
            </CardTitle>
            <Badge variant="outline" className="ml-2">
              {getOrderTypeText(order.type)}
            </Badge>
            {order.priority && (
              <Badge variant="destructive" className="animate-pulse-subtle">
                Prioritario
              </Badge>
            )}
          </div>
          <Badge className={getStatusClass(order.status)}>
            <StatusIcon status={order.status} />
            <span className="ml-1">{getTimeRemaining(order.status)} min</span>
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Ordenado a las {order.time}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 mb-4">
          {order.items.map((item) => (
            <li 
              key={item.id} 
              className={cn(
                "flex justify-between text-sm py-1 border-b", 
                item.special && "font-medium"
              )}
            >
              <div className="flex items-center">
                <span className="text-restaurant-primary font-medium mr-2">
                  {item.quantity}x
                </span>
                <span>{item.name}</span>
              </div>
              {item.notes && (
                <span className="text-xs italic text-muted-foreground ml-2">
                  {item.notes}
                </span>
              )}
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full"
          disabled={order.status === "served"}
          onClick={() => onStatusChange(order.id, getNextStatus(order.status))}
        >
          {getActionText(order.status)}
        </Button>
      </CardContent>
    </Card>
  );
};

const OrderList = ({ orders, onStatusChange }: OrderListProps) => {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  // Agrupamos órdenes por prioridad
  const priorityOrders = filteredOrders.filter(order => order.priority);
  const regularOrders = filteredOrders.filter(order => !order.priority);

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <Button 
          variant={filter === 'all' ? "default" : "outline"} 
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todos
        </Button>
        <Button 
          variant={filter === 'pending' ? "default" : "outline"} 
          onClick={() => setFilter('pending')}
          size="sm"
        >
          Pendientes
        </Button>
        <Button 
          variant={filter === 'preparing' ? "default" : "outline"} 
          onClick={() => setFilter('preparing')}
          size="sm"
        >
          En preparación
        </Button>
        <Button 
          variant={filter === 'ready' ? "default" : "outline"} 
          onClick={() => setFilter('ready')}
          size="sm"
        >
          Listos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Primero mostramos órdenes prioritarias */}
        {priorityOrders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order}
            onStatusChange={onStatusChange}
          />
        ))}
        
        {/* Luego órdenes regulares */}
        {regularOrders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderList;
