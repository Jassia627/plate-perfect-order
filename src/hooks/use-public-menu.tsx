import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, MenuCategory } from '@/hooks/use-orders';
import { toast } from 'sonner';

// Interfaz para la información del restaurante
interface RestaurantInfo {
  name: string;
  description: string;
  address: string;
  phone: string;      // Añadimos el teléfono normal
  whatsapp: string;
  logo_url?: string;
}

// Interfaz para los valores de retorno del hook
interface UsePublicMenuReturn {
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  restaurantInfo: RestaurantInfo | null;
  loading: boolean;
  error: string | null;
  loadMenuByAdminId: (adminId: string) => Promise<boolean>;
}

export function usePublicMenu(): UsePublicMenuReturn {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función asíncrona para cargar solo los campos seguros de restaurant_settings
  const loadRestaurantInfo = async (adminId: string) => {
    try {
      // Obtener solo los campos básicos que sabemos que existen
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('name, description, address, phone')
        .eq('admin_id', adminId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // Ignorar error "no rows returned"
        console.error('Error al cargar información básica del restaurante:', error);
        
        // Intentar por user_id si admin_id falla
        const { data: userBasedData, error: userBasedError } = await supabase
          .from('restaurant_settings')
          .select('name, description, address, phone')
          .eq('user_id', adminId)
          .single();
          
        if (!userBasedError && userBasedData) {
          console.log("Información del restaurante obtenida por user_id:", userBasedData);
          setRestaurantInfo({
            name: userBasedData.name || 'Restaurante',
            description: userBasedData.description || '',
            address: userBasedData.address || '',
            phone: userBasedData.phone || '',
            whatsapp: '', // Se intenta actualizar después
            logo_url: '' // No disponible en esta consulta base
          });
          
          // Intentar obtener whatsapp por separado
          try {
            const { data: whatsappData } = await supabase
              .from('restaurant_settings')
              .select('whatsapp')
              .eq('user_id', adminId)
              .single();
              
            if (whatsappData && whatsappData.whatsapp) {
              setRestaurantInfo(prev => ({
                ...prev!,
                whatsapp: whatsappData.whatsapp
              }));
            } else {
              // Si no hay whatsapp, usar phone
              setRestaurantInfo(prev => ({
                ...prev!,
                whatsapp: userBasedData.phone || ''
              }));
            }
          } catch (whatsappError) {
            console.log("WhatsApp no disponible:", whatsappError);
          }
          
          return true;
        }
        
        return false;
      }
      
      if (data) {
        console.log("Información básica del restaurante:", data);
        setRestaurantInfo({
          name: data.name || 'Restaurante',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          whatsapp: '', // Se intenta actualizar después
          logo_url: '' // No disponible en esta consulta base
        });
        
        // Intentar obtener whatsapp por separado
        try {
          const { data: whatsappData } = await supabase
            .from('restaurant_settings')
            .select('whatsapp')
            .eq('admin_id', adminId)
            .single();
            
          if (whatsappData && whatsappData.whatsapp) {
            setRestaurantInfo(prev => ({
              ...prev!,
              whatsapp: whatsappData.whatsapp
            }));
          } else {
            // Si no hay whatsapp, usar phone
            setRestaurantInfo(prev => ({
              ...prev!,
              whatsapp: data.phone || ''
            }));
          }
        } catch (whatsappError) {
          console.log("WhatsApp no disponible:", whatsappError);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error en loadRestaurantInfo:", err);
      return false;
    }
  };

  // Función para cargar el menú por ID de administrador
  const loadMenuByAdminId = useCallback(async (adminId: string): Promise<boolean> => {
    if (!adminId) {
      setError('ID de restaurante no válido');
      toast.error("ID de restaurante no válido");
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Cargando menú público para adminId:", adminId);
      
      // Cargar información del restaurante de forma segura
      await loadRestaurantInfo(adminId);
      
      // Consulta para categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('admin_id', adminId)
        .order('sort_order', { ascending: true });
      
      if (categoriesError) {
        console.error('Error al cargar categorías:', categoriesError);
        setError(`Error al cargar categorías: ${categoriesError.message}`);
        return false;
      }
      
      console.log("Categorías encontradas:", categoriesData?.length || 0);
      
      // Consulta para productos disponibles
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('admin_id', adminId)
        .eq('available', true)
        .order('name', { ascending: true });
      
      if (itemsError) {
        console.error('Error al cargar productos:', itemsError);
        setError(`Error al cargar productos: ${itemsError.message}`);
        return false;
      }
      
      console.log("Productos encontrados:", itemsData?.length || 0);
      
      // Verificación adicional para depuración
      if ((!categoriesData || categoriesData.length === 0) && 
          (!itemsData || itemsData.length === 0)) {
        console.warn("No se encontraron datos para el adminId proporcionado:", adminId);
        
        // Intentar diagnóstico desde el servidor
        try {
          const { data: diagData } = await supabase
            .rpc('debug_menu_access', { admin_uuid: adminId });
            
          if (diagData) {
            console.log("Diagnóstico de servidor:", diagData);
          }
        } catch (diagError) {
          console.error("Error en diagnóstico:", diagError);
        }
      }
      
      setMenuCategories(categoriesData || []);
      setMenuItems(itemsData || []);
      return true;
    } catch (err: any) {
      console.error('Error inesperado al cargar datos del menú:', err);
      setError(`Error al cargar datos del menú: ${err.message}`);
      toast.error(`No se pudo cargar el menú: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    menuItems,
    menuCategories,
    restaurantInfo,
    loading,
    error,
    loadMenuByAdminId
  };
} 