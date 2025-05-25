import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TableMap from "@/components/tables/TableMap";
import TableDetails from "@/components/tables/TableDetails";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Users, Loader2, Plus, Move, Clock } from "lucide-react";
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
  const availableTables = tables.filter(table => table.status === "available");
  const occupiedTables = tables.filter(table => table.status === "occupied");
  const reservedTables = tables.filter(table => table.status === "reserved");
  

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
          <div className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl shadow-md border border-muted/20 transition-all duration-300 hover:shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-restaurant-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Panel de Control de Mesas
              </h2>
              
              <div className="flex flex-wrap md:flex-nowrap gap-2">
                <Button onClick={() => setIsAddTableOpen(true)} variant="default" className="bg-restaurant-primary hover:bg-restaurant-primary/90 text-white shadow-sm hover:shadow transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Mesa
                </Button>
                <Button onClick={() => setIsAddReservationOpen(true)} variant="outline" className="border-restaurant-primary text-restaurant-primary hover:bg-restaurant-primary/10 transition-all duration-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  Nueva Reserva
                </Button>
                <Button onClick={toggleEditMode} variant={editMode ? "default" : "outline"} className={editMode ? "bg-amber-500 hover:bg-amber-600 text-white" : "border-amber-500 text-amber-500 hover:bg-amber-500/10"}>
                  <Move className="h-4 w-4 mr-2" />
                  {editMode ? "Modo Edición Activo" : "Modo Edición"}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-muted/10 flex items-center transition-all duration-200 hover:shadow hover:translate-y-[-2px]">
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Total mesas</div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{totalTables}</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-l-green-500 border border-muted/10 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Disponibles</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{availableTables.length}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tables.length > 0 ? Math.round((availableTables.length / tables.length) * 100) : 0}% del total
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${tables.length > 0 ? Math.round((availableTables.length / tables.length) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-l-blue-500 border border-muted/10 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Ocupadas</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{occupiedTables.length}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}% del total
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-l-amber-500 border border-muted/10 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Reservadas</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{reservedTables.length}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tables.length > 0 ? Math.round((reservedTables.length / tables.length) * 100) : 0}% del total
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-amber-500 h-2 rounded-full" 
                      style={{ width: `${tables.length > 0 ? Math.round((reservedTables.length / tables.length) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="col-span-12 lg:col-span-8">
          <Tabs value={tab} onValueChange={setTab} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-muted/10 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-muted/10 p-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1 rounded-lg">
                <TabsTrigger 
                  value="map" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-restaurant-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200 py-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Mapa de Mesas
                </TabsTrigger>
                <TabsTrigger 
                  value="reservations"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-restaurant-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200 py-2"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="map" className="p-6 animate-in fade-in-50 duration-300">
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-blue-800 dark:text-blue-300">
                      {editMode ? 
                        "Modo edición activado: Arrastra las mesas para reposicionarlas" : 
                        "Haz clic en una mesa para ver sus detalles o realizar acciones"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-muted/10 rounded-xl overflow-hidden shadow-sm">
                <div className="relative" style={{ minHeight: '400px' }}>
                  <TableMap 
                    tables={tables} 
                    onTableClick={handleTableClick}
                    onTableMove={handleTableMove}
                    editMode={editMode}
                    occupiedTableIds={occupiedTableAnimation}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reservations" className="p-6 animate-in fade-in-50 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-medium flex items-center text-gray-800 dark:text-white">
                  <Calendar className="h-5 w-5 mr-2 text-restaurant-primary" />
                  Reservas del día
                </h3>
                <div className="flex items-center bg-white dark:bg-gray-800 border border-muted/20 rounded-md p-1 shadow-sm">
                  <Calendar className="h-4 w-4 mx-2 text-muted-foreground" />
                  <input 
                    type="date" 
                    className="bg-transparent border-0 focus:outline-none focus:ring-0 text-sm py-1" 
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  />
                </div>
              </div>
              
              {reservations.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-muted/10 p-8 text-center rounded-xl">
                  <div className="bg-white dark:bg-gray-800 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Calendar className="h-8 w-8 text-restaurant-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">No hay reservas para esta fecha</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecciona otra fecha o agrega una nueva reserva
                  </p>
                  <Button 
                    onClick={() => setIsAddReservationOpen(true)} 
                    variant="outline" 
                    className="mt-4 border-restaurant-primary text-restaurant-primary hover:bg-restaurant-primary/10"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Crear Nueva Reserva
                  </Button>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-muted/10 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 divide-y divide-muted/10">
                    {reservations.map(reservation => (
                      <div 
                        key={reservation.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                        onClick={() => {
                          const tableForReservation = tables.find(t => t.id === reservation.tableId);
                          if (tableForReservation) {
                            setSelectedTable(tableForReservation);
                            setTab("map");
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white flex items-center">
                              <Users className="h-4 w-4 mr-2 text-restaurant-primary" />
                              {reservation.customerName}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Mesa {tables.find(t => t.id === reservation.tableId)?.number || '?'} • {reservation.people} personas
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-800 dark:text-white flex items-center justify-end">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-restaurant-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {reservation.time}
                            </div>
                            <div className="mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                reservation.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                reservation.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {reservation.status === 'confirmed' ? 'Confirmada' :
                                 reservation.status === 'pending' ? 'Pendiente' :
                                 reservation.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel lateral con detalles */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-4">
            {selectedTable ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-muted/10 overflow-hidden transition-all duration-300 animate-in fade-in-50">
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
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-muted/10 p-8 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Selecciona una mesa</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                  Haz clic en una mesa en el mapa para ver sus detalles y realizar acciones
                </p>
                <Button 
                  onClick={() => setIsAddTableOpen(true)} 
                  variant="outline" 
                  className="border-restaurant-primary text-restaurant-primary hover:bg-restaurant-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Nueva Mesa
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para añadir mesa */}
      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-0 rounded-xl shadow-lg max-w-md mx-auto">
          <DialogHeader className="pb-2">
            <div className="bg-restaurant-primary/10 dark:bg-restaurant-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-restaurant-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-white">Añadir Nueva Mesa</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Complete la información para añadir una nueva mesa al restaurante.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-restaurant-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Número de mesa
                </Label>
                <Input 
                  id="tableNumber" 
                  type="number" 
                  value={newTableData.number}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, number: parseInt(e.target.value) }))}
                  className="border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                  <Users className="h-4 w-4 mr-1 text-restaurant-primary" />
                  Capacidad
                </Label>
                <Input 
                  id="capacity" 
                  type="number" 
                  value={newTableData.capacity}
                  onChange={(e) => setNewTableData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  className="border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shape" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-restaurant-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Forma de la mesa
              </Label>
              <Select 
                value={newTableData.shape} 
                onValueChange={(value: TableShape) => setNewTableData(prev => ({ ...prev, shape: value }))}
              >
                <SelectTrigger className="border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-200">
                  <SelectValue placeholder="Selecciona una forma" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-muted">
                  <SelectItem value="circle">Redonda</SelectItem>
                  <SelectItem value="square">Cuadrada</SelectItem>
                  <SelectItem value="rectangle">Rectangular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-3 mb-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dimensiones y posición
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-xs font-medium text-blue-800 dark:text-blue-300">Ancho (px)</Label>
                  <Input 
                    id="width" 
                    type="number" 
                    value={newTableData.width}
                    onChange={(e) => setNewTableData(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="border-blue-200 dark:border-blue-900/30 h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-xs font-medium text-blue-800 dark:text-blue-300">Alto (px)</Label>
                  <Input 
                    id="height" 
                    type="number" 
                    value={newTableData.height}
                    onChange={(e) => setNewTableData(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="border-blue-200 dark:border-blue-900/30 h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xPosition" className="text-xs font-medium text-blue-800 dark:text-blue-300">Posición X</Label>
                  <Input 
                    id="xPosition" 
                    type="number" 
                    value={newTableData.x}
                    onChange={(e) => setNewTableData(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="border-blue-200 dark:border-blue-900/30 h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yPosition" className="text-xs font-medium text-blue-800 dark:text-blue-300">Posición Y</Label>
                  <Input 
                    id="yPosition" 
                    type="number" 
                    value={newTableData.y}
                    onChange={(e) => setNewTableData(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="border-blue-200 dark:border-blue-900/30 h-8 text-sm"
                  />
                </div>
              </div>
              
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Puedes ajustar la posición más tarde arrastrando la mesa en modo edición.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddTableOpen(false)}
              className="w-full sm:w-auto border-muted hover:bg-muted/10 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddTable}
              className="w-full sm:w-auto bg-restaurant-primary hover:bg-restaurant-primary/90 text-white transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar Mesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para añadir reserva */}
      <Dialog open={isAddReservationOpen} onOpenChange={setIsAddReservationOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-0 rounded-xl shadow-lg max-w-md mx-auto">
          <DialogHeader className="pb-2">
            <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-white">Nueva Reserva</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Complete la información para crear una nueva reserva.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" />
                Nombre del cliente
              </Label>
              <Input 
                id="customerName" 
                value={newReservationData.customerName}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, customerName: e.target.value }))}
                className="border-muted focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                placeholder="Ingrese el nombre del cliente"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="people" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Cantidad de personas
                </Label>
                <Input 
                  id="people" 
                  type="number" 
                  value={newReservationData.people}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, people: parseInt(e.target.value) }))}
                  className="border-muted focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                  min="1"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tableSelect" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Mesa
                </Label>
                <Select 
                  value={newReservationData.tableId} 
                  onValueChange={(value) => setNewReservationData(prev => ({ ...prev, tableId: value }))}
                >
                  <SelectTrigger className="border-muted focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200">
                    <SelectValue placeholder="Selecciona una mesa" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-muted">
                    {tables
                      .filter(table => table.status === 'available')
                      .map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          Mesa {table.number} ({table.capacity} personas)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg p-4 mb-2">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center mb-3">
                <Calendar className="h-4 w-4 mr-1" />
                Fecha y hora de la reserva
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs font-medium text-amber-800 dark:text-amber-300">Fecha</Label>
                  <div className="relative">
                    <Input 
                      id="date" 
                      type="date" 
                      value={newReservationData.date}
                      onChange={(e) => setNewReservationData(prev => ({ ...prev, date: e.target.value }))}
                      className="border-amber-200 dark:border-amber-900/30 pl-8"
                    />
                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 absolute left-2 top-2.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs font-medium text-amber-800 dark:text-amber-300">Hora</Label>
                  <div className="relative">
                    <Input 
                      id="time" 
                      type="time" 
                      value={newReservationData.time}
                      onChange={(e) => setNewReservationData(prev => ({ ...prev, time: e.target.value }))}
                      className="border-amber-200 dark:border-amber-900/30 pl-8"
                    />
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 absolute left-2 top-2.5" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Teléfono de contacto
              </Label>
              <Input 
                id="contact" 
                type="tel" 
                value={newReservationData.contact}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, contact: e.target.value }))}
                className="border-muted focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                placeholder="123 456 7890"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notas adicionales
              </Label>
              <textarea 
                id="notes" 
                className="w-full min-h-[80px] p-3 border border-muted rounded-md focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 resize-none"
                value={newReservationData.notes}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Información adicional sobre la reserva..."
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddReservationOpen(false)}
              className="w-full sm:w-auto border-muted hover:bg-muted/10 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddReservation}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Guardar Reserva
            </Button>
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
