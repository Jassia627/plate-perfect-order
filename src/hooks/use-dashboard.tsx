import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTables } from './use-tables';
import { useAuth } from './use-auth';

// Tipos para las estadísticas del dashboard
export type WeeklySales = {
  name: string;
  total: number;
}[];

export type TopDish = {
  name: string;
  total: number;
}[];

export type HourlyCustomers = {
  hour: string;
  customers: number;
}[];

export type DashboardStats = {
  currentSales: number;
  customersToday: number;
  dailyTarget: number;
  tablesAvailable: number;
  tablesTotal: number;
  weeklySales: WeeklySales;
  topDishes: TopDish;
  hourlyCustomers: HourlyCustomers;
  percentageChange: {
    sales: number;
    customers: number;
    average: number;
  };
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useDashboard(): DashboardStats {
  const { tables } = useTables();
  const { user } = useAuth(); // Obtener el usuario autenticado
  const [loading, setLoading] = useState(true);
  const [currentSales, setCurrentSales] = useState(0);
  const [customersToday, setCustomersToday] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(3200);
  const [tablesAvailable, setTablesAvailable] = useState(0);
  const [tablesTotal, setTablesTotal] = useState(0);
  const [percentageChange, setPercentageChange] = useState({
    sales: 0,
    customers: 0,
    average: 0
  });

  // Datos para los gráficos
  const [weeklySales, setWeeklySales] = useState<WeeklySales>([
    { name: "Lun", total: 0 },
    { name: "Mar", total: 0 },
    { name: "Mié", total: 0 },
    { name: "Jue", total: 0 },
    { name: "Vie", total: 0 },
    { name: "Sáb", total: 0 },
    { name: "Dom", total: 0 },
  ]);

  const [topDishes, setTopDishes] = useState<TopDish>([]);
  const [hourlyCustomers, setHourlyCustomers] = useState<HourlyCustomers>([]);

  // Obtener datos de las mesas
  useEffect(() => {
    if (tables && tables.length > 0) {
      const availableTables = tables.filter(table => table.status === 'available').length;
      setTablesAvailable(availableTables);
      setTablesTotal(tables.length);
    }
  }, [tables]);

  // Obtener datos de ventas y clientes
  const fetchDashboardData = async () => {
    try {
      if (!user) {
        console.error('No hay usuario autenticado');
        setLoading(false);
        return;
      }
      
      setLoading(true);

      // Obtener ventas del día actual
      const todayStartDate = new Date();
      todayStartDate.setHours(0, 0, 0, 0);
      const todayISOString = todayStartDate.toISOString();

      // Obtener órdenes del día actual filtradas por el usuario autenticado
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id) // Filtrar por el usuario autenticado
        .gte('created_at', todayISOString);

      if (ordersError) {
        console.error('Error al obtener órdenes:', ordersError);
        return;
      }

      // Calcular ventas y clientes
      let totalSales = 0;
      if (todayOrders && todayOrders.length > 0) {
        totalSales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        setCurrentSales(totalSales);
        setCustomersToday(todayOrders.length);
      }

      // Obtener ventas de la semana
      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() - 6); // Últimos 7 días
      weekStartDate.setHours(0, 0, 0, 0);
      const weekISOString = weekStartDate.toISOString();

      const { data: weekOrders, error: weekOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id) // Filtrar por el usuario autenticado
        .gte('created_at', weekISOString);

      if (weekOrdersError) {
        console.error('Error al obtener órdenes de la semana:', weekOrdersError);
      } else if (weekOrders) {
        // Organizar ventas por día de la semana
        const salesByDay: { [key: string]: number } = {
          Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0
        };

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        weekOrders.forEach(order => {
          const orderDate = new Date(order.created_at);
          const dayName = dayNames[orderDate.getDay()];
          salesByDay[dayName] = (salesByDay[dayName] || 0) + (order.total || 0);
        });

        const formattedWeeklySales = Object.keys(salesByDay).map(day => ({
          name: day,
          total: salesByDay[day]
        }));

        // Reordenar los días de la semana
        const orderedDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const orderedWeeklySales = orderedDays.map(day => 
          formattedWeeklySales.find(sale => sale.name === day) || { name: day, total: 0 }
        );

        setWeeklySales(orderedWeeklySales);
      }

      // Obtener platos más vendidos
      // Primero obtenemos los IDs de las órdenes del usuario para filtrar los items
      const orderIds = weekOrders ? weekOrders.map(order => order.id) : [];
      
      // Si no hay órdenes, no hay items que buscar
      let orderItemsData = [];
      let itemsError = null;
      
      if (orderIds.length > 0) {
        const response = await supabase
          .from('order_items')
          .select('*, menu_items(name)')
          .in('order_id', orderIds) // Filtrar por las órdenes del usuario autenticado
          .gte('created_at', weekISOString);
          
        orderItemsData = response.data;
        itemsError = response.error;
      }

      if (itemsError) {
        console.error('Error al obtener productos vendidos:', itemsError);
      } else if (orderItemsData) {
        // Contar la cantidad de cada plato vendido
        const dishCounts: { [key: string]: number } = {};
        
        orderItemsData.forEach(item => {
          const dishName = item.menu_items?.name || 'Producto desconocido';
          dishCounts[dishName] = (dishCounts[dishName] || 0) + (item.quantity || 1);
        });

        // Ordenar por cantidad y tomar los 5 más vendidos
        const sortedDishes = Object.entries(dishCounts)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 5)
          .map(([name, total]) => ({ name, total }));

        setTopDishes(sortedDishes.length > 0 ? sortedDishes : [
          { name: "Sin datos", total: 0 }
        ]);
      }

      // Generar datos de clientes por hora basados en órdenes reales
      const hours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
      const hourlyData: { [key: string]: number } = {};
      
      // Inicializar todas las horas con 0 clientes
      hours.forEach(hour => {
        hourlyData[hour] = 0;
      });
      
      // Si hay datos de órdenes, contar clientes por hora
      if (weekOrders && weekOrders.length > 0) {
        weekOrders.forEach(order => {
          const orderDate = new Date(order.created_at);
          const orderHour = orderDate.getHours();
          const hourKey = `${orderHour}:00`;
          
          // Solo contar si la hora está en nuestro rango definido
          if (hours.includes(hourKey)) {
            hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
          }
        });
      }
      
      // Formatear los datos para el gráfico
      const realHourlyCustomers = hours.map(hour => ({
        hour,
        customers: hourlyData[hour] || 0
      }));

      setHourlyCustomers(realHourlyCustomers);

      // Calcular porcentajes de cambio basados en datos reales
      // Obtener datos de la semana anterior para comparar
      const twoWeeksAgoDate = new Date();
      twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 13); // 2 semanas atrás
      const oneWeekAgoDate = new Date();
      oneWeekAgoDate.setDate(oneWeekAgoDate.getDate() - 7); // 1 semana atrás
      
      const twoWeeksAgoISOString = twoWeeksAgoDate.toISOString();
      const oneWeekAgoISOString = oneWeekAgoDate.toISOString();
      
      // Obtener órdenes de la semana anterior
      const { data: previousWeekOrders, error: prevWeekError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id) // Filtrar por el usuario autenticado
        .gte('created_at', twoWeeksAgoISOString)
        .lt('created_at', oneWeekAgoISOString);
      
      if (prevWeekError) {
        console.error('Error al obtener órdenes de la semana anterior:', prevWeekError);
      }
      
      // Calcular ventas y clientes de la semana anterior
      let prevWeekSales = 0;
      let prevWeekCustomers = 0;
      
      if (previousWeekOrders && previousWeekOrders.length > 0) {
        prevWeekSales = previousWeekOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        prevWeekCustomers = previousWeekOrders.length;
      }
      
      // Calcular ventas y clientes de la semana actual
      let currentWeekSales = 0;
      let currentWeekCustomers = 0;
      
      if (weekOrders && weekOrders.length > 0) {
        currentWeekSales = weekOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        currentWeekCustomers = weekOrders.length;
      }
      
      // Calcular porcentajes de cambio
      let salesChange = 0;
      let customersChange = 0;
      let averageChange = 0;
      
      if (prevWeekSales > 0) {
        salesChange = Math.round(((currentWeekSales - prevWeekSales) / prevWeekSales) * 100);
      }
      
      if (prevWeekCustomers > 0) {
        customersChange = Math.round(((currentWeekCustomers - prevWeekCustomers) / prevWeekCustomers) * 100);
      }
      
      // Calcular cambio en el ticket promedio
      const prevAvgTicket = prevWeekCustomers > 0 ? prevWeekSales / prevWeekCustomers : 0;
      const currentAvgTicket = currentWeekCustomers > 0 ? currentWeekSales / currentWeekCustomers : 0;
      
      if (prevAvgTicket > 0) {
        averageChange = Math.round(((currentAvgTicket - prevAvgTicket) / prevAvgTicket) * 100);
      }
      
      const changeStats = {
        sales: salesChange,
        customers: customersChange,
        average: averageChange
      };
      
      setPercentageChange(changeStats);

      // Establecer objetivo diario (se podría obtener de la configuración)
      setDailyTarget(3500);

    } catch (error) {
      console.error('Error en el dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDashboardData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    currentSales,
    customersToday,
    dailyTarget,
    tablesAvailable,
    tablesTotal,
    weeklySales,
    topDishes,
    hourlyCustomers,
    percentageChange,
    loading,
    refresh: fetchDashboardData
  };
} 