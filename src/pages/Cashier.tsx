import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
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
  const { session } = useAuth(); // Obtener la sesión del usuario
  const [pendingBills, setPendingBills] = useState<{table: Table, orders: Order[]}[]>([]);
  const [completedBills, setCompletedBills] = useState<{table: Table, orders: Order[], completedAt?: string}[]>([]);
  const [selectedBill, setSelectedBill] = useState<{table: Table, orders: Order[]} | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar las cuentas pendientes y completadas
  useEffect(() => {
    const loadBills = async () => {
      setLoading(true);
      try {
        if (tablesLoading || ordersLoading) return;
        
        const billsData: {table: Table, orders: Order[]}[] = [];
        const completedData: {table: Table, orders: Order[], completedAt: string}[] = [];
        
        // Verificar si hay un usuario autenticado
        if (!session?.user) {
          console.error('Usuario no autenticado');
          setLoading(false);
          return;
        }
        
        // Verificar el rol del usuario
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, admin_id')
          .eq('user_id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error al verificar rol de usuario:', profileError);
          setLoading(false);
          return;
        }
        
        // Obtener las órdenes con sus estados de pago de las últimas 24 horas
        // No filtrar por user_id ya que esta columna no existe en la tabla payments
        // El cajero debe poder ver todos los pagos independientemente de quién los haya generado
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // últimas 24 horas
        
        if (paymentsError) {
          console.error("Error al cargar pagos:", paymentsError);
          toast.error("Error al cargar pagos. Intente nuevamente.");
          setLoading(false);
          return;
        }

        // Crear un mapa de órdenes pagadas
        const paidOrderIds = new Set(payments?.flatMap(payment => 
          payment.order_ids || []
        ) || []);
        
        // SOLUCIÓN: Obtener todas las órdenes que el cajero debe ver
        // Modificamos la lógica para que el cajero pueda ver todas las cuentas generadas por cualquier rol
        let allOrders: Order[] = [];
        
        // Para cajeros y administradores, obtener todas las órdenes del restaurante
        if (profileData && (profileData.role === 'cajero' || profileData.role === 'admin')) {
          console.log('Cargando órdenes para rol:', profileData.role);
          
          let query = supabase.from('orders').select('*');
          
          // Verificar si el usuario pertenece a un restaurante
          if (profileData.restaurant_id) {
            // Si pertenece a un restaurante, mostrar todas las órdenes de ese restaurante
            // independientemente de quién las haya creado
            console.log('Obteniendo órdenes para el restaurante ID:', profileData.restaurant_id);
            
            // Obtener todos los usuarios que pertenecen al mismo restaurante
            const { data: restaurantUsersData, error: restaurantUsersError } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('restaurant_id', profileData.restaurant_id);
            
            if (restaurantUsersError) {
              console.error('Error al obtener usuarios del restaurante:', restaurantUsersError);
              toast.error("Error al cargar las cuentas. Intente nuevamente.");
            } else if (restaurantUsersData && restaurantUsersData.length > 0) {
              // Incluir a todos los usuarios del restaurante
              const userIds = restaurantUsersData.map(user => user.user_id);
              
              // Construir condición OR para incluir a todos los usuarios del restaurante
              const orConditions = [];
              userIds.forEach(id => orConditions.push(`user_id.eq.${id}`));
              
              // También incluir órdenes donde el restaurant_id coincide
              orConditions.push(`restaurant_id.eq.${profileData.restaurant_id}`);
              
              query = query.or(orConditions.join(','));
              console.log(`Mostrando pedidos de ${userIds.length} usuarios del mismo restaurante`);
            } else {
              // Si no hay otros usuarios, mostrar pedidos del restaurante
              query = query.or(`user_id.eq.${session.user.id},restaurant_id.eq.${profileData.restaurant_id}`);
              console.log('No hay otros usuarios, mostrando pedidos del restaurante');
            }
          } 
          // Si es admin, mostrar todos los pedidos de sus empleados
          else if (profileData.role === 'admin') {
            // Obtener todos los usuarios que tienen a este admin como su admin_id
            const { data: staffData, error: staffError } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('admin_id', session.user.id);
            
            if (staffError) {
              console.error('Error al obtener personal del admin:', staffError);
              toast.error("Error al cargar las cuentas. Intente nuevamente.");
            } else if (staffData && staffData.length > 0) {
              // Incluir al admin y a todo su personal
              const staffIds = staffData.map(staff => staff.user_id);
              const orConditions = [`user_id.eq.${session.user.id}`, `admin_id.eq.${session.user.id}`];
              staffIds.forEach(id => orConditions.push(`user_id.eq.${id}`));
              
              query = query.or(orConditions.join(','));
              console.log(`Admin: mostrando pedidos propios y de ${staffIds.length} miembros del personal`);
            } else {
              // Si no tiene personal, mostrar sus propios pedidos
              query = query.or(`user_id.eq.${session.user.id},admin_id.eq.${session.user.id}`);
              console.log('Admin sin personal: mostrando solo pedidos propios');
            }
          } 
          // Si el cajero tiene un admin_id, mostrar órdenes de todos los que comparten ese admin_id
          else if (profileData.role === 'cajero' && profileData.admin_id) {
            // Obtener todos los usuarios que tienen el mismo admin_id
            const { data: colleaguesData, error: colleaguesError } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('admin_id', profileData.admin_id);
            
            if (colleaguesError) {
              console.error('Error al obtener colegas del cajero:', colleaguesError);
              toast.error("Error al cargar las cuentas. Intente nuevamente.");
            } else {
              // También obtener al admin
              const { data: adminData } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('user_id', profileData.admin_id)
                .single();
              
              // Construir la lista de usuarios para incluir en la consulta
              const userIds = [session.user.id]; // Incluir al cajero
              
              // Añadir al admin
              if (adminData) {
                userIds.push(adminData.user_id);
              }
              
              // Añadir a los colegas
              if (colleaguesData && colleaguesData.length > 0) {
                colleaguesData.forEach(colleague => userIds.push(colleague.user_id));
              }
              
              // Construir la condición OR
              const orConditions = userIds.map(id => `user_id.eq.${id}`);
              
              query = query.or(orConditions.join(','));
              console.log(`Cajero: mostrando pedidos propios, del admin y de ${colleaguesData?.length || 0} colegas`);
            }
          } else {
            // Si el cajero no tiene admin_id ni restaurant_id, solo ver sus propios pedidos
            query = query.eq('user_id', session.user.id);
            console.log('Cajero sin admin ni restaurant_id: mostrando solo pedidos propios');
          }
          
          // IMPORTANTE: Aquí estaba el error - no podemos usar .or() después de otro .or()
          // porque sobreescribe la condición anterior. En su lugar, usamos .in() para el status
          query = query.in('status', ['ready', 'delivered']);
          
          // Ejecutar la consulta
          console.log('Ejecutando consulta para obtener órdenes listas para cobro...');
          
          const { data: allOrdersData, error: allOrdersError } = await query
            .order('created_at', { ascending: false });
          
          if (allOrdersError) {
            console.error('Error al cargar órdenes para cobro:', allOrdersError);
          } else if (allOrdersData) {
            console.log('Órdenes cargadas para cobro:', allOrdersData.length);
            
            // Mostrar detalles de las órdenes encontradas
            allOrdersData.forEach(order => {
              console.log(`Orden ID: ${order.id}, Mesa: ${order.table_id}, Estado: ${order.status}, Usuario: ${order.user_id}`);
            });
            
            allOrders = allOrdersData as Order[];
          } else {
            console.log('No se encontraron órdenes para cobro');
          }
        } else {
          // Para otros roles, usar las órdenes filtradas por el hook
          allOrders = orders;
        }
        
        // Agrupar órdenes por mesa
        const ordersByTable: Record<string, Order[]> = {};
        allOrders.forEach(order => {
          if (!ordersByTable[order.table_id]) {
            ordersByTable[order.table_id] = [];
          }
          ordersByTable[order.table_id].push(order);
        });
        
        // Procesamos todas las mesas que tengan órdenes listas para cobrar
        console.log('Total de mesas en el sistema:', tables.length);
        
        // Si no hay órdenes cargadas, intentamos cargarlas directamente
        if (allOrders.length === 0 && profileData) {
          console.log('No se cargaron órdenes a través del filtro. Intentando cargar directamente...');
          
          // Construir una consulta directa para obtener órdenes listas para cobrar
          let directQuery = supabase.from('orders').select('*');
          
          // Filtrar por estado
          directQuery = directQuery.in('status', ['ready', 'delivered']);
          
          // Si es cajero con admin_id, filtrar por el admin
          if (profileData.role === 'cajero' && profileData.admin_id) {
            directQuery = directQuery.eq('admin_id', profileData.admin_id);
          } else if (profileData.role === 'admin') {
            // Si es admin, mostrar sus propias órdenes
            directQuery = directQuery.eq('admin_id', session.user.id);
          }
          
          const { data: directOrdersData, error: directOrdersError } = await directQuery
            .order('created_at', { ascending: false });
          
          if (directOrdersError) {
            console.error('Error al cargar órdenes directamente:', directOrdersError);
          } else if (directOrdersData && directOrdersData.length > 0) {
            console.log(`Se cargaron ${directOrdersData.length} órdenes directamente`);
            allOrders = directOrdersData as Order[];
          }
        }
        
        // Primero, encontramos todas las órdenes listas para cobrar
        const ordersReadyForPayment: Order[] = [];
        
        // Recorremos todas las órdenes y filtramos las que están listas para cobrar
        for (const order of allOrders) {
          if ((order.status === "delivered" || order.status === "ready") && !paidOrderIds.has(order.id)) {
            ordersReadyForPayment.push(order);
          }
        }
        
        console.log('Total de órdenes listas para cobrar:', ordersReadyForPayment.length);
        
        if (ordersReadyForPayment.length > 0) {
          // Agrupamos las órdenes por mesa
          const tableIds = new Set(ordersReadyForPayment.map(order => order.table_id));
          console.log('Mesas con órdenes listas para cobrar:', tableIds.size);
          
          // Para cada mesa con órdenes listas para cobrar, creamos una entrada en billsData
          for (const tableId of tableIds) {
            const table = tables.find(t => t.id === tableId);
            if (table) {
              const tableOrders = ordersReadyForPayment.filter(order => order.table_id === tableId);
              console.log(`Mesa ${tableId} (Número ${table.number}): ${tableOrders.length} órdenes listas para cobro`);
              billsData.push({ table, orders: tableOrders });
            } else {
              console.error(`No se encontró la mesa con ID ${tableId} para órdenes listas para cobro`);
            }
          }
        } else {
          console.log('No se encontraron órdenes listas para cobrar');
        }
        
        // Procesar pagos completados
        if (payments) {
          console.log('Procesando', payments.length, 'pagos completados');
          
          // Obtener todas las u00f3rdenes pagadas, no solo las del hook
          let paidOrders: Order[] = [];
          
          // Para cada pago, obtener las u00f3rdenes directamente de la base de datos
          for (const payment of payments) {
            const orderIds = payment.order_ids || [];
            if (orderIds.length === 0) continue;
            
            console.log(`Buscando u00f3rdenes para pago con IDs: ${orderIds.join(', ')}`);
            
            // Obtener las u00f3rdenes directamente de la base de datos
            const { data: paymentOrdersData, error: paymentOrdersError } = await supabase
              .from('orders')
              .select('*')
              .in('id', orderIds);
            
            if (paymentOrdersError) {
              console.error('Error al obtener u00f3rdenes pagadas:', paymentOrdersError);
              continue;
            }
            
            if (paymentOrdersData && paymentOrdersData.length > 0) {
              // Verificar si estas u00f3rdenes pertenecen al grupo del cajero
              let shouldInclude = false;
              
              if (profileData) {
                if (profileData.role === 'admin') {
                  // Verificar si alguna orden es del admin o su personal
                  shouldInclude = paymentOrdersData.some(order => 
                    order.user_id === session.user.id || 
                    order.admin_id === session.user.id
                  );
                } else if (profileData.role === 'cajero' && profileData.admin_id) {
                  // Verificar si alguna orden es del admin del cajero
                  shouldInclude = paymentOrdersData.some(order => 
                    order.user_id === profileData.admin_id || 
                    order.admin_id === profileData.admin_id
                  );
                }
              }
              
              if (shouldInclude) {
                const ordersToAdd = paymentOrdersData as Order[];
                paidOrders = [...paidOrders, ...ordersToAdd];
                
                // Agrupar por mesa
                const tableId = ordersToAdd[0].table_id;
                const table = tables.find(t => t.id === tableId);
                
                if (table) {
                  console.log(`Agregando pago completado para mesa ${table.number} con ${ordersToAdd.length} u00f3rdenes`);
                  completedData.push({ 
                    table, 
                    orders: ordersToAdd,
                    completedAt: payment.created_at
                  });
                }
              }
            }
          }
          
          console.log(`Total de ${paidOrders.length} u00f3rdenes pagadas procesadas`);
        }
        
        setPendingBills(billsData);
        setCompletedBills(completedData);
      } catch (error) {
        console.error("Error al cargar cuentas:", error);
        toast.error("Error al cargar cuentas");
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, [tables, orders, tablesLoading, ordersLoading]);

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
      const billToProcess = { ...selectedBill };
      const orderIds = billToProcess.orders.map(order => order.id);
      const total = billToProcess.orders.reduce((sum, order) => sum + order.total, 0);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para procesar pagos');
        return;
      }
      
      // Obtener información del usuario para el registro de pago
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, admin_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error al verificar perfil del usuario:', profileError);
        toast.error(`Error al verificar perfil: ${profileError.message}`);
        setLoading(false);
        return;
      }
      
      console.log('Procesando pago para u00f3rdenes:', orderIds);
      console.log('Mu00e9todo de pago:', paymentMethod.split('|')[0]);
      console.log('Total:', total);
      console.log('Rol del usuario:', profileData?.role);
      
      // Registrar el pago en la base de datos
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          order_ids: orderIds,
          payment_method: paymentMethod.split('|')[0],
          total_amount: total,
          tip_amount: parseFloat(paymentMethod.split('|')[1]) || 0,
          received_amount: parseFloat(paymentMethod.split('|')[2]) || total,
          change_amount: parseFloat(paymentMethod.split('|')[3]) || 0
        }])
        .select();
      
      if (paymentError) {
        throw new Error("Error al registrar el pago");
      }
      
      // Actualizar el estado de las órdenes a entregadas (delivered)
      // Primero, actualizar directamente en la base de datos
      const { error: ordersUpdateError } = await supabase
        .from('orders')
        .update({ status: 'delivered' }) // Usar 'delivered' que es un estado válido
        .in('id', orderIds);
      
      if (ordersUpdateError) {
        console.error('Error al actualizar estado de las órdenes:', ordersUpdateError);
        toast.error('Error al actualizar estado de las órdenes');
      } else {
        console.log('Órdenes actualizadas a entregadas:', orderIds);
      }
      
      // Actualizar también los items de la orden a 'delivered'
      const { error: itemsUpdateError } = await supabase
        .from('order_items')
        .update({ status: 'delivered' })
        .in('order_id', orderIds);
      
      if (itemsUpdateError) {
        console.error('Error al actualizar estado de los items:', itemsUpdateError);
      } else {
        console.log('Items de órdenes actualizados a entregados');
      }
      
      // Luego, intentar actualizar también a través del hook para mantener la consistencia
      for (const orderId of orderIds) {
        try {
          await updateOrderStatus(orderId, 'delivered');
        } catch (error) {
          console.error(`Error al actualizar estado de la orden ${orderId} a través del hook:`, error);
        }
      }
      
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
      
      // Actualizar UI
      setPendingBills(prev => prev.filter(bill => bill.table.id !== billToProcess.table.id));
      setCompletedBills(prev => [...prev, {
        ...billToProcess,
        completedAt: new Date().toISOString()
      }]);
      
      toast.success("Pago procesado correctamente");
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Error al procesar el pago");
    } finally {
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
                                // No es necesario limpiar localStorage ya que ahora usamos la base de datos
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