import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTables } from './use-tables';

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
      setLoading(true);

      // Obtener ventas del día actual
      const todayStartDate = new Date();
      todayStartDate.setHours(0, 0, 0, 0);
      const todayISOString = todayStartDate.toISOString();

      // Obtener órdenes del día actual
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
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
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, menu_items(name)')
        .gte('created_at', weekISOString);

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

      // Generar datos de clientes por hora (simulado por ahora)
      const hours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
      const simulatedCustomers = hours.map(hour => {
        // Distribución realista: más clientes durante horas pico
        let baseCustomers = 15;
        const hourNum = parseInt(hour.split(':')[0]);
        
        if (hourNum >= 13 && hourNum <= 15) { // Almuerzo
          baseCustomers = 30;
        } else if (hourNum >= 19 && hourNum <= 21) { // Cena
          baseCustomers = 40;
        }
        
        // Añadir algo de aleatoriedad
        const customers = Math.floor(baseCustomers + (Math.random() * 10) - 5);
        
        return {
          hour,
          customers: Math.max(0, customers)
        };
      });

      setHourlyCustomers(simulatedCustomers);

      // Calcular porcentajes de cambio (simulado por ahora)
      const changeStats = {
        sales: Math.floor(Math.random() * 20) - 5, // Entre -5% y +15%
        customers: Math.floor(Math.random() * 25) - 5, // Entre -5% y +20%
        average: Math.floor(Math.random() * 10) - 2, // Entre -2% y +8%
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