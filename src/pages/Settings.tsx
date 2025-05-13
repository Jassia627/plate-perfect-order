import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Building, User, CreditCard, Bell, Loader2, Phone, PhoneCall } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import CurrencySelector from "@/components/ui/currency-selector";
import CountryPrefixSelector from "@/components/ui/country-prefix-selector";
import CountryPrefixesInfo from "@/components/ui/country-prefixes-info";
import DatabaseErrorHandler from "@/components/database/DatabaseErrorHandler";

// Interfaces para los formularios
interface RestaurantFormValues {
  name: string;
  phone: string;
  address: string;
  description: string;
  darkMode: boolean;
  autoPrint: boolean;
  currency: string;
  whatsapp?: string; // Número de WhatsApp del restaurante
  logo_url?: string; // URL del logo del restaurante
}

interface UserFormValues {
  fullName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface BillingFormValues {
  companyName: string;
  taxId: string;
  billingEmail: string;
  billingAddress: string;
}

interface NotificationFormValues {
  newOrders: boolean;
  reservations: boolean;
  weeklyReports: boolean;
  inventoryAlerts: boolean;
  notificationEmail: string;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { user } = useAuth();
  
  // Usar el hook useSettings para cada tipo de configuración
  const { 
    data: restaurantData, 
    loading: restaurantLoading,
    updateSettings: updateRestaurantSettings
  } = useSettings<RestaurantFormValues>("restaurantSettings", {
    name: "PlatePerfect",
    phone: "912 345 678",
    address: "Calle Principal 123, 28001 Madrid",
    description: "Restaurante de comida mediterránea",
    darkMode: false,
    autoPrint: false,
    currency: "EUR",
    whatsapp: "+34612345678",
    logo_url: ""
  });

  const { 
    data: userData, 
    loading: userLoading,
    updateSettings: updateUserSettings
  } = useSettings<UserFormValues>("userSettings", {
    fullName: "Admin Usuario",
    email: user?.email || "admin@plateperfect.com"
  });

  const { 
    data: billingData, 
    loading: billingLoading,
    updateSettings: updateBillingSettings,
    resetBillingSettings
  } = useSettings<BillingFormValues>("billingSettings", {
    companyName: "PlatePerfect Inc.",
    taxId: "B12345678",
    billingEmail: "billing@plateperfect.com",
    billingAddress: "Calle Principal 123, 28001 Madrid"
  });

  const { 
    data: notificationData, 
    loading: notificationLoading,
    updateSettings: updateNotificationSettings
  } = useSettings<NotificationFormValues>("notificationSettings", {
    newOrders: true,
    reservations: true,
    weeklyReports: false,
    inventoryAlerts: true,
    notificationEmail: user?.email || "admin@plateperfect.com"
  });

  // Inicializar formularios con datos de Supabase
  const restaurantForm = useForm<RestaurantFormValues>({
    defaultValues: restaurantData
  });

  const userForm = useForm<UserFormValues>({
    defaultValues: {
      ...userData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const billingForm = useForm<BillingFormValues>({
    defaultValues: billingData
  });

  const notificationForm = useForm<NotificationFormValues>({
    defaultValues: notificationData
  });

  // Actualizar formularios cuando cambian los datos
  useEffect(() => {
    if (!restaurantLoading) {
      restaurantForm.reset(restaurantData);
    }
    if (!userLoading) {
      userForm.reset({
        ...userData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
    if (!billingLoading) {
      billingForm.reset(billingData);
    }
    if (!notificationLoading) {
      notificationForm.reset(notificationData);
    }
  }, [restaurantData, userData, billingData, notificationData, restaurantLoading, userLoading, billingLoading, notificationLoading]);

  // Manejadores de envío para cada formulario
  const handleRestaurantSubmit = async (data: RestaurantFormValues) => {
    // Enviar todos los valores del formulario
    console.log("Guardando configuración del restaurante:", data);
    await updateRestaurantSettings(data);
  };

  const handleUserSubmit = async (data: UserFormValues) => {
    // Validación de contraseña
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      // No enviar contraseñas a Supabase
      const { currentPassword, newPassword, confirmPassword, ...userDataToUpdate } = data;
      
      // Enviar todos los valores del perfil a Supabase
      console.log("Guardando configuración del usuario:", userDataToUpdate);
      await updateUserSettings(userDataToUpdate);
      
      // Aquí se podría implementar el cambio de contraseña si se necesita
      // Pero no se enviará a la tabla user_settings
      if (newPassword && currentPassword) {
        // Aquí podríamos implementar el cambio de contraseña usando la API de autenticación de Supabase
        // Por ahora solo mostraremos un mensaje
        toast.info("La funcionalidad de cambio de contraseña no está implementada aún");
      }
      
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      toast.error("Error al actualizar el perfil");
    }
  };

  const handleBillingSubmit = async (data: BillingFormValues) => {
    // Enviar todos los valores del formulario
    console.log("Guardando configuración de facturación:", data);
    await updateBillingSettings(data);
  };

  const handleNotificationSubmit = async (data: NotificationFormValues) => {
    // Enviar todos los valores del formulario
    console.log("Guardando configuración de notificaciones:", data);
    await updateNotificationSettings(data);
  };

  // Renderizar carga cuando los datos se están obteniendo
  const renderLoading = () => (
    <div className="flex items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Cargando configuraciones...</span>
    </div>
  );

  return (
    <MainLayout title="Configuración" subtitle="Gestiona la configuración del sistema">
      <div className="space-y-6">
        <DatabaseErrorHandler />
        <Tabs defaultValue="general" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="billing">Facturación</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="phonePrefix" className="flex items-center gap-1">
              <PhoneCall className="h-4 w-4" />
              <span>Prefijos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            {restaurantLoading ? renderLoading() : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="mr-2" size={18} />
                    Información del Restaurante
                  </CardTitle>
                  <CardDescription>
                    Modifica la información básica de tu restaurante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={restaurantForm.handleSubmit(handleRestaurantSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="restaurant-name">Nombre del restaurante</Label>
                        <Input 
                          id="restaurant-name" 
                          {...restaurantForm.register("name")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restaurant-phone">Teléfono</Label>
                        <Input 
                          id="restaurant-phone" 
                          {...restaurantForm.register("phone")}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-address">Dirección</Label>
                      <Input 
                        id="restaurant-address" 
                        {...restaurantForm.register("address")}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-desc">Descripción</Label>
                      <Input 
                        id="restaurant-desc" 
                        {...restaurantForm.register("description")}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Modo oscuro</h4>
                          <p className="text-sm text-muted-foreground">Activa el modo oscuro para la aplicación</p>
                        </div>
                        <Switch 
                          checked={restaurantForm.watch("darkMode")}
                          onCheckedChange={(value) => restaurantForm.setValue("darkMode", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Impresión automática</h4>
                          <p className="text-sm text-muted-foreground">Imprime automáticamente los nuevos pedidos</p>
                        </div>
                        <Switch 
                          checked={restaurantForm.watch("autoPrint")}
                          onCheckedChange={(value) => restaurantForm.setValue("autoPrint", value)}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-currency">Moneda</Label>
                      <CurrencySelector
                        value={restaurantForm.watch("currency")}
                        onValueChange={(value) => restaurantForm.setValue("currency", value)}
                      />
                      <p className="text-sm text-muted-foreground">Selecciona la moneda que usará tu restaurante</p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <CountryPrefixSelector
                        value={restaurantForm.watch("whatsapp") || ""}
                        onValueChange={(value) => restaurantForm.setValue("whatsapp", value)}
                        currencyCode={restaurantForm.watch("currency")}
                        label="WhatsApp del restaurante"
                        placeholder="Número sin prefijo"
                      />
                      <p className="text-xs text-blue-600 hover:underline cursor-pointer" 
                         onClick={() => setActiveTab("phonePrefix")}>
                        Ver lista completa de prefijos telefónicos por país
                      </p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="restaurant-logo">Logo URL (opcional)</Label>
                      <Input 
                        id="restaurant-logo" 
                        {...restaurantForm.register("logo_url")}
                        placeholder="https://ejemplo.com/logo.png"
                      />
                      <p className="text-xs text-muted-foreground">URL de la imagen de tu logo para mostrar en el menú público</p>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button type="submit">
                        <Save size={16} className="mr-2" />
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="profile">
            {userLoading ? renderLoading() : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2" size={18} />
                    Perfil de Usuario
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-name">Nombre completo</Label>
                        <Input 
                          id="user-name" 
                          {...userForm.register("fullName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-email">Correo electrónico</Label>
                        <Input 
                          id="user-email" 
                          {...userForm.register("email")}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Contraseña actual</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        {...userForm.register("currentPassword")}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva contraseña</Label>
                        <Input 
                          id="new-password" 
                          type="password"
                          {...userForm.register("newPassword")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                          {...userForm.register("confirmPassword")}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button type="submit">
                        <Save size={16} className="mr-2" />
                        Actualizar perfil
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="billing">
            {billingLoading ? renderLoading() : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2" size={18} />
                    Información de Facturación
                  </CardTitle>
                  <CardDescription>
                    Gestiona tu facturación y métodos de pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={billingForm.handleSubmit(handleBillingSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nombre de la empresa</Label>
                      <Input 
                        id="company-name" 
                        {...billingForm.register("companyName")}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax-id">CIF/NIF</Label>
                        <Input 
                          id="tax-id" 
                          {...billingForm.register("taxId")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-email">Correo de facturación</Label>
                        <Input 
                          id="company-email" 
                          {...billingForm.register("billingEmail")}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="billing-address">Dirección de facturación</Label>
                      <Input 
                        id="billing-address" 
                        {...billingForm.register("billingAddress")}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Plan actual</h4>
                        <p className="text-sm text-muted-foreground">Estás en el plan Profesional</p>
                      </div>
                      <Button variant="outline">Cambiar plan</Button>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mr-2" 
                        onClick={resetBillingSettings}
                      >
                        Restablecer Datos
                      </Button>
                      <Button type="submit">
                        <Save size={16} className="mr-2" />
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="notifications">
            {notificationLoading ? renderLoading() : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2" size={18} />
                    Preferencias de Notificación
                  </CardTitle>
                  <CardDescription>
                    Configura cómo y cuándo recibes notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Nuevos pedidos</h4>
                          <p className="text-sm text-muted-foreground">Recibe notificaciones cuando llegue un nuevo pedido</p>
                        </div>
                        <Switch 
                          checked={notificationForm.watch("newOrders")}
                          onCheckedChange={(value) => notificationForm.setValue("newOrders", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Reservas</h4>
                          <p className="text-sm text-muted-foreground">Recibe notificaciones para nuevas reservas</p>
                        </div>
                        <Switch 
                          checked={notificationForm.watch("reservations")}
                          onCheckedChange={(value) => notificationForm.setValue("reservations", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Informes semanales</h4>
                          <p className="text-sm text-muted-foreground">Recibe un informe resumido cada semana</p>
                        </div>
                        <Switch 
                          checked={notificationForm.watch("weeklyReports")}
                          onCheckedChange={(value) => notificationForm.setValue("weeklyReports", value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Alertas de inventario</h4>
                          <p className="text-sm text-muted-foreground">Recibe alertas cuando el inventario esté bajo</p>
                        </div>
                        <Switch 
                          checked={notificationForm.watch("inventoryAlerts")}
                          onCheckedChange={(value) => notificationForm.setValue("inventoryAlerts", value)}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <Label htmlFor="notification-email">Correo para notificaciones</Label>
                      <Input 
                        id="notification-email" 
                        {...notificationForm.register("notificationEmail")}
                      />
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button type="submit">
                        <Save size={16} className="mr-2" />
                        Guardar preferencias
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="phonePrefix">
            <CountryPrefixesInfo />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
