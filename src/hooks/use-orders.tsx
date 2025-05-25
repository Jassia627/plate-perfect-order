import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

// Tipos para los pedidos
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderItemStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  user_id?: string;
  admin_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  user_id?: string;
  admin_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  status: OrderItemStatus;
  user_id?: string;
  admin_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Order = {
  id: string;
  table_id: string;
  server: string;
  status: OrderStatus;
  total: number;
  notes?: string;
  items?: OrderItem[];
  user_id?: string;
  admin_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type NewOrderItem = Omit<OrderItem, 'id' | 'order_id' | 'created_at' | 'updated_at'>;

export type NewOrder = {
  table_id: string;
  server: string;
  notes?: string;
  items: NewOrderItem[];
  user_id?: string;
  admin_id?: string;
};

// Definir el tipo de evento para las órdenes
export type OrderEvent = {
  type: 'status_changed';
  orderId: string;
  tableId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
};

// Crear un event emitter simple
class OrderEventEmitter {
  private listeners: ((event: OrderEvent) => void)[] = [];

  addEventListener(callback: (event: OrderEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emitEvent(event: OrderEvent) {
    this.listeners.forEach(listener => listener(event));
  }
}

// Crear una instancia singleton del emitter
export const orderEvents = new OrderEventEmitter();

// Interfaz para los valores de retorno del hook
interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  createOrder: (order: NewOrder) => Promise<string | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  updateOrderItemStatus: (id: string, status: OrderItemStatus) => Promise<boolean>;
  getOrdersByTable: (tableId: string) => Promise<Order[]>;
  getOrderById: (id: string) => Promise<Order | null>;
  addItemToOrder: (orderId: string, item: NewOrderItem) => Promise<boolean>;
  removeItemFromOrder: (orderItemId: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { session } = useAuth(); // Obtener la sesión del usuario

  // Función para cargar los pedidos desde Supabase
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        setError('Usuario no autenticado');
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
        setError(`Error al verificar rol de usuario: ${profileError.message}`);
        return;
      }
      
      let isUserAdmin = false;
      
      if (profileData) {
        isUserAdmin = profileData.role === 'admin';
      }
      
      setIsAdmin(isUserAdmin);
      
      console.log('Cargando órdenes para el usuario:', session.user.id, 'Rol:', profileData?.role);
      
      let query = supabase.from('orders').select('*');
      
      // SOLUCIÓN: Modificar la lógica para que todos los roles puedan ver todos los pedidos
      // Esto soluciona el problema donde los pedidos no son visibles entre diferentes roles
      
      // Verificar si es un restaurante (identificado por restaurant_id)
      // Si es un restaurante, todos los usuarios del mismo restaurante deben ver los mismos pedidos
      if (profileData) {
        console.log('Perfil de usuario:', profileData.role, 'Restaurant ID:', profileData.restaurant_id);
        
        // Si el usuario pertenece a un restaurante, mostrar todos los pedidos de ese restaurante
        if (profileData.restaurant_id) {
          // Obtener todos los usuarios que pertenecen al mismo restaurante
          const { data: restaurantUsersData, error: restaurantUsersError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('restaurant_id', profileData.restaurant_id);
          
          if (restaurantUsersError) {
            console.error('Error al obtener usuarios del restaurante:', restaurantUsersError);
            setError('Error al cargar órdenes. Por favor, intente nuevamente.');
          }
          
          if (restaurantUsersData && restaurantUsersData.length > 0) {
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
        // Si el usuario es admin, mostrar todos los pedidos de sus empleados
        else if (profileData.role === 'admin') {
          // Obtener todos los usuarios que tienen a este admin como su admin_id
          const { data: staffData, error: staffError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('admin_id', session.user.id);
          
          if (staffError) {
            console.error('Error al obtener personal del admin:', staffError);
            setError('Error al cargar órdenes. Por favor, intente nuevamente.');
          }
          
          if (staffData && staffData.length > 0) {
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
        // Si el usuario tiene un admin_id, mostrar pedidos de todos los que comparten ese admin_id
        else if (profileData.admin_id) {
          // Obtener todos los usuarios que tienen el mismo admin_id
          const { data: colleaguesData, error: colleaguesError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('admin_id', profileData.admin_id);
          
          if (colleaguesError) {
            console.error('Error al obtener colegas:', colleaguesError);
            setError('Error al cargar órdenes. Por favor, intente nuevamente.');
          }
          
          // También obtener al admin
          const { data: adminData } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', profileData.admin_id)
            .single();
          
          if (colleaguesData && colleaguesData.length > 0) {
            // Incluir al usuario, a sus colegas y al admin
            const colleagueIds = colleaguesData.map(colleague => colleague.user_id);
            const orConditions = [`user_id.eq.${session.user.id}`];
            
            // Añadir al admin
            if (adminData) {
              orConditions.push(`user_id.eq.${adminData.user_id}`);
            }
            
            // Añadir a los colegas
            colleagueIds.forEach(id => orConditions.push(`user_id.eq.${id}`));
            
            query = query.or(orConditions.join(','));
            console.log(`Usuario con admin: mostrando pedidos propios, del admin y de ${colleagueIds.length} colegas`);
          } else {
            // Si no hay colegas, mostrar pedidos propios y del admin
            query = query.or(`user_id.eq.${session.user.id},user_id.eq.${profileData.admin_id}`);
            console.log('Usuario sin colegas: mostrando pedidos propios y del admin');
          }
        } else {
          // Si no tiene restaurant_id ni admin_id, mostrar solo sus pedidos
          query = query.eq('user_id', session.user.id);
          console.log('Usuario sin restaurant_id ni admin_id: mostrando solo pedidos propios');
        }
      } else {
        // Si no hay datos de perfil, mostrar solo pedidos propios
        query = query.eq('user_id', session.user.id);
        console.log('No hay datos de perfil: mostrando solo pedidos propios');
      }
      
      // Ejecutar la consulta ordenada por fecha de creación
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error al cargar pedidos:', error);
        setError(`Error al cargar pedidos: ${error.message}`);
        return;
      }
      
      console.log(`Se cargaron ${data.length} órdenes`);
      
      // Convertir los datos a nuestro tipo Order
      const ordersData: Order[] = data as Order[];
      
      // Para cada pedido, cargar sus items
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });
          
          if (itemsError) {
            console.error(`Error al cargar items del pedido ${order.id}:`, itemsError);
            return order;
          }
          
          return {
            ...order,
            items: itemsData as OrderItem[]
          };
        })
      );
      
      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error inesperado al cargar pedidos:', err);
      setError('Error inesperado al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos al montar el componente o cuando cambie el usuario
  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session?.user]);

  // Función para crear un nuevo pedido
  const createOrder = async (order: NewOrder): Promise<string | null> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para crear pedidos');
        setLoading(false);
        return null;
      }
      
      // Obtener información del usuario para saber quién es su admin
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, admin_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('Error al verificar perfil del usuario:', profileError);
        toast.error(`Error al verificar perfil: ${profileError.message}`);
        return null;
      }
      
      // Determinar user_id y admin_id para el pedido
      // Siempre asignamos el user_id al usuario autenticado actual
      let userId = session.user.id;
      let adminId = session.user.id; // Por defecto, el usuario es su propio admin
      
      // Si el usuario tiene un admin_id asignado, lo guardamos como referencia
      // pero mantenemos el user_id como el usuario actual
      if (profileData.role !== 'admin' && profileData.admin_id) {
        adminId = profileData.admin_id;
      }
      
      // Calcular el total del pedido
      const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Insertar el pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: order.table_id,
          server: order.server,
          status: 'pending',
          total,
          notes: order.notes,
          user_id: userId,
          admin_id: adminId
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error al crear pedido:', orderError);
        toast.error(`Error al crear pedido: ${orderError.message}`);
        return null;
      }
      
      // Insertar los items del pedido
      const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        status: 'pending' as OrderItemStatus,
        user_id: userId,
        admin_id: adminId
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error al crear items del pedido:', itemsError);
        toast.error(`Error al crear items del pedido: ${itemsError.message}`);
        // Eliminar el pedido ya que no pudimos crear los items
        await supabase.from('orders').delete().eq('id', orderData.id);
        return null;
      }
      
      // Actualizar la mesa como ocupada si está disponible o reservada
      await supabase
        .from('tables')
        .update({ status: 'occupied', server: order.server })
        .eq('id', order.table_id)
        .in('status', ['available', 'reserved']);
      
      // Actualizar la lista de pedidos
      await fetchOrders();
      
      toast.success('Pedido creado correctamente');
      return orderData.id;
    } catch (err) {
      console.error('Error inesperado al crear pedido:', err);
      toast.error('Error inesperado al crear pedido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de un pedido
  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para actualizar pedidos');
        setLoading(false);
        return false;
      }
      
      // Obtener el estado actual de la orden para el evento
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status, table_id')
        .eq('id', id)
        .single();
      
      if (orderError) {
        console.error('Error al obtener información de la orden:', orderError);
        return false;
      }
      
      const oldStatus = orderData.status as OrderStatus;
      const tableId = orderData.table_id;
      
      // Actualizar el estado en la base de datos
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error('Error al actualizar estado del pedido:', error);
        toast.error(`Error al actualizar estado del pedido: ${error.message}`);
        return false;
      }
      
      // Si el pedido se cancela, cancelar todos sus items
      if (status === 'cancelled') {
        const { error: itemsError } = await supabase
          .from('order_items')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('order_id', id)
          .in('status', ['pending', 'preparing']);
        
        if (itemsError) {
          console.error('Error al cancelar items del pedido:', itemsError);
        }
      }
      
      // Si el pedido se entrega, actualizar todos los items a entregados
      if (status === 'delivered') {
        const { error: itemsError } = await supabase
          .from('order_items')
          .update({ status: 'delivered', updated_at: new Date().toISOString() })
          .eq('order_id', id)
          .not('status', 'eq', 'cancelled');
        
        if (itemsError) {
          console.error('Error al actualizar items del pedido entregado:', itemsError);
        }
      }
      
      // Emitir el evento de cambio de estado
      orderEvents.emitEvent({
        type: 'status_changed',
        orderId: id,
        tableId: tableId,
        oldStatus: oldStatus,
        newStatus: status
      });
      
      // Actualizar la lista de pedidos
      await fetchOrders();
      
      toast.success(`Estado del pedido actualizado a: ${status}`);
      return true;
    } catch (err) {
      console.error('Error inesperado al actualizar estado del pedido:', err);
      toast.error('Error inesperado al actualizar estado del pedido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de un item del pedido
  const updateOrderItemStatus = async (id: string, status: OrderItemStatus): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para actualizar items');
        setLoading(false);
        return false;
      }
      
      const { error } = await supabase
        .from('order_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error('Error al actualizar estado del item:', error);
        toast.error(`Error al actualizar estado del item: ${error.message}`);
        return false;
      }
      
      // Actualizar la lista de pedidos
      await fetchOrders();
      
      toast.success(`Estado del item actualizado a: ${status}`);
      return true;
    } catch (err) {
      console.error('Error inesperado al actualizar estado del item:', err);
      toast.error('Error inesperado al actualizar estado del item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener los pedidos de una mesa específica
  const getOrdersByTable = async (tableId: string): Promise<Order[]> => {
    try {
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para ver pedidos');
        return [];
      }
      
      // Verificar el rol del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, admin_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error al verificar rol de usuario:', profileError);
        return [];
      }
      
      let query = supabase.from('orders').select('*').eq('table_id', tableId);
      
      // Aplicar filtros segu00fan el rol del usuario
      if (profileData) {
        if (profileData.role === 'admin') {
          // Los administradores ven todos los pedidos relacionados con ellos
          query = query.or(`user_id.eq.${session.user.id},admin_id.eq.${session.user.id}`);
        } else if (profileData.role === 'cocina') {
          // Los cocineros ven todos los pedidos para poder prepararlos
          if (profileData.admin_id) {
            query = query.or(`user_id.eq.${session.user.id},admin_id.eq.${profileData.admin_id}`);
          } else {
            query = query.eq('user_id', session.user.id);
          }
        } else {
          // Otros roles (meseros, cajeros) ven sus propios pedidos y los de su admin
          if (profileData.admin_id) {
            query = query.or(`user_id.eq.${session.user.id},user_id.eq.${profileData.admin_id}`);
          } else {
            query = query.eq('user_id', session.user.id);
          }
        }
      } else {
        // Si no hay perfil, solo mostrar los pedidos del usuario actual
        query = query.eq('user_id', session.user.id);
      }
      
      // Ejecutar la consulta ordenada por fecha de creaciu00f3n
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error al cargar pedidos de la mesa:', error);
        toast.error(`Error al cargar pedidos de la mesa: ${error.message}`);
        return [];
      }
      
      // Convertir los datos a nuestro tipo Order
      const ordersData: Order[] = data as Order[];
      
      // Para cada pedido, cargar sus items
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });
          
          if (itemsError) {
            console.error(`Error al cargar items del pedido ${order.id}:`, itemsError);
            return order;
          }
          
          return {
            ...order,
            items: itemsData as OrderItem[]
          };
        })
      );
      
      return ordersWithItems;
    } catch (err) {
      console.error('Error inesperado al cargar pedidos de la mesa:', err);
      toast.error('Error inesperado al cargar pedidos de la mesa');
      return [];
    }
  };

  // Función para obtener un pedido por su ID
  const getOrderById = async (id: string): Promise<Order | null> => {
    try {
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para ver pedidos');
        return null;
      }
      
      // Verificar el rol del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, admin_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error al verificar rol de usuario:', profileError);
        return null;
      }
      
      let query = supabase.from('orders').select('*').eq('id', id);
      
      // Aplicar filtros segu00fan el rol del usuario
      if (profileData) {
        if (profileData.role === 'admin') {
          // Los administradores ven todos los pedidos relacionados con ellos
          query = query.or(`user_id.eq.${session.user.id},admin_id.eq.${session.user.id}`);
        } else if (profileData.role === 'cocina') {
          // Los cocineros ven todos los pedidos para poder prepararlos
          if (profileData.admin_id) {
            query = query.or(`user_id.eq.${session.user.id},admin_id.eq.${profileData.admin_id}`);
          } else {
            query = query.eq('user_id', session.user.id);
          }
        } else {
          // Otros roles (meseros, cajeros) ven sus propios pedidos y los de su admin
          if (profileData.admin_id) {
            query = query.or(`user_id.eq.${session.user.id},user_id.eq.${profileData.admin_id}`);
          } else {
            query = query.eq('user_id', session.user.id);
          }
        }
      } else {
        // Si no hay perfil, solo mostrar los pedidos del usuario actual
        query = query.eq('user_id', session.user.id);
      }
      
      // Ejecutar la consulta
      const { data, error } = await query.single();
      
      if (error) {
        console.error('Error al cargar pedido:', error);
        toast.error(`Error al cargar pedido: ${error.message}`);
        return null;
      }
      
      // Cargar los items del pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true });
      
      if (itemsError) {
        console.error(`Error al cargar items del pedido ${id}:`, itemsError);
        return data as Order;
      }
      
      return {
        ...data as Order,
        items: itemsData as OrderItem[]
      };
    } catch (err) {
      console.error('Error inesperado al cargar pedido:', err);
      toast.error('Error inesperado al cargar pedido');
      return null;
    }
  };

  // Función para agregar un item a un pedido existente
  const addItemToOrder = async (orderId: string, item: NewOrderItem): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para agregar items');
        setLoading(false);
        return false;
      }
      
      // Verificar si el pedido existe
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('Error al verificar pedido:', orderError);
        toast.error(`Error al verificar pedido: ${orderError.message}`);
        return false;
      }
      
      // Insertar el nuevo item
      const { data: itemData, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
          status: 'pending'
        })
        .select()
        .single();
      
      if (itemError) {
        console.error('Error al agregar item al pedido:', itemError);
        toast.error(`Error al agregar item al pedido: ${itemError.message}`);
        return false;
      }
      
      // Actualizar el total del pedido
      const newTotal = parseFloat(orderData.total) + (item.price * item.quantity);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total: newTotal, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error('Error al actualizar total del pedido:', updateError);
      }
      
      // Actualizar la lista de pedidos
      await fetchOrders();
      
      toast.success('Item agregado al pedido correctamente');
      return true;
    } catch (err) {
      console.error('Error inesperado al agregar item al pedido:', err);
      toast.error('Error inesperado al agregar item al pedido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un item de un pedido
  const removeItemFromOrder = async (orderItemId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para eliminar items');
        setLoading(false);
        return false;
      }
      
      // Obtener información del item y su pedido
      const { data: itemData, error: itemError } = await supabase
        .from('order_items')
        .select('*, orders(*)')
        .eq('id', orderItemId)
        .single();
      
      if (itemError) {
        console.error('Error al obtener información del item:', itemError);
        toast.error(`Error al obtener información del item: ${itemError.message}`);
        return false;
      }
      
      // Eliminar el item
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('id', orderItemId);
      
      if (deleteError) {
        console.error('Error al eliminar item del pedido:', deleteError);
        toast.error(`Error al eliminar item del pedido: ${deleteError.message}`);
        return false;
      }
      
      // Actualizar el total del pedido
      const currentTotal = parseFloat(itemData.orders.total);
      const itemTotal = parseFloat(itemData.price) * itemData.quantity;
      const newTotal = Math.max(0, currentTotal - itemTotal); // Asegurar que no sea negativo
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total: Math.max(0, newTotal), // Asegurar que no sea negativo
          updated_at: new Date().toISOString() 
        })
        .eq('id', itemData.order_id);
      
      if (updateError) {
        console.error('Error al actualizar total del pedido:', updateError);
      }
      
      // Actualizar la lista de pedidos
      await fetchOrders();
      
      toast.success('Item eliminado del pedido correctamente');
      return true;
    } catch (err) {
      console.error('Error inesperado al eliminar item del pedido:', err);
      toast.error('Error inesperado al eliminar item del pedido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar manualmente la lista de pedidos
  const refreshOrders = async () => {
    await fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    isAdmin,
    createOrder,
    updateOrderStatus,
    updateOrderItemStatus,
    getOrdersByTable,
    getOrderById,
    addItemToOrder,
    removeItemFromOrder,
    refreshOrders
  };
} 