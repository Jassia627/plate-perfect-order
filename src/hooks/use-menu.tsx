import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, MenuCategory } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';

// Tipos adicionales
export type NewMenuItem = {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  user_id?: string;
  admin_id?: string;
};

export type NewMenuCategory = {
  name: string;
  description?: string;
  sort_order: number;
  user_id?: string;
  admin_id?: string;
};

// Interfaz para los valores de retorno del hook
interface UseMenuReturn {
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  
  // Funciones para gestionar categorías
  addCategory: (category: NewMenuCategory) => Promise<string | null>;
  updateCategory: (id: string, category: Partial<NewMenuCategory>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  
  // Funciones para gestionar items del menú
  addMenuItem: (item: NewMenuItem) => Promise<string | null>;
  updateMenuItem: (id: string, item: Partial<NewMenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  toggleItemAvailability: (id: string, available: boolean) => Promise<boolean>;
  
  // Función para refrescar datos
  refreshMenu: () => Promise<void>;
}

export function useMenu(): UseMenuReturn {
  const { toast } = useToast();
  const { session } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Función para cargar categorías y productos del menú
  const fetchMenuData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!session?.user) {
        setLoading(false);
        setError('Usuario no autenticado');
        toast({
          title: "Error",
          description: "Debes iniciar sesión para acceder al menú",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar el rol del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, admin_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error al verificar rol de usuario:', profileError);
        setError(`Error al verificar rol de usuario: ${profileError.message}`);
        return;
      }
      
      let isUserAdmin = false;
      let adminId = null;
      
      if (profileData) {
        isUserAdmin = profileData.role === 'admin';
        adminId = profileData.admin_id;
      }
      
      setIsAdmin(isUserAdmin);
      
      // Consulta para categorías
      let categoryQuery = supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (isUserAdmin) {
        // Si es admin, mostrar solo sus categorías
        categoryQuery = categoryQuery.eq('user_id', session.user.id);
      } else if (adminId) {
        // Si es mesero, mostrar las categorías de su admin
        categoryQuery = categoryQuery.eq('user_id', adminId);
      } else {
        // Si no tiene admin_id asignado, no mostrar categorías
        setMenuCategories([]);
        setMenuItems([]);
        setLoading(false);
        return;
      }
      
      const { data: categoriesData, error: categoriesError } = await categoryQuery;
      
      if (categoriesError) {
        console.error('Error al cargar categorías:', categoriesError);
        setError(`Error al cargar categorías: ${categoriesError.message}`);
        return;
      }
      
      // Consulta para productos
      let itemsQuery = supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });
      
      if (isUserAdmin) {
        // Si es admin, mostrar solo sus productos
        itemsQuery = itemsQuery.eq('user_id', session.user.id);
      } else if (adminId) {
        // Si es mesero, mostrar los productos de su admin
        itemsQuery = itemsQuery.eq('user_id', adminId);
      }
      
      const { data: itemsData, error: itemsError } = await itemsQuery;
      
      if (itemsError) {
        console.error('Error al cargar productos:', itemsError);
        setError(`Error al cargar productos: ${itemsError.message}`);
        return;
      }
      
      setMenuCategories(categoriesData as MenuCategory[]);
      setMenuItems(itemsData as MenuItem[]);
    } catch (err: any) {
      console.error('Error inesperado al cargar datos del menú:', err);
      setError(`Error al cargar datos del menú: ${err.message}`);
      toast({
        title: "Error",
        description: `No se pudieron cargar los datos del menú: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (session?.user) {
      fetchMenuData();
    }
  }, [session?.user]);

  // Función para añadir una nueva categoría
  const addCategory = async (category: NewMenuCategory): Promise<string | null> => {
    try {
      setLoading(true);
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear categorías",
          variant: "destructive",
        });
        return null;
      }
      
      // Verificar si el usuario es admin
      if (!isAdmin) {
        toast({
          title: "Error",
          description: "Solo los administradores pueden crear categorías",
          variant: "destructive",
        });
        return null;
      }
      
      const categoryWithUserId = {
        ...category,
        user_id: session.user.id,
        admin_id: session.user.id // El admin es el creador
      };
      
      const { data, error } = await supabase
        .from('menu_categories')
        .insert([categoryWithUserId])
        .select()
        .single();
      
      if (error) {
        console.error('Error al crear categoría:', error);
        toast({
          title: "Error",
          description: `No se pudo crear la categoría: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }
      
      const newCategory = data as MenuCategory;
      setMenuCategories(prev => [...prev, newCategory]);
      toast({
        title: "Categoría creada",
        description: `La categoría "${newCategory.name}" ha sido creada correctamente`,
      });
      return newCategory.id;
    } catch (err: any) {
      console.error('Error inesperado al crear categoría:', err);
      toast({
        title: "Error",
        description: `No se pudo crear la categoría: ${err.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una categoría
  const updateCategory = async (id: string, category: Partial<NewMenuCategory>): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si el usuario está autenticado
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para actualizar categorías",
          variant: "destructive",
        });
        return false;
      }
      
      const { data, error } = await supabase
        .from('menu_categories')
        .update({ ...category, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id) // Asegurar que solo se actualicen categorías del usuario actual
        .select()
        .single();
      
      if (error) {
        console.error('Error al actualizar categoría:', error);
        toast({
          title: "Error",
          description: `No se pudo actualizar la categoría: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      setMenuCategories(prev => 
        prev.map(cat => cat.id === id ? { ...cat, ...data } as MenuCategory : cat)
      );
      
      toast({
        title: "Categoría actualizada",
        description: `La categoría ha sido actualizada correctamente`,
      });
      return true;
    } catch (err: any) {
      console.error('Error inesperado al actualizar categoría:', err);
      toast({
        title: "Error",
        description: `No se pudo actualizar la categoría: ${err.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una categoría
  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Verificar si el usuario está autenticado
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para eliminar categorías",
          variant: "destructive",
        });
        return false;
      }
      
      // Verificar si hay productos asociados a esta categoría
      const productsInCategory = menuItems.filter(item => item.category_id === id);
      
      if (productsInCategory.length > 0) {
        toast({
          title: "Error",
          description: 'No se puede eliminar una categoría con productos asociados',
          variant: "destructive",
        });
        return false;
      }
      
      setLoading(true);
      
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id); // Asegurar que solo se eliminen categorías del usuario actual
      
      if (error) {
        console.error('Error al eliminar categoría:', error);
        toast({
          title: "Error",
          description: `No se pudo eliminar la categoría: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      setMenuCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Categoría eliminada",
        description: `La categoría ha sido eliminada correctamente`,
      });
      return true;
    } catch (err: any) {
      console.error('Error inesperado al eliminar categoría:', err);
      toast({
        title: "Error",
        description: `No se pudo eliminar la categoría: ${err.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir un nuevo producto
  const addMenuItem = async (item: NewMenuItem): Promise<string | null> => {
    try {
      setLoading(true);
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear productos",
          variant: "destructive",
        });
        return null;
      }
      
      const itemWithUserId = {
        ...item,
        user_id: session.user.id
      };
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([itemWithUserId])
        .select()
        .single();
      
      if (error) {
        console.error('Error al crear producto:', error);
        toast({
          title: "Error",
          description: `No se pudo crear el producto: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }
      
      const newItem = data as MenuItem;
      setMenuItems(prev => [...prev, newItem]);
      toast({
        title: "Producto creado",
        description: `El producto "${newItem.name}" ha sido creado correctamente`,
      });
      return newItem.id;
    } catch (err: any) {
      console.error('Error inesperado al crear producto:', err);
      toast({
        title: "Error",
        description: `No se pudo crear el producto: ${err.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar un producto
  const updateMenuItem = async (id: string, item: Partial<NewMenuItem>): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si el usuario está autenticado
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para actualizar productos",
          variant: "destructive",
        });
        return false;
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .update({ ...item, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id) // Asegurar que solo se actualicen productos del usuario actual
        .select()
        .single();
      
      if (error) {
        console.error('Error al actualizar producto:', error);
        toast({
          title: "Error",
          description: `No se pudo actualizar el producto: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      setMenuItems(prev => 
        prev.map(menuItem => menuItem.id === id ? { ...menuItem, ...data } as MenuItem : menuItem)
      );
      
      toast({
        title: "Producto actualizado",
        description: `El producto ha sido actualizado correctamente`,
      });
      return true;
    } catch (err: any) {
      console.error('Error inesperado al actualizar producto:', err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el producto: ${err.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un producto
  const deleteMenuItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si el usuario está autenticado
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para eliminar productos",
          variant: "destructive",
        });
        return false;
      }
      
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id); // Asegurar que solo se eliminen productos del usuario actual
      
      if (error) {
        console.error('Error al eliminar producto:', error);
        toast({
          title: "Error",
          description: `No se pudo eliminar el producto: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Producto eliminado",
        description: `El producto ha sido eliminado correctamente`,
      });
      return true;
    } catch (err: any) {
      console.error('Error inesperado al eliminar producto:', err);
      toast({
        title: "Error",
        description: `No se pudo eliminar el producto: ${err.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para activar/desactivar un producto
  const toggleItemAvailability = async (id: string, available: boolean): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si el usuario está autenticado
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para cambiar la disponibilidad del producto",
          variant: "destructive",
        });
        return false;
      }
      
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          available,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', session.user.id); // Asegurar que solo se actualicen productos del usuario actual
      
      if (error) {
        console.error('Error al cambiar disponibilidad del producto:', error);
        toast({
          title: "Error",
          description: `No se pudo actualizar el estado del producto: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      setMenuItems(prev => 
        prev.map(item => item.id === id ? { ...item, available } as MenuItem : item)
      );
      
      toast({
        title: available ? "Producto disponible" : "Producto no disponible",
        description: `El estado del producto ha sido actualizado`,
      });
      return true;
    } catch (err: any) {
      console.error('Error inesperado al cambiar disponibilidad:', err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado del producto: ${err.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar manualmente los datos del menú
  const refreshMenu = async () => {
    await fetchMenuData();
  };

  return {
    menuItems,
    menuCategories,
    loading,
    error,
    isAdmin,
    addCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    refreshMenu
  };
} 