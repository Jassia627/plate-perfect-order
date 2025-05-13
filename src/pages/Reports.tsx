import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as RechartsPrimitive from "recharts";
import { 
  AreaChart, 
  BarChart,
  LineChart, 
  ChartContainer 
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar, RefreshCw, TrendingUp, Users, DollarSign, Utensils } from "lucide-react";
import { useReports, DateRange } from "@/hooks/use-reports";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { toast } from "sonner";

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const { 
    loading, 
    error, 
    reportData, 
    dateRange, 
    setDateRange, 
    customDateRange, 
    setCustomDateRange, 
    refreshData, 
    exportToCSV 
  } = useReports();
  
  const { 
    salesData, 
    visitorData, 
    menuData, 
    totalSales, 
    totalOrders, 
    averageTicket, 
    mostSoldItem 
  } = reportData;
  
  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  // Obtener texto para el selector de fechas
  const getDateRangeText = () => {
    switch (dateRange) {
      case 'today':
        return 'Hoy';
      case 'week':
        return 'Últimos 7 días';
      case 'month':
        return 'Este mes';
      case 'custom':
        return `${format(customDateRange.start, 'dd/MM/yyyy')} - ${format(customDateRange.end, 'dd/MM/yyyy')}`;
    }
  };
  
  // Manejar exportación a CSV
  const handleExport = () => {
    if (exportToCSV()) {
      toast.success('Informe exportado correctamente');
    } else {
      toast.error('Error al exportar el informe');
    }
  };
  
  // Manejar cambio de rango de fechas
  const handleDateRangeChange = (value: DateRange) => {
    setDateRange(value);
    toast.success(`Visualizando datos para: ${value === 'today' ? 'Hoy' : value === 'week' ? 'Últimos 7 días' : value === 'month' ? 'Este mes' : 'Rango personalizado'}`);
  };

  return (
    <MainLayout 
      title="Informes" 
      subtitle="Analiza el rendimiento del restaurante"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshData()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p>Error al cargar los datos: {error}</p>
          </div>
        )}
        
        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">{formatCurrency(totalSales)}</h3>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Órdenes</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">{totalOrders}</h3>
                  )}
                </div>
                <Utensils className="h-8 w-8 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">{formatCurrency(averageTicket)}</h3>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="visitors">Visitantes</TabsTrigger>
              <TabsTrigger value="menu">Menú</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <Select 
              value={dateRange} 
              onValueChange={(value) => handleDateRangeChange(value as DateRange)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecciona periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Últimos 7 días</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {dateRange === 'custom' && (
              <div className="w-full md:w-auto">
                <DatePickerWithRange 
                  date={{
                    from: customDateRange.start,
                    to: customDateRange.end
                  }}
                  onDateChange={(range) => {
                    if (range?.from && range?.to) {
                      setCustomDateRange({
                        start: range.from,
                        end: range.to
                      });
                    }
                  }}
                />
              </div>
            )}
            
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <FileDown size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Ventas diarias</CardTitle>
                    <CardDescription>
                      {getDateRangeText()}
                    </CardDescription>
                  </div>
                  {mostSoldItem && (
                    <div className="bg-muted p-2 rounded-md text-sm">
                      <span className="font-medium">Producto más vendido:</span> {mostSoldItem.name} ({mostSoldItem.quantity} unidades)
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-4/5 w-full rounded-md" />
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de ventas para el período seleccionado</p>
                  </div>
                ) : (
                  <ChartContainer>
                    <AreaChart>
                      <RechartsPrimitive.XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return format(date, 'dd/MM');
                        }} 
                      />
                      <RechartsPrimitive.YAxis 
                        tickFormatter={(value) => `€${value}`}
                      />
                      <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                      <RechartsPrimitive.Tooltip 
                        formatter={(value) => [`€${value.toLocaleString()}`, 'Ventas']}
                        labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                      />
                      <RechartsPrimitive.Area 
                        type="monotone" 
                        dataKey="value" 
                        data={salesData} 
                        stroke="#FF9A01" 
                        fill="#FF9A01" 
                        fillOpacity={0.3} 
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="visitors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitantes por día de la semana</CardTitle>
                <CardDescription>
                  {getDateRangeText()}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-4/5 w-full rounded-md" />
                  </div>
                ) : visitorData.every(item => item.value === 0) ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de visitantes para el período seleccionado</p>
                  </div>
                ) : (
                  <ChartContainer>
                    <BarChart>
                      <RechartsPrimitive.XAxis dataKey="name" />
                      <RechartsPrimitive.YAxis />
                      <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                      <RechartsPrimitive.Tooltip formatter={(value) => [`${value} órdenes`, 'Visitantes']} />
                      <RechartsPrimitive.Bar 
                        dataKey="value" 
                        data={visitorData} 
                        fill="#4F46E5" 
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="menu" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top productos vendidos</CardTitle>
                <CardDescription>
                  {getDateRangeText()}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-4/5 w-full rounded-md" />
                  </div>
                ) : menuData.length === 0 ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de productos para el período seleccionado</p>
                  </div>
                ) : (
                  <ChartContainer>
                    <LineChart>
                      <RechartsPrimitive.XAxis dataKey="name" />
                      <RechartsPrimitive.YAxis />
                      <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                      <RechartsPrimitive.Tooltip formatter={(value) => [`${value} unidades`, 'Ventas']} />
                      <RechartsPrimitive.Line 
                        type="monotone" 
                        dataKey="sales" 
                        data={menuData} 
                        stroke="#10B981" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Reports;
