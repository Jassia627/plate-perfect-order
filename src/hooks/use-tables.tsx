import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

// Tipos para las mesas
export type TableStatus = "available" | "occupied" | "reserved";
export type TableShape = "square" | "circle" | "rectangle";

export type Table = {
  id: string;
  number: number;
  capacity: number;
  shape: TableShape;
  width: number;
  height: number;
  x: number;
  y: number;
  status: TableStatus;
  server?: string;
  startTime?: string;
  user_id?: string;
  admin_id?: string; // Nuevo campo para almacenar el ID del administrador
  created_at?: string;
  updated_at?: string;
};

// Interfaz para los valores de retorno del hook
interface UseTablesReturn {
  tables: Table[];
  loading: boolean;
  error: string | null;
  addTable: (table: Omit<Table, 'id'>) => Promise<void>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  updateTableStatus: (id: string, status: TableStatus, serverInfo?: { server: string }) => Promise<void>;
  refreshTables: () => Promise<void>;
  updateTablePosition: (id: string, x: number, y: number) => Promise<void>;
  diagnoseTableAccess: (tableId: string) => Promise<{ hasAccess: boolean, reason: string }>;
}

export function useTables(): UseTablesReturn {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth(); // Obtener la sesión del usuario

  // Función para cargar las mesas desde Supabase
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        setError('Usuario no autenticado');
        setLoading(false);
        return;
      }
      
      console.log('Obteniendo mesas para el usuario:', session.user.id);
      
      // Hacer una consulta directa sin filtrar por user_id
      // Las políticas RLS se encargarán de filtrar los resultados correctamente
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true });
      
      if (error) {
        console.error('Error al cargar mesas:', error);
        setError(`Error al cargar mesas: ${error.message}`);
        return;
      }
      
      console.log('Mesas obtenidas:', data?.length || 0);
      
      // Transformar datos de snake_case a camelCase y convertir shape a TableShape
      const formattedTables = data.map(table => ({
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        shape: table.shape as TableShape, // Conversión explícita a TableShape
        width: table.width,
        height: table.height,
        x: table.x,
        y: table.y,
        status: table.status as TableStatus, // Conversión explícita a TableStatus
        server: table.server,
        startTime: table.start_time,
        user_id: table.user_id,
        admin_id: table.admin_id,
        created_at: table.created_at,
        updated_at: table.updated_at
      }));
      
      setTables(formattedTables);
    } catch (err) {
      console.error('Error inesperado al cargar mesas:', err);
      setError('Error inesperado al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  // Función para diagnosticar problemas de acceso a las mesas
  const diagnoseTableAccess = async (tableId: string) => {
    try {
      const { data, error } = await supabase.rpc('debug_table_access', { table_id: tableId });
      
      if (error) {
        console.error('Error al diagnosticar acceso a mesa:', error);
        return { hasAccess: false, reason: `Error: ${error.message}` };
      }
      
      return data[0];
    } catch (err) {
      console.error('Error inesperado al diagnosticar mesa:', err);
      return { hasAccess: false, reason: 'Error inesperado' };
    }
  };

  // Cargar mesas al montar el componente o cuando cambie el usuario
  useEffect(() => {
    if (session?.user) {
      fetchTables();
    }
  }, [session?.user]);

  // Función para agregar una nueva mesa
  const addTable = async (table: Omit<Table, 'id'>) => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para crear mesas');
        setLoading(false);
        return;
      }
      
      // Verificar si el usuario es un administrador
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error('Error al verificar rol de usuario:', userError);
        toast.error(`Error al verificar rol de usuario: ${userError.message}`);
        return;
      }
      
      // Solo permitir a administradores crear mesas
      if (userData && userData.role !== 'admin') {
        toast.error('Solo los administradores pueden crear mesas');
        setLoading(false);
        return;
      }
      
      // Convertir camelCase a snake_case para la base de datos
      const { startTime, ...rest } = table;
      const tableData = {
        ...rest,
        start_time: startTime,
        user_id: session.user.id, // El creador es el ID del admin
        admin_id: session.user.id  // Para admins, admin_id = user_id
      };
      
      console.log('Datos de la mesa a crear:', tableData);
      
      const { data, error } = await supabase
        .from('tables')
        .insert(tableData)
        .select()
        .single();
      
      if (error) {
        console.error('Error al crear mesa:', error);
        toast.error(`Error al crear mesa: ${error.message}`);
        return;
      }
      
      // Añadir la nueva mesa al estado con la conversión de tipos
      const newTable: Table = {
        id: data.id,
        number: data.number,
        capacity: data.capacity,
        shape: data.shape as TableShape,
        width: data.width,
        height: data.height,
        x: data.x,
        y: data.y,
        status: data.status as TableStatus,
        server: data.server,
        startTime: data.start_time,
        user_id: data.user_id,
        admin_id: data.admin_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setTables(prevTables => [...prevTables, newTable]);
      toast.success('Mesa creada correctamente');
    } catch (err) {
      console.error('Error inesperado al crear mesa:', err);
      toast.error('Error inesperado al crear mesa');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una mesa existente
  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para actualizar mesas');
        setLoading(false);
        return;
      }
      
      // Convertir camelCase a snake_case para la base de datos
      const { startTime, ...rest } = updates;
      const updateData: any = { ...rest };
      
      if (startTime !== undefined) {
        updateData.start_time = startTime;
      }
      
      const { error } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id); // Asegurar que solo se actualicen mesas del usuario actual
      
      if (error) {
        console.error('Error al actualizar mesa:', error);
        toast.error(`Error al actualizar mesa: ${error.message}`);
        return;
      }
      
      // Actualizar el estado
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === id ? { ...table, ...updates } : table
        )
      );
      
      toast.success('Mesa actualizada correctamente');
    } catch (err) {
      console.error('Error inesperado al actualizar mesa:', err);
      toast.error('Error inesperado al actualizar mesa');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una mesa
  const deleteTable = async (id: string) => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para eliminar mesas');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id); // Asegurar que solo se eliminen mesas del usuario actual
      
      if (error) {
        console.error('Error al eliminar mesa:', error);
        toast.error(`Error al eliminar mesa: ${error.message}`);
        return;
      }
      
      // Actualizar el estado
      setTables(prevTables => prevTables.filter(table => table.id !== id));
      toast.success('Mesa eliminada correctamente');
    } catch (err) {
      console.error('Error inesperado al eliminar mesa:', err);
      toast.error('Error inesperado al eliminar mesa');
    } finally {
      setLoading(false);
    }
  };

  // Función específica para actualizar el estado de una mesa
  const updateTableStatus = async (id: string, status: TableStatus, serverInfo?: { server: string }) => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para cambiar el estado de mesas');
        setLoading(false);
        return;
      }
      
      const updateData: any = { status };
      
      // Si cambiamos a ocupado, agregamos información adicional
      if (status === 'occupied' && serverInfo) {
        updateData.server = serverInfo.server;
        updateData.start_time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Si cambiamos a disponible, eliminamos información de servidor y hora
      if (status === 'available') {
        updateData.server = null;
        updateData.start_time = null;
      }
      
      const { error } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id); // Asegurar que solo se actualicen mesas del usuario actual
      
      if (error) {
        console.error('Error al actualizar estado de mesa:', error);
        toast.error(`Error al actualizar estado de mesa: ${error.message}`);
        return;
      }
      
      // Actualizar el estado
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === id 
            ? { 
                ...table, 
                status, 
                ...(status === 'occupied' && serverInfo 
                  ? { 
                      server: serverInfo.server,
                      startTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    } 
                  : {}),
                ...(status === 'available' 
                  ? { 
                      server: undefined,
                      startTime: undefined
                    } 
                  : {})
              } 
            : table
        )
      );
      
      toast.success(`Estado de mesa actualizado a: ${status}`);
    } catch (err) {
      console.error('Error inesperado al actualizar estado de mesa:', err);
      toast.error('Error inesperado al actualizar estado de mesa');
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar manualmente la lista de mesas
  const refreshTables = async () => {
    await fetchTables();
  };

  // Función para actualizar la posición de una mesa
  const updateTablePosition = async (id: string, x: number, y: number) => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para mover mesas');
        setLoading(false);
        return;
      }
      
      // Convertir a números enteros para mayor precisión
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      
      // Actualizar primero el estado local para una respuesta inmediata
      setTables(prev => 
        prev.map(table => 
          table.id === id ? { ...table, x: roundedX, y: roundedY } : table
        )
      );
      
      // Luego enviar la actualización a la base de datos
      const { error } = await supabase
        .from("tables")
        .update({ x: roundedX, y: roundedY })
        .eq("id", id)
        .eq('user_id', session.user.id); // Asegurar que solo se actualicen mesas del usuario actual

      if (error) {
        console.error("Error al actualizar posición:", error);
        toast.error("No se pudo actualizar la posición de la mesa");
        
        // Si hay error, revertir al estado anterior
        await fetchTables();
        return;
      }

      toast.success("Posición actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar la posición de la mesa:", error);
      toast.error("No se pudo actualizar la posición de la mesa");
      
      // Si hay error, recargar las mesas para asegurar consistencia
      await fetchTables();
    } finally {
      setLoading(false);
    }
  };

  return { 
    tables, 
    loading, 
    error, 
    addTable, 
    updateTable, 
    deleteTable, 
    updateTableStatus,
    refreshTables,
    updateTablePosition,
    diagnoseTableAccess
  };
} 