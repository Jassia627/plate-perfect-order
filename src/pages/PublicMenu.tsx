import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePublicMenu } from "@/hooks/use-public-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImagePlus, MenuIcon, Search, Coffee, UtensilsCrossed, ChevronLeft, MapPin, Phone, Info, ShoppingBag, X, Clock, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CartProvider, useCart } from "@/components/cart/CartContext";
import CartButton from "@/components/cart/CartButton";
import CartDrawer from "@/components/cart/CartDrawer";
import PublicMenuItem from "@/components/menu/PublicMenuItem";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const PublicMenuContent = () => {
  const { adminId } = useParams<{ adminId: string }>();
  const { menuItems, menuCategories, restaurantInfo, loading, error, loadMenuByAdminId } = usePublicMenu();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [showRestaurantInfo, setShowRestaurantInfo] = useState(false);
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();

  // Verificar si estamos en la ruta correcta
  useEffect(() => {
    const checkPath = async () => {
      // Si estamos navegando a /menu sin ID, redirigir al dashboard
      if (window.location.pathname === "/menu" && !adminId) {
        // Verificar si el usuario está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/dashboard");
        }
      }
    };
    
    checkPath();
  }, [navigate, adminId]);

  // Cargar los datos del menú cuando se recibe el adminId
  useEffect(() => {
    if (adminId) {
      loadMenuByAdminId(adminId);
    }
  }, [adminId, loadMenuByAdminId]);

  // Efecto para establecer la primera categoría como seleccionada cuando se cargan las categorías
  useEffect(() => {
    if (menuCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(menuCategories[0].id);
    }
  }, [menuCategories, selectedCategory]);

  // Filtrar menú por búsqueda
  const filteredMenuItems = searchQuery
    ? menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  // Función para añadir al carrito
  const addToCart = () => {
    if (selectedItem) {
      addItem(selectedItem, quantity, orderNotes);
      setSelectedItem(null);
      setQuantity(1);
      setOrderNotes("");
      toast.success("Producto añadido al carrito");
    }
  };

  // Abrir detalles del producto
  const openItemDetails = (item: any) => {
    setSelectedItem(item);
    setQuantity(1);
    setOrderNotes("");
  };

  // Incrementar cantidad
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  
  // Decrementar cantidad
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  // Salir si no hay adminId
  if (!adminId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex items-center justify-center h-full flex-1">
          <div className="text-center p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Menú no encontrado</h1>
            <p className="text-gray-600">
              Este enlace no es válido o ha expirado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header con logo y búsqueda */}
      <header className="sticky top-0 z-40 bg-white shadow-sm px-4 py-3 border-b">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden"
                >
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Categorías</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-65px)]">
                  <div className="p-2">
                    <nav className="space-y-1 mb-6">
                      {menuCategories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-md flex items-center space-x-3
                            ${selectedCategory === category.id 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'hover:bg-muted'
                            }`}
                        >
                          <UtensilsCrossed className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{category.name}</span>
                        </button>
                      ))}
                    </nav>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-1">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start pl-3 font-normal"
                        onClick={() => {
                          setShowRestaurantInfo(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Info className="mr-3 h-5 w-5" />
                        Información del restaurante
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <div onClick={() => window.location.reload()} className="cursor-pointer">
              {restaurantInfo?.logo_url ? (
                <img 
                  src={restaurantInfo.logo_url} 
                  alt={restaurantInfo.name} 
                  className="h-8 object-contain"
                />
              ) : (
                <h1 className="text-xl font-semibold text-restaurant-dark">
                  {restaurantInfo?.name || "Plate"}<span className="text-restaurant-primary">Perfect</span>
                </h1>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowRestaurantInfo(true)}
              className="hidden md:flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <Info className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Info</span>
            </button>
            
            <div className="hidden md:flex relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-40 sm:w-64 pl-8 rounded-full bg-muted h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </header>

      {/* Mobile search (visible only on mobile) */}
      <div className="md:hidden px-4 py-2 bg-white border-b sticky top-16 z-30">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar en el menú..."
            className="w-full pl-8 rounded-full bg-muted h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categorías en formato de pestañas horizontales en móvil */}
      <div className="md:hidden sticky top-[108px] bg-white z-20 border-b">
        <ScrollArea orientation="horizontal" className="w-screen">
          <div className="flex p-2 space-x-1">
            {menuCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="whitespace-nowrap py-1 px-3 h-8 text-xs"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content with desktop sidebar */}
      <div className="flex flex-1 relative">
        {/* Categories sidebar (desktop only) */}
        <aside className="hidden md:block bg-white w-64 border-r p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-auto">
          <div className="mb-3">
            <h2 className="font-semibold text-restaurant-dark mb-2">Categorías</h2>
            <nav className="space-y-1">
              {menuCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3
                    ${selectedCategory === category.id 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-muted'
                    }`}
                >
                  <UtensilsCrossed className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{category.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <div className="container mx-auto max-w-4xl">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                {error}
              </div>
            ) : menuCategories.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Menú no disponible</CardTitle>
                  <CardDescription>
                    Este restaurante aún no ha publicado su menú o no hay productos disponibles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <Coffee className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Vuelve a consultar más tarde.
                  </p>
                </CardContent>
              </Card>
            ) : searchQuery ? (
              // Resultados de búsqueda
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-restaurant-dark pb-2 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Resultados: "{searchQuery}"
                  <Badge variant="outline" className="ml-auto">
                    {filteredMenuItems.length} productos
                  </Badge>
                </h2>
                
                {filteredMenuItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
                    {filteredMenuItems.map(item => (
                      <PublicMenuItem 
                        key={item.id}
                        item={item}
                        category={menuCategories.find(cat => cat.id === item.category_id)}
                        onClick={() => openItemDetails(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-10 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                      No se encontraron resultados para tu búsqueda.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Vista de categorías
              <div>
                {selectedCategory && (
                  <div className="space-y-4">
                    {/* Título de la categoría seleccionada */}
                    <div className="pb-2 hidden md:block">
                      <h2 className="text-xl font-bold text-restaurant-dark">
                        {menuCategories.find(cat => cat.id === selectedCategory)?.name}
                      </h2>
                      {menuCategories.find(cat => cat.id === selectedCategory)?.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {menuCategories.find(cat => cat.id === selectedCategory)?.description}
                        </p>
                      )}
                    </div>

                    {/* Lista de productos en la categoría */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
                      {menuItems
                        .filter(item => item.category_id === selectedCategory)
                        .map(item => (
                          <PublicMenuItem 
                            key={item.id}
                            item={item}
                            category={menuCategories.find(cat => cat.id === item.category_id)}
                            onClick={() => openItemDetails(item)}
                          />
                        ))}
                    </div>

                    {menuItems.filter(item => item.category_id === selectedCategory).length === 0 && (
                      <div className="text-center p-10 bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                          No hay productos disponibles en esta categoría.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white py-3 border-t mt-auto">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {restaurantInfo?.name || "Plate Perfect Order"}. Todos los derechos reservados.
            </p>
            <p className="text-xs text-muted-foreground mt-1 md:mt-0">
              Menú digital powered by <span className="font-medium text-restaurant-primary">Plate Perfect</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Botón flotante del carrito para móviles */}
      <div className="md:hidden">
        <CartButton 
          onClick={() => setCartOpen(true)} 
          variant="floating"
        />
      </div>

      {/* Dialog para detalles del producto */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              {selectedItem?.description || "Sin descripción disponible"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem?.image_url && (
            <div className="w-full overflow-hidden rounded-md mb-4">
              <img 
                src={selectedItem.image_url} 
                alt={selectedItem.name}
                className="w-full object-cover h-48"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Cantidad</Label>
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="h-8 w-8"
                >
                  <span>-</span>
                </Button>
                <span className="w-10 text-center">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={incrementQuantity}
                  className="h-8 w-8"
                >
                  <span>+</span>
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notas especiales</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Sin cebolla, extra salsa, etc."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex justify-between items-center bg-muted p-3 rounded-md">
              <div className="text-sm">
                Total:
              </div>
              <div className="font-bold text-lg">
                ${(selectedItem?.price * quantity).toFixed(2)}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedItem(null)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={addToCart} className="gap-2 w-full sm:w-auto">
              <ShoppingBag className="h-4 w-4" />
              Añadir al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para información del restaurante */}
      <Dialog open={showRestaurantInfo} onOpenChange={setShowRestaurantInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Información del restaurante
            </DialogTitle>
          </DialogHeader>
          
          {restaurantInfo?.logo_url && (
            <div className="flex justify-center p-4">
              <img 
                src={restaurantInfo.logo_url} 
                alt={restaurantInfo.name} 
                className="h-24 object-contain"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center">{restaurantInfo?.name}</h3>
            
            {restaurantInfo?.description && (
              <p className="text-sm text-center text-muted-foreground">
                {restaurantInfo.description}
              </p>
            )}
            
            <div className="space-y-3 mt-4 bg-muted p-3 rounded-md">
              {restaurantInfo?.address && (
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="text-sm">{restaurantInfo.address}</div>
                </div>
              )}
              
              {restaurantInfo?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Teléfono</div>
                    <a href={`tel:${restaurantInfo.phone}`} className="text-sm hover:underline">
                      {restaurantInfo.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {restaurantInfo?.whatsapp && (
                <div className="flex items-start gap-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 flex-shrink-0 text-muted-foreground" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium">WhatsApp</div>
                    <a 
                      href={`https://wa.me/${restaurantInfo.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      {restaurantInfo.whatsapp}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowRestaurantInfo(false)} className="w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer del carrito de compras */}
      <CartDrawer 
        open={cartOpen} 
        onOpenChange={setCartOpen}
        restaurantInfo={restaurantInfo}
      />
    </div>
  );
};

// Componente principal que envuelve el contenido con el CartProvider
const PublicMenu = () => {
  return (
    <CartProvider>
      <PublicMenuContent />
    </CartProvider>
  );
};

export default PublicMenu; 