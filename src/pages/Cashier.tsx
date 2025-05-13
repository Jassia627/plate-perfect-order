import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrders, Order } from "@/hooks/use-orders";
import { useTables, Table } from "@/hooks/use-tables";
import { toast } from "sonner";
import { CreditCard, DollarSign, Receipt, CheckCircle, Clock, Loader2 } from "lucide-react";
import BillDetails from "@/components/cashier/BillDetails";
import ProcessPayment from "@/components/cashier/ProcessPayment";
import { supabase } from "@/integrations/supabase/client";

const Cashier = () => {
  const { tables, loading: tablesLoading, refreshTables } = useTables();
  const { orders, loading: ordersLoading, refreshOrders, getOrdersByTable, updateOrderStatus } = useOrders();
  const [pendingBills, setPendingBills] = useState<{table: Table, orders: Order[]}[]>([]);
  const [completedBills, setCompletedBills] = useState<{table: Table, orders: Order[]}[]>([]);
  const [selectedBill, setSelectedBill] = useState<{table: Table, orders: Order[]} | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  // Rastrear IDs de las órdenes pagadas que no tienen estado "completed" en la BD
  const [paidOrderIds, setPaidOrderIds] = useState<Set<string>>(new Set());

  // Cargar las mesas con cuentas pendientes
  useEffect(() => {
    const loadPendingBills = async () => {
      setLoading(true);
      try {
        // Solo procesar cuando se tienen tanto órdenes como mesas cargadas
        if (tablesLoading || ordersLoading) return;
        
        const billsData: {table: Table, orders: Order[]}[] = [];
        const completedData: {table: Table, orders: Order[]}[] = [];
        
        // Agrupar todos los pedidos por mesa para evitar múltiples consultas
        const ordersByTable: Record<string, Order[]> = {};
        
        // Agrupar todas las órdenes existentes por mesa
        orders.forEach(order => {
          if (!ordersByTable[order.table_id]) {
            ordersByTable[order.table_id] = [];
          }
          ordersByTable[order.table_id].push(order);
        });
        
        // Procesar solo mesas ocupadas
        const occupiedTables = tables.filter(table => table.status === "occupied");
        
        // Para cada mesa ocupada, verificar si tiene pedidos con estado "delivered" o en paidOrderIds
        for (const table of occupiedTables) {
          const tableOrders = ordersByTable[table.id] || [];
          
          // Pedidos entregados (para cobrar) - solo los que no están en paidOrderIds
          const deliveredOrders = tableOrders.filter(
            order => order.status === "delivered" && !paidOrderIds.has(order.id)
          );
          if (deliveredOrders.length > 0) {
            billsData.push({ table, orders: deliveredOrders });
          }
          
          // Pedidos pagados (según nuestro registro local)
          const paidOrders = tableOrders.filter(
            order => paidOrderIds.has(order.id)
          );
          if (paidOrders.length > 0) {
            completedData.push({ table, orders: paidOrders });
          }
        }
        
        setPendingBills(billsData);
        setCompletedBills(completedData);
      } catch (error) {
        console.error("Error al cargar cuentas pendientes:", error);
        toast.error("Error al cargar cuentas pendientes");
      } finally {
        setLoading(false);
      }
    };

    loadPendingBills();
  }, [tables, orders, tablesLoading, ordersLoading, paidOrderIds]);

  // Cargar paidOrderIds desde localStorage al inicio
  useEffect(() => {
    const savedPaidOrderIds = localStorage.getItem('paidOrderIds');
    if (savedPaidOrderIds) {
      try {
        const parsedIds = JSON.parse(savedPaidOrderIds);
        setPaidOrderIds(new Set(parsedIds));
      } catch (error) {
        console.error("Error al cargar paidOrderIds desde localStorage:", error);
      }
    }
  }, []);

  // Guardar paidOrderIds en localStorage cuando cambie
  useEffect(() => {
    if (paidOrderIds.size > 0) {
      localStorage.setItem('paidOrderIds', JSON.stringify(Array.from(paidOrderIds)));
    }
  }, [paidOrderIds]);

  // Manejar selección de cuenta
  const handleSelectBill = (bill: {table: Table, orders: Order[]}) => {
    setSelectedBill(bill);
  };

  // Manejar procesamiento de pago
  const handleProcessPayment = (bill: {table: Table, orders: Order[]}) => {
    setSelectedBill(bill);
    setIsProcessingPayment(true);
  };

  // Finalizar el pago de una cuenta
  const handleCompletePayment = async (paymentMethod: string) => {
    if (!selectedBill) {
      toast.error("No hay cuenta seleccionada para procesar");
      return;
    }
    
    setLoading(true);
    try {
      // Guardar una copia local de la cuenta seleccionada
      const billToProcess = { ...selectedBill };
      
      // Para la base de datos - no cambiamos el estado de las órdenes
      // Las órdenes ya están en estado "delivered" cuando llegan a caja
      
      // Registrar los IDs de las órdenes como pagadas en nuestro estado local
      const newPaidOrderIds = new Set(paidOrderIds);
      billToProcess.orders.forEach(order => {
        newPaidOrderIds.add(order.id);
      });
      setPaidOrderIds(newPaidOrderIds);
      
      // Actualizar listas en la UI
      // 1. Eliminar de pendientes
      setPendingBills(prev => prev.filter(bill => bill.table.id !== billToProcess.table.id));
      
      // 2. Agregar a completados
      setCompletedBills(prev => {
        // Verificar si ya existe una entrada para esta mesa
        const existingIndex = prev.findIndex(bill => bill.table.id === billToProcess.table.id);
        
        if (existingIndex >= 0) {
          // Si existe, actualizar las órdenes
          const updatedBills = [...prev];
          // Combinar las órdenes existentes con las nuevas
          updatedBills[existingIndex] = {
            ...updatedBills[existingIndex],
            orders: [...updatedBills[existingIndex].orders, ...billToProcess.orders]
          };
          return updatedBills;
        } else {
          // Si no existe, añadir nuevo elemento
          return [...prev, billToProcess];
        }
      });
      
      // Actualizar el estado de la mesa a disponible
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'available',
          server: null,
          start_time: null
        })
        .eq('id', billToProcess.table.id);
      
      if (tableError) {
        console.error("Error al actualizar estado de la mesa:", tableError);
        toast.error("Error al actualizar la mesa a disponible");
      } else {
        toast.success("Mesa actualizada a disponible");
      }
      
      // Actualizar datos remotos
      await refreshOrders();
      await refreshTables();
      
      toast.success("Pago procesado correctamente");
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Error al procesar el pago");
    } finally {
      // Siempre limpiar el estado al finalizar
      setIsProcessingPayment(false);
      setSelectedBill(null);
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Caja" subtitle="Gestione los pagos y cuentas">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Procesando...</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-12 gap-6">
        {/* Lista de cuentas */}
        <div className="col-span-12 lg:col-span-8">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="relative">
                Cuentas Pendientes
                {pendingBills.length > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingBills.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Cuentas Completadas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              {pendingBills.length === 0 ? (
                <div className="bg-muted/20 p-8 text-center rounded-lg">
                  <Receipt className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No hay cuentas pendientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Las cuentas por cobrar aparecerán aquí cuando los meseros generen la cuenta
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingBills.map((bill) => (
                    <Card 
                      key={bill.table.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        selectedBill?.table.id === bill.table.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleSelectBill(bill)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center">
                          <span>Mesa {bill.table.number}</span>
                          <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                            {bill.orders.length} pedido(s)
                          </span>
                        </CardTitle>
                        <CardDescription>
                          Atendido por: {bill.orders[0]?.server || "No especificado"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl font-bold">
                              ${bill.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Entregado: {new Date(bill.orders[0]?.updated_at || "").toLocaleTimeString()}
                            </p>
                          </div>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProcessPayment(bill);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Cobrar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {completedBills.length === 0 ? (
                <div className="bg-muted/20 p-8 text-center rounded-lg">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No hay cuentas completadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Las cuentas pagadas aparecerán aquí
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Pedir confirmación antes de limpiar
                        toast(
                          "¿Estás seguro de que deseas eliminar todas las cuentas completadas?",
                          {
                            action: {
                              label: "Confirmar",
                              onClick: () => {
                                // Limpiar cuentas completadas
                                setCompletedBills([]);
                                // Limpiar también paidOrderIds
                                setPaidOrderIds(new Set());
                                localStorage.removeItem('paidOrderIds');
                                toast.success("Se han limpiado todas las cuentas completadas");
                              }
                            },
                            cancel: {
                              label: "Cancelar",
                              onClick: () => {}
                            }
                          }
                        );
                      }}
                    >
                      Limpiar completadas
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completedBills.map((bill) => (
                      <Card 
                        key={bill.table.id}
                        className="cursor-pointer hover:border-green-500 transition-colors"
                        onClick={() => handleSelectBill(bill)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between items-center">
                            <span>Mesa {bill.table.number}</span>
                            <span className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded-full">
                              Pagado
                            </span>
                          </CardTitle>
                          <CardDescription>
                            Atendido por: {bill.orders[0]?.server || "No especificado"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">
                                ${bill.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Pagado: {new Date().toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-1" />
                              <span className="text-sm font-medium">Completado</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Detalle de la cuenta seleccionada */}
        <div className="col-span-12 lg:col-span-4">
          {isProcessingPayment ? (
            <ProcessPayment 
              bill={selectedBill}
              onCancel={() => setIsProcessingPayment(false)}
              onComplete={handleCompletePayment}
            />
          ) : (
            <BillDetails
              bill={selectedBill}
              onProcessPayment={handleProcessPayment}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Cashier; 