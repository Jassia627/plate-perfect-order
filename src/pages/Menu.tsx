import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useMenu, NewMenuCategory, NewMenuItem } from "@/hooks/use-menu";
import { MenuItem, MenuCategory } from "@/hooks/use-orders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, RefreshCcw, Trash2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageUpload from "@/components/ui/image-upload";
import ShareMenuButton from "@/components/menu/ShareMenuButton";
import { useAuth } from "@/hooks/use-auth";

const Menu = () => {
  const { 
    menuItems, 
    menuCategories, 
    loading, 
    error, 
    addCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    refreshMenu 
  } = useMenu();
  
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState("items");
  
  // Estado para formularios y modales
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  
  // Estado para datos de formularios
  const [newCategory, setNewCategory] = useState<NewMenuCategory>({ 
    name: "",
    description: "",
    sort_order: 0
  });
  
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);
  
  const [newItem, setNewItem] = useState<NewMenuItem>({
    category_id: "",
    name: "",
    description: "",
    price: 0,
    image_url: "",
    available: true
  });
  
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  
  // Funciones para manejar categorías
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    await addCategory(newCategory);
    setNewCategory({ name: "", description: "", sort_order: 0 });
    setIsAddCategoryOpen(false);
  };
  
  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    await updateCategory(editingCategory.id, {
      name: editingCategory.name,
      description: editingCategory.description,
      sort_order: editingCategory.sort_order
    });
    
    setEditingCategory(null);
    setIsEditCategoryOpen(false);
  };
  
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    await deleteCategory(deletingCategory.id);
    setDeletingCategory(null);
    setIsDeleteCategoryOpen(false);
  };
  
  // Funciones para manejar productos
  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.category_id) return;
    
    await addMenuItem(newItem);
    setNewItem({
      category_id: "",
      name: "",
      description: "",
      price: 0,
      image_url: "",
      available: true
    });
    setIsAddItemOpen(false);
  };
  
  const handleEditItem = async () => {
    if (!editingItem || !editingItem.name.trim() || !editingItem.category_id) return;
    
    await updateMenuItem(editingItem.id, {
      category_id: editingItem.category_id,
      name: editingItem.name,
      description: editingItem.description,
      price: editingItem.price,
      image_url: editingItem.image_url,
      available: editingItem.available
    });
    
    setEditingItem(null);
    setIsEditItemOpen(false);
  };
  
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    
    await deleteMenuItem(deletingItem.id);
    setDeletingItem(null);
    setIsDeleteItemOpen(false);
  };
  
  const handleToggleItemAvailability = async (item: MenuItem) => {
    await toggleItemAvailability(item.id, !item.available);
  };
  
  // Función para obtener el nombre de la categoría
  const getCategoryName = (categoryId: string) => {
    const category = menuCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "Sin categoría";
  };

  return (
    <MainLayout 
      title="Gestión del Menú"
      subtitle="Administre las categorías y productos del menú"
      actions={
        session?.user && (
          <ShareMenuButton adminId={session.user.id} />
        )
      }
    >
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          size="sm" 
          className="flex items-center gap-1" 
          onClick={refreshMenu}
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Actualizar</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="items">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        {/* Pestaña de Productos */}
        <TabsContent value="items" className="mt-0">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                setNewItem({
                  category_id: menuCategories.length > 0 ? menuCategories[0].id : "",
                  name: "",
                  description: "",
                  price: 0,
                  image_url: "",
                  available: true
                });
                setIsAddItemOpen(true);
              }}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Añadir Producto</span>
            </Button>
          </div>

          {/* Listado de productos */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : menuItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No hay productos en el menú</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Añade productos para comenzar a crear tu menú
                </p>
                <Button 
                  onClick={() => {
                    setNewItem({
                      category_id: menuCategories.length > 0 ? menuCategories[0].id : "",
                      name: "",
                      description: "",
                      price: 0,
                      image_url: "",
                      available: true
                    });
                    setIsAddItemOpen(true);
                  }}
                  className="mt-4"
                >
                  Añadir Producto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <Card key={item.id} className={!item.available ? "opacity-60" : ""}>
                  <div className="relative">
                    {item.image_url ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-white"
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditItemOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-white text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeletingItem(item);
                          setIsDeleteItemOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryName(item.category_id)}
                        </p>
                        {item.description && (
                          <p className="text-sm mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold">${item.price.toFixed(2)}</span>
                        <Switch
                          id={`item-available-${item.id}`}
                          checked={item.available}
                          onCheckedChange={() => handleToggleItemAvailability(item)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pestaña de Categorías */}
        <TabsContent value="categories" className="mt-0">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                setNewCategory({ name: "", description: "", sort_order: menuCategories.length });
                setIsAddCategoryOpen(true);
              }}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Añadir Categoría</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-muted-foreground">Cargando categorías...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
              {error}
            </div>
          ) : menuCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h3 className="text-lg font-medium">No hay categorías</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Añade categorías para organizar tu menú
              </p>
              <Button onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                <span>Añadir Categoría</span>
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Categorías del Menú</CardTitle>
                <CardDescription>
                  Organiza tus productos en categorías para una mejor experiencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {menuCategories
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(category => (
                      <div 
                        key={category.id} 
                        className="flex justify-between items-center p-3 bg-muted/40 rounded-md"
                      >
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Orden: {category.sort_order} | Productos: {
                              menuItems.filter(item => item.category_id === category.id).length
                            }
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category);
                              setIsEditCategoryOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setDeletingCategory(category);
                              setIsDeleteCategoryOpen(true);
                            }}
                            disabled={menuItems.some(item => item.category_id === category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para añadir categoría */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para organizar tus productos
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Ej: Entradas, Platos principales..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Descripción (opcional)</Label>
              <Textarea
                id="category-description"
                value={newCategory.description || ""}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Breve descripción de la categoría"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-order">Orden de visualización</Label>
            <Input 
                id="category-order"
                type="number"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) })}
              />
                  </div>
                </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategory.name.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar categoría */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la categoría
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Nombre</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-description">Descripción (opcional)</Label>
                <Textarea
                  id="edit-category-description"
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-order">Orden de visualización</Label>
                <Input
                  id="edit-category-order"
                  type="number"
                  value={editingCategory.sort_order}
                  onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) })}
                />
              </div>
              </div>
            )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory} disabled={!editingCategory || !editingCategory.name.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación para eliminar categoría */}
      <AlertDialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría 
              "{deletingCategory?.name}" de tu menú.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para añadir producto */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Producto</DialogTitle>
            <DialogDescription>
              Crea un nuevo producto para tu menú
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-category">Categoría</Label>
              <Select
                value={newItem.category_id}
                onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre</Label>
              <Input
                id="item-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ej: Ensalada César, Pasta Carbonara..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Descripción (opcional)</Label>
              <Textarea
                id="item-description"
                value={newItem.description || ""}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Breve descripción del producto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Precio</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              />
            </div>
            <ImageUpload
              value={newItem.image_url || ""}
              onChange={(url) => setNewItem({ ...newItem, image_url: url })}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="item-available"
                checked={newItem.available}
                onCheckedChange={(checked) => setNewItem({ ...newItem, available: checked })}
              />
              <Label htmlFor="item-available">Disponible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={!newItem.name.trim() || !newItem.category_id || newItem.price <= 0}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar producto */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica los detalles del producto
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-item-category">Categoría</Label>
                <Select
                  value={editingItem.category_id}
                  onValueChange={(value) => setEditingItem({ ...editingItem, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-name">Nombre</Label>
                <Input
                  id="edit-item-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-description">Descripción (opcional)</Label>
                <Textarea
                  id="edit-item-description"
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-price">Precio</Label>
                <Input
                  id="edit-item-price"
                  type="number"
                  step="0.01"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                />
              </div>
              <ImageUpload
                value={editingItem.image_url || ""}
                onChange={(url) => setEditingItem({ ...editingItem, image_url: url })}
              />
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-item-available"
                  checked={editingItem.available}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, available: checked })}
                />
                <Label htmlFor="edit-item-available">Disponible</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditItem} 
              disabled={!editingItem || !editingItem.name.trim() || !editingItem.category_id || editingItem.price <= 0}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación para eliminar producto */}
      <AlertDialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto 
              "{deletingItem?.name}" de tu menú.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Menu;
