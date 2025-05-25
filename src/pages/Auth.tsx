import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, User, Mail, Lock, Phone, MapPin, Globe, Store, CreditCard, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const Auth = () => {
  // Estados para login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  
  // Estados para registro y configuración del restaurante
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantRegion, setRestaurantRegion] = useState("MXN");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [registrationStep, setRegistrationStep] = useState(1); // Paso 1: Datos de usuario, Paso 2: Datos del restaurante
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(50); // Progreso del formulario (50% por paso)
  
  const { signIn, signUp, user, loading, error } = useAuth();
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState(false);

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    await signIn(email, password);
  };

  // Manejar el primer paso del registro (datos de usuario)
  const handleRegistrationStep1 = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    
    // Validar que todos los campos estén completos
    if (!email || !password || !passwordConfirm) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    
    // Validar que las contraseñas coincidan
    if (password !== passwordConfirm) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    
    // Validar que la contraseña tenga al menos 8 caracteres
    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    // Avanzar al paso 2: configuración del restaurante
    setRegistrationStep(2);
    setFormProgress(100); // Actualizar progreso a 100%
  };

  // Manejar el segundo paso del registro (datos del restaurante)
  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!restaurantName || !restaurantPhone || !restaurantAddress) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    
    try {
      setLocalLoading(true);
      
      // 1. Registrar al usuario con Supabase Auth
      const signUpResult = await signUp(email, password);
      
      if (signUpResult && signUpResult.user) {
        // 2. Guardar la configuración del restaurante
        const { error: settingsError } = await supabase
          .from('restaurant_settings')
          .insert([{
            user_id: signUpResult.user.id,
            name: restaurantName,
            phone: restaurantPhone,
            address: restaurantAddress,
            currency: restaurantRegion,
            whatsapp: whatsappNumber || restaurantPhone // Usar el teléfono como WhatsApp si no se especifica
          }]);
        
        if (settingsError) {
          console.error('Error al guardar configuración del restaurante:', settingsError);
          toast.error(`Error al guardar configuración: ${settingsError.message}`);
        } else {
          toast.success("Cuenta creada con éxito. Configuración del restaurante guardada.");
        }
      }
    } catch (err) {
      console.error('Error en el proceso de registro:', err);
      toast.error("Ocurrió un error durante el registro");
    } finally {
      setLocalLoading(false);
    }
  };

  // Volver al paso 1 del registro
  const handleBackToStep1 = () => {
    setRegistrationStep(1);
    setFormProgress(50); // Actualizar progreso a 50%
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-muted/60 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-2 bg-white rounded-full shadow-md mb-3">
            <Store className="h-10 w-10 text-restaurant-primary" />
          </div>
          <h2 className="text-3xl font-bold text-restaurant-dark dark:text-white">
            Plate<span className="text-restaurant-primary">Perfect</span>
          </h2>
          <p className="text-muted-foreground mt-2">Sistema de gestión de restaurantes</p>
        </div>
        
        <Tabs defaultValue="login" className="w-full" onValueChange={(value) => {
          // Resetear estados cuando cambia entre pestu00f1as
          setEmail('');
          setPassword('');
          setPasswordConfirm('');
          setPasswordError(null);
          setRegistrationStep(1);
          setFormProgress(50);
        }}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/80 p-1 shadow-md rounded-xl">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-restaurant-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Iniciar Sesión</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="data-[state=active]:bg-restaurant-primary data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>Registrarse</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="animate-fade-in-up">
            <Card className="border-0 shadow-xl rounded-xl overflow-hidden bg-white/95">
              <div className="bg-restaurant-primary h-2 w-full"></div>
              <CardHeader className="space-y-2 pt-6">
                <CardTitle className="text-2xl font-bold text-center text-restaurant-dark">
                  ¡Bienvenido de nuevo!
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Inicia sesión con tu cuenta para continuar
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-5 px-6">
                  {error && (
                    <Alert variant="destructive" className="border-0 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-restaurant-dark">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-restaurant-primary" />
                        <span>Email</span>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                        required
                      />
                      <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-restaurant-primary" />
                          <span>Contraseña</span>
                        </div>
                      </Label>
                      <Button variant="link" size="sm" className="px-0 h-auto text-xs text-restaurant-primary hover:text-restaurant-primary/80">
                        ¿Olvidaste la contraseña?
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                        required
                      />
                      <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6">
                  <Button 
                    className="w-full bg-restaurant-primary hover:bg-restaurant-primary/90 text-white font-medium py-5 rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2" 
                    type="submit" 
                    disabled={loading || localLoading}
                  >
                    {loading || localLoading ? (
                      <>Iniciando sesión...</>
                    ) : (
                      <>
                        Iniciar Sesión
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register" className="animate-fade-in-up">
            <Card className="border-0 shadow-xl rounded-xl overflow-hidden bg-white/95">
              <div className="bg-restaurant-primary h-2 w-full"></div>
              
              {/* Indicador de progreso */}
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {registrationStep === 1 ? "Paso 1 de 2" : "Paso 2 de 2"}
                  </span>
                  <span className="text-xs font-medium text-restaurant-primary">
                    {formProgress}% Completado
                  </span>
                </div>
                <Progress value={formProgress} className="h-1 bg-muted/50" indicatorClassName="bg-restaurant-primary" />
              </div>
              
              <CardHeader className="space-y-2 pt-4">
                <CardTitle className="text-2xl font-bold text-center text-restaurant-dark">
                  {registrationStep === 1 ? "Crear cuenta de administrador" : "Configuración del restaurante"}
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  {registrationStep === 1 
                    ? "Regístrate como administrador para gestionar PlatePerfect" 
                    : "Configura los datos de tu restaurante"}
                </CardDescription>
              </CardHeader>
              
              {registrationStep === 1 ? (
                // Paso 1: Datos de usuario
                <form onSubmit={handleRegistrationStep1}>
                  <CardContent className="space-y-5 px-6">
                    {error && (
                      <Alert variant="destructive" className="border-0 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-restaurant-primary" />
                          <span>Email de administrador</span>
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                          required
                        />
                        <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Usarás este email para iniciar sesión como administrador
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-restaurant-primary" />
                          <span>Contraseña</span>
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                          required
                        />
                        <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password-confirm" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-restaurant-primary" />
                          <span>Confirmar contraseña</span>
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password-confirm"
                          type="password"
                          placeholder="Confirma tu contraseña"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                          required
                        />
                        <CheckCircle className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                      {passwordError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {passwordError}
                        </p>
                      )}
                    </div>
                    
                    <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 mt-2">
                      <p className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>
                          Esta cuenta tendrá acceso completo como administrador del restaurante
                        </span>
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="px-6 pb-6">
                    <Button 
                      className="w-full bg-restaurant-primary hover:bg-restaurant-primary/90 text-white font-medium py-5 rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2" 
                      type="submit" 
                      disabled={loading || localLoading}
                    >
                      Continuar a configuración
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </form>
                ) : (
                // Paso 2: Configuración del restaurante
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-5 px-6">
                    {error && (
                      <Alert variant="destructive" className="border-0 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-name" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-restaurant-primary" />
                          <span>Nombre del restaurante</span>
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          id="restaurant-name"
                          type="text"
                          placeholder="Mi Restaurante"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                          required
                        />
                        <Store className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Este nombre aparecerá en los recibos y facturas
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="restaurant-phone" className="text-sm font-medium text-restaurant-dark">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-restaurant-primary" />
                            <span>Teléfono</span>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="restaurant-phone"
                            type="tel"
                            placeholder="123 456 7890"
                            value={restaurantPhone}
                            onChange={(e) => setRestaurantPhone(e.target.value)}
                            className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                            required
                          />
                          <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-number" className="text-sm font-medium text-restaurant-dark">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-restaurant-primary" />
                            <span>WhatsApp (opcional)</span>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="whatsapp-number"
                            type="tel"
                            placeholder="123 456 7890"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                          />
                          <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-address" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-restaurant-primary" />
                          <span>Dirección</span>
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          id="restaurant-address"
                          type="text"
                          placeholder="Calle Principal 123, Ciudad"
                          value={restaurantAddress}
                          onChange={(e) => setRestaurantAddress(e.target.value)}
                          className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md"
                          required
                        />
                        <MapPin className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-region" className="text-sm font-medium text-restaurant-dark">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-restaurant-primary" />
                          <span>Moneda</span>
                        </div>
                      </Label>
                      <div className="relative">
                        <Select 
                          value={restaurantRegion} 
                          onValueChange={setRestaurantRegion}
                        >
                          <SelectTrigger className="pl-10 border-muted focus:border-restaurant-primary focus:ring-restaurant-primary/20 transition-all duration-300 rounded-md">
                            <SelectValue placeholder="Selecciona una moneda" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 border-muted shadow-md">
                            <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                            <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                            <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Globe className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Esta moneda se usará para mostrar los precios en el sistema
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 mt-2">
                      <p className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>
                          Podrás modificar estos datos más adelante desde la configuración del restaurante
                        </span>
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col gap-3 px-6 pb-6">
                    <Button 
                      className="w-full bg-restaurant-primary hover:bg-restaurant-primary/90 text-white font-medium py-5 rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2" 
                      type="submit" 
                      disabled={loading || localLoading}
                    >
                      {loading || localLoading ? (
                        <>Registrando restaurante...</>
                      ) : (
                        <>
                          Completar registro
                          <CheckCircle className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      type="button" 
                      className="w-full border-muted hover:bg-muted/10 transition-all duration-300 flex items-center justify-center gap-2" 
                      onClick={handleBackToStep1}
                      disabled={loading || localLoading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Volver a datos de usuario
                    </Button>
                  </CardFooter>
                </form>
              )}
              
              <div className="px-6 pb-4 text-xs text-muted-foreground text-center">
                Como administrador, podrás crear cuentas para el resto del personal desde la sección "Personal"
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
