import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export type DateRange = 'today' | 'week' | 'month' | 'custom';

export type SalesData = {
  date: string;
  value: number;
}[];

export type VisitorData = {
  name: string;
  value: number;
}[];

export type MenuData = {
  name: string;
  sales: number;
}[];

export type ReportData = {
  salesData: SalesData;
  visitorData: VisitorData;
  menuData: MenuData;
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  mostSoldItem: { name: string; quantity: number } | null;
};

export const useReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date()
  });
  
  const [reportData, setReportData] = useState<ReportData>({
    salesData: [],
    visitorData: [],
    menuData: [],
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    mostSoldItem: null
  });

  // Obtener fechas según el rango seleccionado
  const getDateRangeValues = () => {
    const today = new Date();
    
    switch (dateRange) {
      case 'today':
        return {
          start: startOfDay(today),
          end: endOfDay(today)
        };
      case 'week':
        return {
          start: subDays(today, 7),
          end: today
        };
      case 'month':
        return {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
      case 'custom':
        return customDateRange;
    }
  };
  
  // Cargar datos de informes
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { start, end } = getDateRangeValues();
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      
      // 1. Obtener órdenes en el rango de fechas
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: true });
      
      if (ordersError) {
        throw new Error(`Error al obtener órdenes: ${ordersError.message}`);
      }
      
      // 2. Obtener detalles de las órdenes para estadísticas de menú
      const orderIds = orders ? orders.map(order => order.id) : [];
      
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, menu_items(name)')
        .in('order_id', orderIds.length > 0 ? orderIds : ['no-orders']);
      
      if (itemsError) {
        throw new Error(`Error al obtener detalles de pedidos: ${itemsError.message}`);
      }
      
      // Procesar datos de ventas por día
      const salesByDate: Record<string, number> = {};
      
      if (orders) {
        orders.forEach(order => {
          const date = format(new Date(order.created_at), 'yyyy-MM-dd');
          salesByDate[date] = (salesByDate[date] || 0) + (order.total || 0);
        });
      }
      
      const salesData: SalesData = Object.entries(salesByDate).map(([date, value]) => ({
        date,
        value
      }));
      
      // Procesar datos de visitantes por día de la semana
      const visitorsByDay: Record<string, number> = {
        'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0, 'Dom': 0
      };
      
      if (orders) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        orders.forEach(order => {
          const dayOfWeek = new Date(order.created_at).getDay();
          const dayName = dayNames[dayOfWeek];
          visitorsByDay[dayName] = (visitorsByDay[dayName] || 0) + 1;
        });
      }
      
      const visitorData: VisitorData = Object.entries(visitorsByDay)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
          return days.indexOf(a.name) - days.indexOf(b.name);
        });
      
      // Procesar datos de ventas por categoría de menú
      const menuSales: Record<string, number> = {};
      
      if (orderItems) {
        orderItems.forEach(item => {
          const itemName = item.menu_items?.name || 'Desconocido';
          menuSales[itemName] = (menuSales[itemName] || 0) + (item.quantity || 1);
        });
      }
      
      const menuData: MenuData = Object.entries(menuSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10); // Top 10
      
      // Calcular estadísticas generales
      const totalSales = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageTicket = totalOrders ? totalSales / totalOrders : 0;
      
      // Encontrar el ítem más vendido
      let mostSoldItem = null;
      if (Object.keys(menuSales).length > 0) {
        const [name, quantity] = Object.entries(menuSales)
          .sort(([, a], [, b]) => b - a)[0];
        
        mostSoldItem = { name, quantity };
      }
      
      // Actualizar estado con todos los datos procesados
      setReportData({
        salesData,
        visitorData,
        menuData,
        totalSales,
        totalOrders,
        averageTicket,
        mostSoldItem
      });
      
    } catch (err) {
      console.error('Error al cargar datos de informes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos cuando cambia el rango de fechas
  useEffect(() => {
    fetchReportData();
  }, [dateRange, customDateRange]);
  
  // Exportar datos a CSV
  const exportToCSV = () => {
    try {
      const { salesData, visitorData, menuData } = reportData;
      
      // Convertir datos de ventas a CSV
      let salesCSV = 'Fecha,Ventas\n';
      salesData.forEach(({ date, value }) => {
        salesCSV += `${date},${value}\n`;
      });
      
      // Convertir datos de visitantes a CSV
      let visitorCSV = 'Día,Visitantes\n';
      visitorData.forEach(({ name, value }) => {
        visitorCSV += `${name},${value}\n`;
      });
      
      // Convertir datos de menú a CSV
      let menuCSV = 'Producto,Ventas\n';
      menuData.forEach(({ name, sales }) => {
        menuCSV += `${name},${sales}\n`;
      });
      
      // Crear blob y descargar
      const blob = new Blob([salesCSV, '\n\n', visitorCSV, '\n\n', menuCSV], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      console.error('Error al exportar a CSV:', err);
      return false;
    }
  };
  
  return {
    loading,
    error,
    reportData,
    dateRange,
    setDateRange,
    customDateRange,
    setCustomDateRange,
    refreshData: fetchReportData,
    exportToCSV
  };
}; 