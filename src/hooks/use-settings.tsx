import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

// Tipo genérico para funcionar con cualquier tipo de configuración
type SettingsType<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  updateSettings: (newData: Partial<T>) => Promise<void>;
  resetSettings: () => Promise<void>;
  resetBillingSettings?: () => Promise<void>; // Función opcional solo para billingSettings
};

// Definir un tipo para las tablas de configuración
type SettingsTable = 'restaurant_settings' | 'user_settings' | 'billing_settings' | 'notification_settings';

// Mapeo de nombres de ajustes a tablas de base de datos
const tableMapping: Record<string, SettingsTable> = {
  'restaurantSettings': 'restaurant_settings',
  'userSettings': 'user_settings',
  'billingSettings': 'billing_settings',
  'notificationSettings': 'notification_settings'
};

// Campos que deben excluirse de la base de datos
const EXCLUDED_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'];

// Hook personalizado para gestionar configuraciones con Supabase
export function useSettings<T extends Record<string, any>>(
  key: string, 
  defaultValues: T
): SettingsType<T> {
  const [data, setData] = useState<T>(defaultValues);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  
  // Asegurar que key es una clave válida del tableMapping
  if (!(key in tableMapping)) {
    throw new Error(`Clave de configuración inválida: ${key}`);
  }
  
  const tableName = tableMapping[key];

  // Cargar configuraciones al iniciar
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Si estamos cargando configuraciones del restaurante, usar la función RPC
        if (tableName === 'restaurant_settings') {
          try {
            // Intentar obtener las configuraciones usando la función RPC
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_restaurant_settings_for_user', {
                user_id_param: session.user.id
              });
              
            if (rpcError) {
              console.error('Error al obtener configuraciones del restaurante mediante RPC:', rpcError);
              
              // Respaldo: intentar directamente con la consulta normal
              const { data: settingsData, error: fetchError } = await supabase
                .from(tableName)
                .select('*')
                .eq('user_id', session.user.id)
                .single();
                
              if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                  console.log(`No se encontraron configuraciones para ${key} del usuario ${session.user.id}. Se crearán cuando el usuario guarde el formulario.`);
                } else {
                  console.error(`Error al cargar configuraciones de ${key} para usuario ${session.user.id}:`, fetchError);
                  setError(fetchError.message);
                }
              } else if (settingsData) {
                // Convertir snake_case a camelCase para las propiedades
                const formattedData = formatDataFromDb(settingsData);
                setData(prev => ({ ...prev, ...formattedData }));
              }
            } else if (rpcData && rpcData.length > 0) {
              // La función RPC devuelve un array, tomamos el primer elemento
              const formattedData = formatDataFromDb(rpcData[0]);
              setData(prev => ({ ...prev, ...formattedData }));
            } else {
              console.log(`No se encontraron configuraciones para ${key} del usuario ${session.user.id} o sus administradores. Se crearán cuando el usuario guarde el formulario.`);
            }
          } catch (rpcErr) {
            console.error('Error inesperado con RPC:', rpcErr);
            // Continuar con la lógica normal de respaldo
          }
        } else {
          // Para otras tablas, seguir usando el método estándar
          const { data: settingsData, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              // No se encontraron registros, pero NO creamos uno nuevo automáticamente
              console.log(`No se encontraron configuraciones para ${key} del usuario ${session.user.id}. Se crearán cuando el usuario guarde el formulario.`);
              // Simplemente dejamos los valores por defecto en el estado local
            } else {
              console.error(`Error al cargar configuraciones de ${key} para usuario ${session.user.id}:`, fetchError);
              setError(fetchError.message);
            }
          } else if (settingsData) {
            // Verificar que los datos pertenecen al usuario actual
            if (settingsData.user_id === session.user.id) {
              // Convertir snake_case a camelCase para las propiedades
              const formattedData = formatDataFromDb(settingsData);
              setData(prev => ({ ...prev, ...formattedData }));
            } else {
              console.error(`Se obtuvieron datos incorrectos que no pertenecen al usuario ${session.user.id}`);
              setError('Error al obtener tus datos. Por favor, contacta con soporte.');
            }
          }
        }
      } catch (err) {
        console.error(`Error inesperado al cargar configuraciones de ${key} para usuario ${session.user.id}:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [key, tableName, session?.user]);

  // Función para crear configuraciones predeterminadas
  const createDefaultSettings = async () => {
    if (!session?.user) return;
    
    try {
      // Crear objeto con solo los campos que existen en la base de datos
      const dbData: Record<string, any> = {
        user_id: session.user.id
      };
      
      // Preparar datos específicos según la tabla
      if (key === 'restaurantSettings') {
        dbData.name = defaultValues.name || 'PlatePerfect';
        dbData.phone = defaultValues.phone || '912 345 678';
        dbData.address = defaultValues.address || 'Calle Principal 123, 28001 Madrid';
        dbData.description = defaultValues.description || 'Restaurante de comida mediterránea';
        dbData.dark_mode = defaultValues.darkMode !== undefined ? defaultValues.darkMode : false;
        dbData.auto_print = defaultValues.autoPrint !== undefined ? defaultValues.autoPrint : false;
        dbData.currency = defaultValues.currency || 'EUR';
      } 
      else if (key === 'userSettings') {
        dbData.full_name = defaultValues.fullName || '';
        dbData.email = defaultValues.email || '';
      }
      else if (key === 'billingSettings') {
        dbData.company_name = defaultValues.companyName || '';
        dbData.tax_id = defaultValues.taxId || '';
        dbData.billing_email = defaultValues.billingEmail || '';
        dbData.billing_address = defaultValues.billingAddress || '';
        
        // Forzar la actualización con cadenas vacías en lugar de NULL para evitar valores predeterminados
        if (!dbData.company_name) dbData.company_name = ''; 
        if (!dbData.tax_id) dbData.tax_id = '';
        if (!dbData.billing_email) dbData.billing_email = '';
        if (!dbData.billing_address) dbData.billing_address = '';
      }
      else if (key === 'notificationSettings') {
        dbData.new_orders = defaultValues.newOrders !== undefined ? defaultValues.newOrders : true;
        dbData.reservations = defaultValues.reservations !== undefined ? defaultValues.reservations : true;
        dbData.weekly_reports = defaultValues.weeklyReports !== undefined ? defaultValues.weeklyReports : false;
        dbData.inventory_alerts = defaultValues.inventoryAlerts !== undefined ? defaultValues.inventoryAlerts : true;
        dbData.notification_email = defaultValues.notificationEmail || '';
      }

      // Añadir timestamps
      dbData.created_at = new Date().toISOString();
      dbData.updated_at = new Date().toISOString();

      console.log(`Creando configuración para ${key}:`, dbData);

      const { data: newSettings, error: insertError } = await supabase
        .from(tableName)
        .insert(dbData)
        .select()
        .single();

      if (insertError) {
        console.error(`Error al crear configuraciones para ${key}:`, insertError);
        setError(insertError.message);
        toast.error(`Error al crear configuraciones: ${insertError.message}`);
      } else if (newSettings) {
        const formattedData = formatDataFromDb(newSettings);
        setData(prev => ({ ...prev, ...formattedData }));
        toast.success(`Configuraciones de ${key} creadas correctamente`);
      }
    } catch (err) {
      console.error(`Error inesperado al crear configuraciones para ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al crear configuraciones');
    }
  };

  // Actualizar configuraciones
  const updateSettings = async (newData: Partial<T>) => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para guardar configuraciones');
      return;
    }

    try {
      setLoading(true);
      
      // Comprobamos si ya existen registros para este usuario
      let existingRecords = null;
      let checkError = null;
      
      try {
        // MODIFICACIÓN IMPORTANTE: Asegurar que solo se busquen registros del usuario actual
        // Usar "as any" para evitar problemas de tipado estricto
        const { data, error } = await (supabase as any)
          .from(tableName)
          .select('id, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        existingRecords = data;
        checkError = error;
      } catch (err) {
        console.error(`Error al verificar registros existentes para usuario ${session.user.id}:`, err);
        checkError = err;
      }
      
      // Crear objeto con los campos actualizados que proporciona el usuario
      const dbData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // Preparar datos según la tabla para guardar EXACTAMENTE lo que el usuario ingresó
      if (key === 'restaurantSettings') {
        if ('name' in newData) dbData.name = newData.name;
        if ('phone' in newData) dbData.phone = newData.phone;
        if ('address' in newData) dbData.address = newData.address;
        if ('description' in newData) dbData.description = newData.description;
        if ('darkMode' in newData) dbData.dark_mode = newData.darkMode;
        if ('autoPrint' in newData) dbData.auto_print = newData.autoPrint;
        if ('currency' in newData) dbData.currency = newData.currency;
      } 
      else if (key === 'userSettings') {
        if ('fullName' in newData) dbData.full_name = newData.fullName;
        if ('email' in newData) dbData.email = newData.email;
      }
      else if (key === 'billingSettings') {
        // Para billingSettings, forzamos la actualización completa de todos los campos
        // para sobrescribir los valores predeterminados de la base de datos
        dbData.company_name = 'companyName' in newData ? newData.companyName : data.companyName || '';
        dbData.tax_id = 'taxId' in newData ? newData.taxId : data.taxId || '';
        dbData.billing_email = 'billingEmail' in newData ? newData.billingEmail : data.billingEmail || '';
        dbData.billing_address = 'billingAddress' in newData ? newData.billingAddress : data.billingAddress || '';
        
        // Imprimir para debug
        console.log('Actualizando billing_settings con valores completos:', dbData);
      }
      else if (key === 'notificationSettings') {
        if ('newOrders' in newData) dbData.new_orders = newData.newOrders;
        if ('reservations' in newData) dbData.reservations = newData.reservations;
        if ('weeklyReports' in newData) dbData.weekly_reports = newData.weeklyReports;
        if ('inventoryAlerts' in newData) dbData.inventory_alerts = newData.inventoryAlerts;
        if ('notificationEmail' in newData) dbData.notification_email = newData.notificationEmail;
      }

      console.log(`Actualizando/Creando configuración para ${key} del usuario ${session.user.id}:`, dbData);
      
      // Manejar el caso de que no existan registros o haya error al buscarlos
      if (checkError || !existingRecords || existingRecords.length === 0) {
        // Si no existe el registro, lo creamos con los datos proporcionados
        dbData.user_id = session.user.id;
        dbData.created_at = new Date().toISOString();
        
        try {
          // Usar "as any" para evitar problemas de tipado estricto
          const { data: newSettings, error: insertError } = await (supabase as any)
            .from(tableName)
            .insert(dbData)
            .select();
          
          if (insertError) {
            console.error(`Error al crear configuraciones para ${key} del usuario ${session.user.id}:`, insertError);
            setError(insertError.message);
            toast.error(`Error al crear configuraciones: ${insertError.message}`);
          } else if (newSettings && newSettings.length > 0) {
            const formattedData = formatDataFromDb(newSettings[0]);
            setData(prev => ({ ...prev, ...formattedData }));
          }
        } catch (err) {
          console.error(`Error al crear configuraciones para ${key} del usuario ${session.user.id}:`, err);
          setError(err instanceof Error ? err.message : 'Error desconocido');
          toast.error('Error al crear configuraciones');
        }
      } else {
        // Si existen registros, actualizar el primer registro (el más reciente)
        try {
          // MODIFICACIÓN IMPORTANTE: Asegurar que solo se actualice el registro del usuario actual
          const { data: updatedSettings, error: updateError } = await (supabase as any)
            .from(tableName)
            .update(dbData)
            .eq('id', existingRecords[0].id)
            .eq('user_id', session.user.id)
            .select();
          
          if (updateError) {
            console.error(`Error al actualizar configuraciones para ${key} del usuario ${session.user.id}:`, updateError);
            setError(updateError.message);
            toast.error(`Error al actualizar configuraciones: ${updateError.message}`);
          } else if (updatedSettings && updatedSettings.length > 0) {
            const formattedData = formatDataFromDb(updatedSettings[0]);
            setData(prev => ({ ...prev, ...formattedData }));
          }
        } catch (err) {
          console.error(`Error al actualizar configuraciones para ${key} del usuario ${session.user.id}:`, err);
          setError(err instanceof Error ? err.message : 'Error desconocido');
          toast.error('Error al actualizar configuraciones');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Restablecer configuraciones a valores predeterminados
  const resetSettings = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para restablecer configuraciones');
      return;
    }

    try {
      setLoading(true);
      
      // Consultar si existen configuraciones para este usuario
      const { data: existingSettings, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (checkError && !checkError.message.includes('No rows found')) {
        console.error(`Error al comprobar configuraciones para ${key}:`, checkError);
        setError(checkError.message);
        toast.error(`Error al restablecer configuraciones: ${checkError.message}`);
        return;
      }

      if (existingSettings) {
        // Preparar datos predeterminados según el tipo de configuración
        const defaultDbData: Record<string, any> = {
          user_id: session.user.id,
          updated_at: new Date().toISOString()
        };
        
        if (key === 'restaurantSettings') {
          defaultDbData.name = 'PlatePerfect';
          defaultDbData.phone = '912 345 678';
          defaultDbData.address = 'Calle Principal 123, 28001 Madrid';
          defaultDbData.description = 'Restaurante de comida mediterránea';
          defaultDbData.dark_mode = false;
          defaultDbData.auto_print = false;
          defaultDbData.currency = 'EUR';
        } 
        else if (key === 'userSettings') {
          defaultDbData.full_name = 'Admin Usuario';
          defaultDbData.email = 'admin@plateperfect.com';
        }
        else if (key === 'notificationSettings') {
          defaultDbData.new_orders = true;
          defaultDbData.reservations = true;
          defaultDbData.weekly_reports = false;
          defaultDbData.inventory_alerts = true;
          defaultDbData.notification_email = 'admin@plateperfect.com';
        }
        
        // Actualizar a valores predeterminados, asegurando que sea el registro del usuario actual
        const { error: resetError } = await supabase
          .from(tableName)
          .update(defaultDbData)
          .eq('id', existingSettings.id)
          .eq('user_id', session.user.id);
        
        if (resetError) {
          console.error(`Error al restablecer configuraciones de ${key} para usuario ${session.user.id}:`, resetError);
          setError(resetError.message);
          toast.error(`Error al restablecer configuraciones: ${resetError.message}`);
        } else {
          // Actualizar estado local
          const formattedDefaults = Object.keys(defaultValues).reduce((acc, key) => {
            if (!EXCLUDED_FIELDS.includes(key)) {
              acc[key as keyof T] = defaultValues[key as keyof T];
            }
            return acc;
          }, {} as Partial<T>);
          
          setData(prev => ({ ...prev, ...formattedDefaults }));
          toast.success('Configuraciones restablecidas a valores predeterminados');
        }
      } else {
        // Si no hay configuraciones, simplemente establecer valores predeterminados localmente
        setData(defaultValues);
        toast.info('No hay configuraciones para restablecer. Se aplicarán los valores predeterminados.');
      }
    } catch (err) {
      console.error(`Error inesperado al restablecer configuraciones de ${key} para usuario ${session.user.id}:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al restablecer configuraciones');
    } finally {
      setLoading(false);
    }
  };

  // Función especial para resetear la configuración de facturación
  const resetBillingSettings = async () => {
    if (!session?.user || key !== 'billingSettings') {
      if (key !== 'billingSettings') {
        console.error('Esta función solo es válida para configuraciones de facturación');
      } else {
        toast.error('Debes iniciar sesión para restablecer configuraciones');
      }
      return;
    }

    try {
      setLoading(true);
      
      // Consultar si existen configuraciones para este usuario
      const { data: existingSettings, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (checkError && !checkError.message.includes('No rows found')) {
        console.error(`Error al comprobar configuraciones de facturación para usuario ${session.user.id}:`, checkError);
        setError(checkError.message);
        toast.error(`Error al restablecer configuraciones: ${checkError.message}`);
        return;
      }

      if (existingSettings) {
        // Datos completamente vacíos para facturación
        const emptyData = {
          user_id: session.user.id,
          company_name: '',
          tax_id: '',
          billing_email: '',
          billing_address: '',
          updated_at: new Date().toISOString()
        };
        
        // Actualizar a valores vacíos, asegurando que sea el registro del usuario actual
        const { error: resetError } = await supabase
          .from(tableName)
          .update(emptyData)
          .eq('id', existingSettings.id)
          .eq('user_id', session.user.id);
        
        if (resetError) {
          console.error(`Error al restablecer configuraciones de facturación para usuario ${session.user.id}:`, resetError);
          setError(resetError.message);
          toast.error(`Error al restablecer configuraciones: ${resetError.message}`);
        } else {
          // Actualizar estado local
          setData(prev => ({
            ...prev,
            companyName: '',
            taxId: '',
            billingEmail: '',
            billingAddress: ''
          }));
          toast.success('Configuraciones de facturación restablecidas');
        }
      } else {
        // Si no hay configuraciones, simplemente establecer valores vacíos localmente
        setData(prev => ({
          ...prev,
          companyName: '',
          taxId: '',
          billingEmail: '',
          billingAddress: ''
        }));
        toast.info('No hay configuraciones para restablecer. Se aplicarán valores vacíos.');
      }
    } catch (err) {
      console.error(`Error inesperado al restablecer configuraciones de facturación para usuario ${session.user.id}:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al restablecer configuraciones');
    } finally {
      setLoading(false);
    }
  };

  // Función para convertir snake_case a camelCase
  const formatDataFromDb = (dbData: any) => {
    const result: any = {};
    
    Object.keys(dbData).forEach(key => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at') {
        // Convertir snake_case a camelCase
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        result[camelKey] = dbData[key];
      }
    });
    
    return result as T;
  };

  // Devolver funciones y datos según el tipo de configuración
  if (key === 'billingSettings') {
    return {
      data,
      loading,
      error,
      updateSettings,
      resetSettings,
      resetBillingSettings
    };
  } else {
    return {
      data,
      loading,
      error,
      updateSettings,
      resetSettings
    };
  }
}
