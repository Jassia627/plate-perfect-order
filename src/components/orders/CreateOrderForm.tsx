import { useState, useEffect } from "react";
import { useOrders, NewOrder, NewOrderItem, MenuItem, MenuCategory } from "@/hooks/use-orders";
import { useForm } from "react-hook-form";
import { Table } from "@/hooks/use-tables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStaff, StaffMember } from "@/hooks/use-staff";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CreateOrderFormProps {
  table: Table;
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const CreateOrderForm = ({ table, isOpen, onClose, onOrderCreated }: CreateOrderFormProps) => {
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const { staff, loading: staffLoading, getActiveWaiters } = useStaff();
  
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<NewOrderItem[]>([]);
  const [server, setServer] = useState("");
  const [notes, setNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWaiters, setActiveWaiters] = useState<StaffMember[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");

  // Cargar datos del usuario actual
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      
      // Buscar si el usuario actual es un camarero en el staff
      const waiters = getActiveWaiters();
      setActiveWaiters(waiters);
      
      let foundWaiter = false;
      // Si el email del usuario coincide con algún camarero, seleccionarlo automáticamente
      const currentWaiter = waiters.find(waiter => waiter.email === user.email);
      if (currentWaiter) {
        setServer(currentWaiter.name);
        foundWaiter = true;
      } else {
        // Si no encontramos al usuario en la lista de camareros activos,
        // usamos el nombre del metadata o el email como alternativa
        const userName = user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         "Usuario";
        setServer(userName);
        
        // Mostrar mensaje informativo solo si estamos en rol mesero pero no está en la lista
        if (user.user_metadata?.role === 'mesero' || user.user_metadata?.role === 'waiter') {
          console.log("Usuario no encontrado en la lista de camareros activos:", user.email);
          // Solo notificar una vez por sesión usando localStorage
          const notifiedKey = `notified_waiter_${user.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            toast.info("Tu usuario no está en la lista de meseros activos. Usando tu nombre de usuario.", 
              { duration: 5000 }
            );
            localStorage.setItem(notifiedKey, "true");
          }
        }
      }
    }
  }, [user, getActiveWaiters]);

  // Cargar categorías y productos del menú
  useEffect(() => {
    const fetchMenuData = async () => {
      setLoading(true);
      try {
        // Verificar si hay un usuario autenticado
        if (!supabase.auth.getSession()) {
          throw new Error("Usuario no autenticado");
        }

        // Obtener el ID del usuario actual
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData.session?.user.id;

        if (!currentUserId) {
          throw new Error("No se pudo obtener el ID del usuario");
        }

        console.log("Cargando menú para mesa:", table.id, "admin_id:", table.admin_id);

        // Obtener categorías filtrando por el admin_id de la mesa
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("admin_id", table.admin_id)
          .order("sort_order", { ascending: true });

        if (categoriesError) {
          console.error("Error al cargar categorías:", categoriesError);
          throw categoriesError;
        }

        console.log(`Categorías cargadas: ${categoriesData?.length || 0}`);

        // Obtener productos filtrando por el admin_id de la mesa
        const { data: itemsData, error: itemsError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("admin_id", table.admin_id)
          .eq("available", true);

        if (itemsError) {
          console.error("Error al cargar productos:", itemsError);
          throw itemsError;
        }

        console.log(`Productos cargados: ${itemsData?.length || 0}`);

        setMenuCategories(categoriesData as MenuCategory[]);
        setMenuItems(itemsData as MenuItem[]);
        
        // Establecer la primera categoría como activa
        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      } catch (error) {
        console.error("Error al cargar datos del menú:", error);
        toast.error("Error al cargar el menú");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMenuData();
      setSelectedItems([]);
      setNotes("");
      setServer("");
    }
  }, [isOpen, table]);

  // Filtrar productos por categoría seleccionada
  const filteredItems = activeCategory
    ? menuItems.filter((item) => item.category_id === activeCategory)
    : menuItems;

  // Agregar un producto al pedido
  const addItemToOrder = (item: MenuItem) => {
    // Verificar si el ítem ya está en el pedido
    const existingItemIndex = selectedItems.findIndex(
      (selectedItem) => selectedItem.menu_item_id === item.id
    );

    if (existingItemIndex >= 0) {
      // Incrementar la cantidad si ya existe
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Agregar como nuevo ítem si no existe
      const newItem: NewOrderItem = {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        status: "pending"
      };
      setSelectedItems([...selectedItems, newItem]);
    }

    toast.success(`${item.name} añadido al pedido`);
  };

  // Incrementar la cantidad de un producto en el pedido
  const incrementItemQuantity = (index: number) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity += 1;
    setSelectedItems(updatedItems);
  };

  // Decrementar la cantidad de un producto en el pedido
  const decrementItemQuantity = (index: number) => {
    const updatedItems = [...selectedItems];
    if (updatedItems[index].quantity > 1) {
      updatedItems[index].quantity -= 1;
      setSelectedItems(updatedItems);
    } else {
      // Eliminar el producto si la cantidad llega a cero
      removeItemFromOrder(index);
    }
  };

  // Eliminar un producto del pedido
  const removeItemFromOrder = (index: number) => {
    const updatedItems = [...selectedItems];
    updatedItems.splice(index, 1);
    setSelectedItems(updatedItems);
  };

  // Calcular el total del pedido
  const orderTotal = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Enviar el pedido
  const handleSubmit = async () => {
    // Asegurarse de que tenemos un nombre de camarero
    let meseroNombre = server.trim();
    
    if (!meseroNombre) {
      // Si no tenemos nombre, intentar obtenerlo del usuario actual
      if (user) {
        meseroNombre = user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       "Usuario " + user.email?.substring(0, 5);
        
        // Actualizar el estado por si acaso
        setServer(meseroNombre);
      } else {
        toast.error("Debes indicar quién atiende la mesa");
        return;
      }
    }

    if (selectedItems.length === 0) {
      toast.error("Debes agregar al menos un producto al pedido");
      return;
    }

    const newOrder: NewOrder = {
      table_id: table.id,
      server: meseroNombre,
      notes: notes.trim(),
      items: selectedItems
    };

    setLoading(true);
    try {
      const orderId = await createOrder(newOrder);
      if (orderId) {
        toast.success(`Pedido creado correctamente por ${meseroNombre}`);
        onOrderCreated();
        onClose();
      }
    } catch (error) {
      console.error("Error al crear pedido:", error);
      toast.error("Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear pedido - Mesa {table.number}</DialogTitle>
          <DialogDescription>
            Agrega productos del menú para crear un nuevo pedido
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Panel de menú */}
          <div className="w-2/3 overflow-hidden flex flex-col">
            <Tabs 
              defaultValue={activeCategory || ""} 
              value={activeCategory || ""} 
              onValueChange={setActiveCategory || (() => {})}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TabsList className="w-full justify-start overflow-x-auto pb-1">
                {menuCategories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent 
                value={activeCategory || ""} 
                className="flex-1 mt-2 overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center p-4">
                    <p className="text-muted-foreground">
                      No hay productos disponibles en esta categoría
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-2 gap-3 p-1">
                      {filteredItems.map((item) => (
                        <Card 
                          key={item.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => addItemToOrder(item)}
                        >
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <span className="font-bold">${item.price.toFixed(2)}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Panel de pedido */}
          <div className="w-1/3 flex flex-col border rounded-md">
            <div className="p-3 border-b">
              <h3 className="font-medium">Resumen del pedido</h3>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-3 border-b">
                {activeWaiters.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="server-select">Atendido por:</Label>
                    <Select
                      value={server}
                      onValueChange={(value) => setServer(value)}
                    >
                      <SelectTrigger id="server-select">
                        <SelectValue placeholder="Selecciona un mesero" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeWaiters.map((waiter) => (
                          <SelectItem key={waiter.id} value={waiter.name} className={
                            waiter.email === userEmail ? "bg-primary/10 font-medium" : ""
                          }>
                            {waiter.name} 
                            {waiter.email === userEmail && " (tú)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {server && (
                        activeWaiters.find(w => w.name === server)
                          ? `El pedido será atendido por: ${server}`
                          : `El pedido será atendido por: ${server} (usuario actual)`
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="server-input">Atendido por:</Label>
                    <Input
                      id="server-input"
                      placeholder="Tu nombre"
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Introduce tu nombre como mesero
                    </p>
                  </div>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {selectedItems.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">
                      Añade productos al pedido
                    </p>
                  ) : (
                    selectedItems.map((item, index) => (
                      <div 
                        key={`${item.menu_item_id}-${index}`} 
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => decrementItemQuantity(index)}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span>{item.quantity}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => incrementItemQuantity(index)}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500 hover:text-red-700" 
                            onClick={() => removeItemFromOrder(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-3 border-t">
                <Textarea
                  placeholder="Notas del pedido (opcional)"
                  className="mb-3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || selectedItems.length === 0 || !server.trim()}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Enviando...
              </>
            ) : (
              "Crear Pedido"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderForm; 