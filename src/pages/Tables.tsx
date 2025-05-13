import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TableMap from "@/components/tables/TableMap";
import TableDetails from "@/components/tables/TableDetails";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Users, Loader2, Plus, Move } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTables, Table, TableStatus, TableShape } from "@/hooks/use-tables";
import { useReservations } from "@/hooks/use-reservations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import CreateOrderForm from "@/components/orders/CreateOrderForm";
import { useOrders } from "@/hooks/use-orders";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

const TablesPage = () => {
  // Usar los hooks para mesas y reservas
  const { 
    tables, 
    loading: tablesLoading, 
    error: tablesError,
    addTable,
    updateTable,
    updateTableStatus,
    refreshTables,
    updateTablePosition,
    diagnoseTableAccess
  } = useTables();

  const {
    reservations,
    loading: reservationsLoading,
    getReservationsByDate,
    addReservation
  } = useReservations();

  const { getOrdersByTable } = useOrders();

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [tab, setTab] = useState("map");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isAddReservationOpen, setIsAddReservationOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newTableData, setNewTableData] = useState({
    number: 1,
    capacity: 2,
    shape: "circle" as TableShape,
    width: 60,
    height: 60,
    x: 100,
    y: 100
  });
  const [newReservationData, setNewReservationData] = useState({
    customerName: "",
    people: 2,
    date: format(new Date(), "yyyy-MM-dd"),
    time: "19:00",
    contact: "",
    notes: "",
    tableId: ""
  });
  const [tableOrders, setTableOrders] = useState([]);
  const [occupiedTableAnimation, setOccupiedTableAnimation] = useState<string[]>([]);

  // Calcular estadísticas
  const totalTables = tables.length;
  const availableTables = tables.filter(table => table.status === "available").length;
  const occupiedTables = tables.filter(table => table.status === "occupied").length;
  const reservedTables = tables.filter(table => table.status === "reserved").length;

  // Cargar reservas cuando cambia la fecha seleccionada
  useEffect(() => {
    getReservationsByDate(selectedDate);
  }, [selectedDate]);

  const handleTableClick = (table: Table) => {
    if (!editMode) {
      setSelectedTable(table);
      setNewReservationData(prev => ({ ...prev, tableId: table.id }));
    }
  };

  const handleTableStatusChange = async (tableId: string, status: TableStatus) => {
    try {
      let serverInfo;
      
      // Si cambiamos a ocupado, solicitamos información del mesero
      if (status === "occupied") {
        serverInfo = { server: "Mesero Asignado" }; // Podríamos pedir esta información al usuario
        
        // Aplicar animación a la mesa que se ocupó manualmente
        setOccupiedTableAnimation(prev => [...prev, tableId]);
        
        // Quitar la animación después de 3 segundos
        setTimeout(() => {
          setOccupiedTableAnimation(prev => prev.filter(id => id !== tableId));
        }, 3000);
      }
      
      await updateTableStatus(tableId, status, serverInfo);
      
      // Actualizar la mesa seleccionada si es necesario
      if (selectedTable && selectedTable.id === tableId) {
        const updatedTable = tables.find(t => t.id === tableId);
        if (updatedTable) setSelectedTable(updatedTable);
      }
    } catch (error) {
      console.error("Error al cambiar estado de mesa:", error);
      toast.error("Error al cambiar estado de mesa");
    }
  };

  const handleTableMove = async (id: string, x: number, y: number) => {
    try {
      console.log(`Moviendo mesa ${id} a posición (${x}, ${y})`);
      
      // Actualizar temporalmente la posición en la interfaz
      const updatedTables = tables.map(table => 
        table.id === id ? { ...table, x, y } : table
      );
      
      // Llamar a la función de actualización
      await updateTablePosition(id, x, y);
      
      // Opcional: Mostrar feedback visual
      toast.success(`Mesa ${tables.find(t => t.id === id)?.number || id} reposicionada`);
    } catch (error) {
      console.error("Error al mover la mesa:", error);
      toast.error("Error al actualizar la posición de la mesa");
    }
  };

  const handleAddTable = async () => {
    try {
      // Verificar el número de mesa para asegurar que sea único
      const existingTable = tables.find(t => t.number === newTableData.number);
      if (existingTable) {
        toast.error("Ya existe una mesa con este número");
        return;
      }

      await addTable({
        ...newTableData,
        status: "available"
      });
      
      setIsAddTableOpen(false);
      
      // Reiniciar el formulario
      setNewTableData({
        number: Math.max(...tables.map(t => t.number), 0) + 1,
        capacity: 2,
        shape: "circle" as TableShape,
        width: 60,
        height: 60,
        x: 100,
        y: 100
      });
      
    } catch (error) {
      console.error("Error al añadir mesa:", error);
      toast.error("Error al añadir mesa");
    }
  };

  const handleAddReservation = async () => {
    try {
      if (!newReservationData.tableId) {
        toast.error("Selecciona una mesa para la reserva");
        return;
      }

      if (!newReservationData.customerName) {
        toast.error("Debes ingresar el nombre del cliente");
        return;
      }

      await addReservation({
        ...newReservationData,
        status: "pending"
      });
      
      setIsAddReservationOpen(false);
      
      // Reiniciar el formulario
      setNewReservationData({
        customerName: "",
        people: 2,
        date: format(new Date(), "yyyy-MM-dd"),
        time: "19:00",
        contact: "",
        notes: "",
        tableId: selectedTable ? selectedTable.id : ""
      });
      
      // Refrescar las mesas para mostrar la nueva como reservada
      refreshTables();
      
    } catch (error) {
      console.error("Error al añadir reserva:", error);
      toast.error("Error al añadir reserva");
    }
  };

  useEffect(() => {
    const checkTableOrders = async () => {
      if (selectedTable) {
        try {
          const orders = await getOrdersByTable(selectedTable.id);
          setTableOrders(orders);
        } catch (error) {
          console.error("Error al cargar pedidos de la mesa:", error);
        }
      }
    };
    
    if (selectedTable) {
      checkTableOrders();
    }
  }, [selectedTable, getOrdersByTable]);

  // Manejar acciones en las mesas
  const handleTableAction = (action: string, table: Table) => {
    if (action === "reserve") {
      if (table.status !== "available") {
        toast.error("Solo puedes reservar mesas disponibles");
        return;
      }
      
      setNewReservationData(prev => ({
        ...prev,
        tableId: table.id,
        date: selectedDate.toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }));
      
      setSelectedTable(table);
      setIsAddReservationOpen(true);
    } else if (action === "edit") {
      // Implementa la lógica para editar una mesa
    } else if (action === "orders") {
      // Seleccionar la mesa para crear un pedido
      setSelectedTableForOrder(table);
    }
  };

  // Manejar toggle de modo edición
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      toast.success("Modo edición desactivado");
    } else {
      toast.success("Modo edición activado - Ahora puedes arrastrar las mesas");
    }
  };

  return (
    <MainLayout 
      title="Gestión de Mesas" 
      subtitle="Administre las mesas y reservas"
    >
      {(tablesLoading || reservationsLoading) && (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      )}

      {tablesError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error al cargar mesas</AlertTitle>
          <AlertDescription>{tablesError}</AlertDescription>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={async () => {
              // Intentar diagnosticar el error si hay mesas en la base de datos
              const { data: anyTable, error } = await supabase
                .from('tables')
                .select('id')
                .limit(1);
                
              if (error) {
                toast.error(`Error al buscar mesas: ${error.message}`);
                return;
              }
              
              if (anyTable && anyTable.length > 0) {
                const diagnostico = await diagnoseTableAccess(anyTable[0].id);
                toast.info(`Diagnóstico: ${diagnostico.hasAccess ? 'Debería tener acceso' : 'No tiene acceso'} - ${diagnostico.reason}`);
              } else {
                toast.info("No se encontraron mesas para diagnosticar");
              }
              
              // Intentar recargar
              refreshTables();
            }}
          >
            Diagnosticar y reintentar
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Estado general */}
        <div className="col-span-12">
          <div className="bg-card p-4 rounded-lg shadow-sm flex justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <div className="text-sm text-muted-foreground">Total mesas</div>
                <div className="text-2xl font-semibold">{totalTables}</div>
              </div>
              <div>
                <div className="text-sm text-green-600">Disponibles</div>
                <div className="text-2xl font-semibold">{availableTables}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600">Ocupadas</div>
                <div className="text-2xl font-semibold">{occupiedTables}</div>
              </div>
              <div>
                <div className="text-sm text-amber-600">Reservadas</div>
                <div className="text-2xl font-semibold">{reservedTables}</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => setIsAddTableOpen(true)} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Mesa
              </Button>
              <Button onClick={() => setIsAddReservationOpen(true)} variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="col-span-12 lg:col-span-8">
          <Tabs value={tab} onValueChange={setTab} className="bg-card rounded-lg p-4">
            <TabsList className="mb-4">
              <TabsTrigger value="map">Mapa de Mesas</TabsTrigger>
              <TabsTrigger value="reservations">Reservas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Mapa de Mesas</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Modo Edición</span>
                  <Switch 
                    checked={editMode}
                    onCheckedChange={toggleEditMode}
                    aria-label="Modo edición"
                  />
                  {editMode && (
                    <div className="flex items-center ml-2 text-sm text-amber-600">
                      <Move className="h-4 w-4 mr-1" />
                      <span>Arrastra las mesas para reposicionarlas</span>
                    </div>
                  )}
                </div>
              </div>
              <TableMap 
                tables={tables} 
                onTableClick={handleTableClick}
                onTableMove={handleTableMove}
                editMode={editMode}
                occupiedTableIds={occupiedTableAnimation}
              />
            </TabsContent>
            
            <TabsContent value="reservations" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Reservas del día</h3>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <input 
                    type="date" 
                    className="border rounded px-2 py-1" 
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  />
                </div>
              </div>
              
              {reservations.length === 0 ? (
                <div className="bg-muted/20 p-8 text-center rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No hay reservas para esta fecha</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecciona otra fecha o agrega una nueva reserva
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {reservations.map(reservation => (
                    <div 
                      key={reservation.id} 
                      className="p-3 hover:bg-accent/10 rounded-md cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        const tableForReservation = tables.find(t => t.id === reservation.tableId);
                        if (tableForReservation) {
                          setSelectedTable(tableForReservation);
                          setTab("map");
                        }
                      }}
                    >
                      <div>
                        <div className="font-medium">{reservation.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          Mesa {tables.find(t => t.id === reservation.tableId)?.number || '?'} • {reservation.people} personas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{reservation.time}</div>
                        <div className="text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {reservation.status === 'confirmed' ? 'Confirmada' :
                             reservation.status === 'pending' ? 'Pendiente' :
                             reservation.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel lateral con detalles */}
        <div className="col-span-12 lg:col-span-4">
          <TableDetails 
            table={selectedTable} 
            onStatusChange={handleTableStatusChange}
            onAction={handleTableAction}
            reservations={reservations.filter(r => 
              selectedTable && r.tableId === selectedTable.id &&
              r.status !== 'cancelled'
            )}
          />
        </div>
      </div>

      {/* Modal para añadir mesa */}
      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nueva Mesa</DialogTitle>
            <DialogDescription>
              Complete la información para añadir una nueva mesa al restaurante.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Número de mesa</Label>
                <Input 
                  id="tableNumber" 
                  type="number" 
                  value={newTableData.number}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, number: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad</Label>
                <Input 
                  id="capacity" 
                  type="number" 
                  value={newTableData.capacity}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shape">Forma</Label>
              <Select 
                value={newTableData.shape} 
                onValueChange={(value: TableShape) => setNewTableData(prev => ({ ...prev, shape: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Redonda</SelectItem>
                  <SelectItem value="square">Cuadrada</SelectItem>
                  <SelectItem value="rectangle">Rectangular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Ancho (px)</Label>
                <Input 
                  id="width" 
                  type="number" 
                  value={newTableData.width}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Alto (px)</Label>
                <Input 
                  id="height" 
                  type="number" 
                  value={newTableData.height}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="xPosition">Posición X</Label>
                <Input 
                  id="xPosition" 
                  type="number" 
                  value={newTableData.x}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yPosition">Posición Y</Label>
                <Input 
                  id="yPosition" 
                  type="number" 
                  value={newTableData.y}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTableOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddTable}>Guardar Mesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para añadir reserva */}
      <Dialog open={isAddReservationOpen} onOpenChange={setIsAddReservationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>
              Complete la información para crear una nueva reserva.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre del cliente</Label>
              <Input 
                id="customerName" 
                value={newReservationData.customerName}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="people">Cantidad de personas</Label>
                <Input 
                  id="people" 
                  type="number" 
                  value={newReservationData.people}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, people: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tableSelect">Mesa</Label>
                <Select 
                  value={newReservationData.tableId} 
                  onValueChange={(value) => setNewReservationData(prev => ({ ...prev, tableId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables
                      .filter(table => table.status === 'available')
                      .map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          Mesa {table.number} ({table.capacity} personas)
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={newReservationData.date}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={newReservationData.time}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact">Contacto</Label>
              <Input 
                id="contact" 
                value={newReservationData.contact}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, contact: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input 
                id="notes" 
                value={newReservationData.notes}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddReservationOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddReservation}>Crear Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTableForOrder && (
        <CreateOrderForm
          table={selectedTableForOrder}
          isOpen={!!selectedTableForOrder}
          onClose={() => setSelectedTableForOrder(null)}
          onOrderCreated={() => {
            // Refrescar las mesas para mostrar los cambios
            refreshTables();
            
            // Añadir la mesa a la lista de animación de ocupado
            setOccupiedTableAnimation(prev => [...prev, selectedTableForOrder.id]);
            
            // Quitar la animación después de 3 segundos
            setTimeout(() => {
              setOccupiedTableAnimation(prev => prev.filter(id => id !== selectedTableForOrder.id));
            }, 3000);
            
            // Actualizar los pedidos de la mesa seleccionada si es necesaria
            if (selectedTable?.id === selectedTableForOrder.id) {
              getOrdersByTable(selectedTable.id).then(setTableOrders);
            }
          }}
        />
      )}
    </MainLayout>
  );
};

export default TablesPage;
