import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para las reservas
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Reservation = {
  id: string;
  tableId: string;
  customerName: string;
  people: number;
  date: string;
  time: string;
  contact?: string;
  notes?: string;
  status: ReservationStatus;
  created_at?: string;
  updated_at?: string;
};

// Interfaz para los valores de retorno del hook
interface UseReservationsReturn {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  getReservationsByDate: (date: Date) => Promise<void>;
  refreshReservations: () => Promise<void>;
}

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Función para cargar reservas desde Supabase
  const fetchReservations = async (date?: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Si se proporciona una fecha, filtrar por esa fecha
      let query = supabase.from('reservations').select('*');
      
      if (date) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        query = query.eq('date', formattedDate);
        setCurrentDate(date);
      }
      
      const { data, error } = await query.order('time', { ascending: true });
      
      if (error) {
        console.error('Error al cargar reservas:', error);
        setError(`Error al cargar reservas: ${error.message}`);
        return;
      }
      
      // Transformar datos de snake_case a camelCase
      const formattedReservations = data.map(reservation => ({
        id: reservation.id,
        tableId: reservation.table_id,
        customerName: reservation.customer_name,
        people: reservation.people,
        date: reservation.date,
        time: reservation.time,
        contact: reservation.contact,
        notes: reservation.notes,
        status: reservation.status as ReservationStatus,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at
      }));
      
      setReservations(formattedReservations);
    } catch (err) {
      console.error('Error inesperado al cargar reservas:', err);
      setError('Error inesperado al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar reservas al montar el componente
  useEffect(() => {
    fetchReservations();
  }, []);

  // Función para agregar una nueva reserva
  const addReservation = async (reservation: Omit<Reservation, 'id'>) => {
    try {
      setLoading(true);
      
      // Convertir camelCase a snake_case para la base de datos
      const { tableId, customerName, ...rest } = reservation;
      const reservationData = {
        table_id: tableId,
        customer_name: customerName,
        ...rest
      };
      
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single();
      
      if (error) {
        console.error('Error al crear reserva:', error);
        toast.error(`Error al crear reserva: ${error.message}`);
        return;
      }
      
      // Añadir la nueva reserva al estado
      const newReservation = {
        id: data.id,
        tableId: data.table_id,
        customerName: data.customer_name,
        people: data.people,
        date: data.date,
        time: data.time,
        contact: data.contact,
        notes: data.notes,
        status: data.status as ReservationStatus,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setReservations(prevReservations => [...prevReservations, newReservation]);
      
      // Actualizar el estado de la mesa a "reservada"
      await supabase
        .from('tables')
        .update({ status: 'reserved' })
        .eq('id', tableId);
      
      toast.success('Reserva creada correctamente');
    } catch (err) {
      console.error('Error inesperado al crear reserva:', err);
      toast.error('Error inesperado al crear reserva');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una reserva existente
  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      setLoading(true);
      
      // Convertir camelCase a snake_case para la base de datos
      const { tableId, customerName, ...rest } = updates;
      const updateData: any = { ...rest };
      
      if (tableId !== undefined) {
        updateData.table_id = tableId;
      }
      
      if (customerName !== undefined) {
        updateData.customer_name = customerName;
      }
      
      const { error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Error al actualizar reserva:', error);
        toast.error(`Error al actualizar reserva: ${error.message}`);
        return;
      }
      
      // Actualizar el estado
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === id ? { ...reservation, ...updates } : reservation
        )
      );
      
      toast.success('Reserva actualizada correctamente');
    } catch (err) {
      console.error('Error inesperado al actualizar reserva:', err);
      toast.error('Error inesperado al actualizar reserva');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una reserva
  const deleteReservation = async (id: string) => {
    try {
      setLoading(true);
      
      // Primero obtener la información de la reserva para conocer la mesa
      const { data: reservationData } = await supabase
        .from('reservations')
        .select('table_id')
        .eq('id', id)
        .single();
      
      const tableId = reservationData?.table_id;
      
      // Eliminar la reserva
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error al eliminar reserva:', error);
        toast.error(`Error al eliminar reserva: ${error.message}`);
        return;
      }
      
      // Actualizar el estado
      setReservations(prevReservations => prevReservations.filter(reservation => reservation.id !== id));
      
      // Comprobar si la mesa tiene otras reservas para hoy
      if (tableId) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: otherReservations, error: checkError } = await supabase
          .from('reservations')
          .select('id')
          .eq('table_id', tableId)
          .eq('date', today)
          .neq('status', 'cancelled');
        
        // Si no hay otras reservas, cambiar el estado de la mesa a "available"
        if (!checkError && (!otherReservations || otherReservations.length === 0)) {
          await supabase
            .from('tables')
            .update({ status: 'available' })
            .eq('id', tableId);
        }
      }
      
      toast.success('Reserva eliminada correctamente');
    } catch (err) {
      console.error('Error inesperado al eliminar reserva:', err);
      toast.error('Error inesperado al eliminar reserva');
    } finally {
      setLoading(false);
    }
  };

  // Función específica para actualizar el estado de una reserva
  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        console.error('Error al actualizar estado de reserva:', error);
        toast.error(`Error al actualizar estado de reserva: ${error.message}`);
        return;
      }
      
      // Si se cancela la reserva, comprobar si la mesa tiene otras reservas
      if (status === 'cancelled') {
        const { data: reservation } = await supabase
          .from('reservations')
          .select('table_id, date')
          .eq('id', id)
          .single();
        
        if (reservation) {
          const { table_id, date } = reservation;
          
          // Comprobar si hay otras reservas para esta mesa en la misma fecha
          const { data: otherReservations, error: checkError } = await supabase
            .from('reservations')
            .select('id')
            .eq('table_id', table_id)
            .eq('date', date)
            .neq('id', id)
            .neq('status', 'cancelled');
          
          // Si no hay otras reservas, cambiar el estado de la mesa a "available"
          if (!checkError && (!otherReservations || otherReservations.length === 0)) {
            await supabase
              .from('tables')
              .update({ status: 'available' })
              .eq('id', table_id);
          }
        }
      }
      
      // Actualizar el estado
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === id ? { ...reservation, status } : reservation
        )
      );
      
      toast.success(`Reserva ${status === 'confirmed' ? 'confirmada' : status === 'cancelled' ? 'cancelada' : status === 'completed' ? 'completada' : 'actualizada'} correctamente`);
    } catch (err) {
      console.error('Error inesperado al actualizar estado de reserva:', err);
      toast.error('Error inesperado al actualizar estado de reserva');
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar reservas por fecha
  const getReservationsByDate = async (date: Date) => {
    await fetchReservations(date);
  };

  // Función para refrescar manualmente la lista de reservas
  const refreshReservations = async () => {
    await fetchReservations(currentDate);
  };

  return { 
    reservations, 
    loading, 
    error, 
    addReservation, 
    updateReservation, 
    deleteReservation, 
    updateReservationStatus,
    getReservationsByDate,
    refreshReservations
  };
} 