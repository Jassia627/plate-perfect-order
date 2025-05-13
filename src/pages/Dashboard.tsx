import { useEffect, useState, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart, LineChart } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { ArrowTrendingUpIcon, CreditCardIcon, CurrencyDollarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useDashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

const Dashboard = () => {
  const { 
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
    refresh
  } = useDashboard();

  const [today] = useState(() => {
    const date = new Date();
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Referencias para los contenedores de gráficos
  const weeklyChartRef = useRef<HTMLDivElement>(null);
  const dishesChartRef = useRef<HTMLDivElement>(null);
  const hourlyChartRef = useRef<HTMLDivElement>(null);
  
  // Estados para almacenar las dimensiones de los gráficos
  const [chartDimensions, setChartDimensions] = useState({
    weekly: { width: 500, height: 300 },
    dishes: { width: 500, height: 300 },
    hourly: { width: 500, height: 300 }
  });
  
  // Actualizar las dimensiones de los gráficos
  const updateChartDimensions = () => {
    setIsMobile(window.innerWidth < 768);
    
    if (weeklyChartRef.current) {
      setChartDimensions(prev => ({
        ...prev,
        weekly: {
          width: weeklyChartRef.current!.clientWidth,
          height: Math.min(250, weeklyChartRef.current!.clientWidth * 0.5)
        }
      }));
    }
    
    if (dishesChartRef.current) {
      setChartDimensions(prev => ({
        ...prev,
        dishes: {
          width: dishesChartRef.current!.clientWidth,
          height: Math.min(250, dishesChartRef.current!.clientWidth * 0.6)
        }
      }));
    }
    
    if (hourlyChartRef.current) {
      setChartDimensions(prev => ({
        ...prev,
        hourly: {
          width: hourlyChartRef.current!.clientWidth,
          height: Math.min(250, hourlyChartRef.current!.clientWidth * 0.4)
        }
      }));
    }
  };
  
  // Actualizar dimensiones al cargar y al cambiar tamaño de pantalla
  useEffect(() => {
    updateChartDimensions();
    window.addEventListener('resize', updateChartDimensions);
    
    return () => {
      window.removeEventListener('resize', updateChartDimensions);
    };
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      // Actualizar dimensiones de gráficos después de refrescar
      updateChartDimensions();
    }, 500);
  };

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={`Información general - ${today}`}
      actions={
        <Button 
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Actualizar</span>
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 md:p-6">
                <Skeleton className="h-6 md:h-8 w-20 md:w-28 mb-2" />
                <Skeleton className="h-8 md:h-10 w-24 md:w-32 mb-2" />
                <Skeleton className="h-3 md:h-4 w-16 md:w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ventas hoy"
            value={`$${currentSales.toLocaleString()}`}
            icon={<CurrencyDollarIcon className="h-4 w-4" />}
            change={`${Math.floor((currentSales / dailyTarget) * 100)}%`}
            description="del objetivo diario"
            changeType={currentSales >= dailyTarget ? "positive" : "neutral"}
          />
          <StatCard
            title="Clientes hoy"
            value={customersToday}
            icon={<UsersIcon className="h-4 w-4" />}
            change={`${percentageChange.customers > 0 ? '+' : ''}${percentageChange.customers}%`}
            changeType={percentageChange.customers >= 0 ? "positive" : "negative"}
            description="vs. semana pasada"
          />
          <StatCard
            title="Ticket promedio"
            value={`$${(customersToday ? (currentSales / customersToday) : 0).toFixed(2)}`}
            icon={<CreditCardIcon className="h-4 w-4" />}
            change={`${percentageChange.average > 0 ? '+' : ''}${percentageChange.average}%`}
            changeType={percentageChange.average >= 0 ? "positive" : "negative"}
            description="vs. semana pasada"
          />
          <StatCard
            title="Mesas disponibles"
            value={`${tablesAvailable} / ${tablesTotal}`}
            icon={<ArrowTrendingUpIcon className="h-4 w-4" />}
            change={`${tablesTotal ? Math.floor((tablesAvailable / tablesTotal) * 100) : 0}%`}
            description="de capacidad"
            changeType={tablesAvailable > tablesTotal * 0.3 ? "positive" : "negative"}
          />
        </div>
      )}

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-7 mt-3 md:mt-4">
        <Card className="col-span-1 md:col-span-7 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-0 md:pb-0">
            <CardTitle className="text-base md:text-lg">Ventas Semanales</CardTitle>
            {loading && <Skeleton className="h-4 w-24" />}
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="w-full aspect-[2/1] flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-md" />
              </div>
            ) : (
              <div className="w-full" ref={weeklyChartRef}>
                <AreaChart
                  data={weeklySales}
                  width={chartDimensions.weekly.width}
                  height={chartDimensions.weekly.height}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 0 : 0, 
                    bottom: 0 
                  }}
                >
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                  <RechartsPrimitive.XAxis 
                    dataKey="name" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={isMobile ? (value) => value.substring(0, 3) : undefined}
                  />
                  <RechartsPrimitive.YAxis 
                    width={isMobile ? 35 : 40}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <RechartsPrimitive.Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Ventas']} />
                  <RechartsPrimitive.Area type="monotone" dataKey="total" stroke="#E07A5F" fill="#E07A5F" fillOpacity={0.3} />
                </AreaChart>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-7 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-0 md:pb-0">
            <CardTitle className="text-base md:text-lg">Platos más vendidos</CardTitle>
            {loading && <Skeleton className="h-4 w-24" />}
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="w-full aspect-[3/2] flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-md" />
              </div>
            ) : (
              <div className="w-full" ref={dishesChartRef}>
                <BarChart
                  data={topDishes}
                  width={chartDimensions.dishes.width}
                  height={chartDimensions.dishes.height}
                  margin={{ 
                    top: 5, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 0 : 20, 
                    bottom: 5 
                  }}
                >
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                  <RechartsPrimitive.XAxis 
                    dataKey="name" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={isMobile ? (value) => value.length > 8 ? `${value.substring(0, 7)}...` : value : undefined}
                  />
                  <RechartsPrimitive.YAxis 
                    width={isMobile ? 30 : 40}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <RechartsPrimitive.Tooltip formatter={(value: any) => [`${value} unidades`, 'Ventas']} />
                  <RechartsPrimitive.Bar dataKey="total" fill="#81B29A" />
                </BarChart>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 md:mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-0 md:pb-0">
            <CardTitle className="text-base md:text-lg">Afluencia de clientes por hora</CardTitle>
            {loading && <Skeleton className="h-4 w-24" />}
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="w-full aspect-[2/1] flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-md" />
              </div>
            ) : (
              <div className="w-full" ref={hourlyChartRef}>
                <LineChart
                  data={hourlyCustomers}
                  width={chartDimensions.hourly.width}
                  height={chartDimensions.hourly.height}
                  margin={{ 
                    top: 5, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 0 : 20, 
                    bottom: 5 
                  }}
                >
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                  <RechartsPrimitive.XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={isMobile ? (value) => value.includes(':') ? value.split(':')[0] : value : undefined}
                  />
                  <RechartsPrimitive.YAxis 
                    width={isMobile ? 30 : 40}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <RechartsPrimitive.Tooltip formatter={(value: any) => [`${value} clientes`, 'Clientes']} />
                  <RechartsPrimitive.Line type="monotone" dataKey="customers" stroke="#3D405B" strokeWidth={2} />
                </LineChart>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
