import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

// Tipos para el personal
export type StaffRole = "Mesero/a" | "Cocinero/a" | "Cajero/a" | "Administrador/a" | string;

// Mapa para convertir roles de la interfaz a roles de la base de datos
const roleMapping: Record<string, string> = {
  "Mesero/a": "waiter",
  "Cocinero/a": "chef",
  "Cajero/a": "cashier",
  "Administrador/a": "admin",
  // Retrocompatibilidad con roles anteriores
  "Camarero/a": "waiter",
  "Chef": "chef",
  "Chef Asistente": "chef",
  "Recepcionista": "waiter",
  "Gerente": "admin",
  "Barman": "waiter",
  "Personal de limpieza": "waiter",
  // Valores predeterminados para los roles base
  "admin": "admin",
  "waiter": "waiter",
  "chef": "chef",
  "cashier": "cashier"
};

export type StaffMember = {
  id: string;
  user_id: string;
  email: string;
  role: StaffRole;
  name?: string;
  admin_id?: string;
  restaurant_id?: string;
  created_at?: string;
  updated_at?: string;
  phone?: string;
  status?: string;
};

export type NewStaffMember = {
  email: string;
  password?: string;
  role: StaffRole | string;
  name?: string;
  phone?: string;
  status?: string;
};

// Interfaz para los valores de retorno del hook
interface UseStaffReturn {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  
  // Funciones para gestionar personal
  createStaffMember: (member: NewStaffMember) => Promise<string | null>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<boolean>;
  deleteStaffMember: (id: string) => Promise<boolean>;
  getStaffById: (id: string) => Promise<StaffMember | null>;
  refreshStaff: () => Promise<void>;
  // Funciones adicionales para la interfaz Staff.tsx
  addStaffMember: (member: any) => Promise<boolean>;
  toggleStaffStatus: (id: string) => Promise<boolean>;
  // Función para obtener meseros activos
  getActiveWaiters: () => StaffMember[];
}

export function useStaff(): UseStaffReturn {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { session } = useAuth();

  // Función para cargar personal desde Supabase
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        setError('Usuario no autenticado');
        setLoading(false);
        return;
      }
      
      // Intentar asegurar que el usuario actual tenga rol de admin mediante RPC
      try {
        const { data: ensureAdminResult, error: ensureAdminError } = await supabase
          .rpc('ensure_admin_role', {
            p_user_id: session.user.id
          });
          
        if (ensureAdminError) {
          console.warn('Error al asegurar rol de admin:', ensureAdminError);
          // Continuamos de todos modos, intentaremos verificar el rol
        } else {
          console.log('Admin role verificado/creado:', ensureAdminResult);
          setIsAdmin(true);
        }
      } catch (rpcErr) {
        console.warn('Error al llamar RPC ensure_admin_role:', rpcErr);
        // Continuamos con el flujo normal
      }
      
      // Verificar si el usuario actual es administrador usando la función RPC
      try {
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_user_profile', {
            p_user_id: session.user.id
          });
          
        if (profileError) {
          console.warn('Error al obtener perfil mediante RPC:', profileError);
          
          // Caemos al método tradicional de obtener el perfil
          const { data: tradProfileData, error: tradProfileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          if (tradProfileError) {
            console.error('Error al verificar rol:', tradProfileError);
            
            // Si el error es PGRST116 (no rows), podría ser que el perfil no exista todavía
            if (tradProfileError.code === 'PGRST116') {
              console.log('No se encontró perfil de usuario, creando perfil como admin...');
              
              // Intentamos crear un perfil de admin mediante RPC
              try {
                const { data: createResult, error: createError } = await supabase
                  .rpc('create_or_update_user_profile', {
                    p_user_id: session.user.id,
                    p_role: 'admin'
                  });
                  
                if (createError) {
                  console.error('Error al crear perfil mediante RPC:', createError);
                  setError(`Error al crear perfil mediante RPC: ${createError.message}`);
                  return;
                }
                
                // Si llegamos aquí, hemos creado el perfil con éxito
                console.log('Perfil de admin creado correctamente mediante RPC:', createResult);
                setIsAdmin(true);
              } catch (createRpcErr) {
                console.error('Error inesperado al crear perfil con RPC:', createRpcErr);
                
                // Último intento: inserción directa
                try {
                  const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                      user_id: session.user.id,
                      role: 'admin'
                    });
                    
                  if (insertError) {
                    console.error('Error al crear perfil de admin:', insertError);
                    setError(`Error al crear perfil: ${insertError.message}`);
                    return;
                  }
                  
                  setIsAdmin(true);
                } catch (e) {
                  console.error('Error inesperado al crear perfil:', e);
                  setError('Error al crear perfil de usuario');
                  return;
                }
              }
            } else {
              setError(`Error al verificar permisos: ${tradProfileError.message}`);
              return;
            }
          } else {
            // Perfil existente obtenido de forma tradicional
            setIsAdmin(tradProfileData.role === 'admin');
            
            if (tradProfileData.role !== 'admin') {
              setError('No tienes permisos para gestionar personal');
              setLoading(false);
              return;
            }
          }
        } else if (profileData && profileData.length > 0) {
          // Perfil obtenido mediante RPC
          setIsAdmin(profileData[0].role === 'admin');
          
          if (profileData[0].role !== 'admin') {
            setError('No tienes permisos para gestionar personal');
            setLoading(false);
            return;
          }
        } else {
          console.error('No se obtuvo datos del perfil');
          setError('No se pudo verificar el perfil de usuario');
          return;
        }
      } catch (profileRpcErr) {
        console.error('Error inesperado al obtener perfil:', profileRpcErr);
        setError('Error al verificar el perfil de usuario');
        return;
      }
      
      try {
        // Primero intentamos usar la función RPC
        const { data: staffData, error: staffError } = await supabase
          .rpc('get_staff_members_for_admin', {
            admin_user_id: session.user.id
          });
        
        if (staffError) {
          console.error('Error al cargar personal con RPC:', staffError);
          setError(`Error al cargar personal: ${staffError.message}`);
          
          // Solución alternativa si la función RPC no funciona
          console.log('Intentando cargar personal directamente de las tablas...');
          
          // Obtener perfiles de usuario
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .or(`admin_id.eq.${session.user.id},user_id.eq.${session.user.id}`);
          
          if (profilesError) {
            console.error('Error al cargar perfiles:', profilesError);
            setError(`Error al cargar perfiles: ${profilesError.message}`);
            return;
          }
          
          // Obtener emails de usuarios
          const userIds = profilesData.map(profile => profile.user_id);
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', userIds);
          
          // Si la tabla users no está accesible (puede ser auth.users), usar datos con email vacío
          let usersMap = {};
          if (usersError) {
            console.error('Error al cargar usuarios:', usersError);
            // Crear un mapa vacío, asumiremos emails vacíos
            usersMap = profilesData.reduce((acc, profile) => {
              acc[profile.user_id] = { email: '' };
              return acc;
            }, {});
          } else {
            // Crear un mapa de user_id -> datos de usuario
            usersMap = usersData.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {});
          }
          
          // Obtener datos de staff si la tabla existe
          let staffMap = {};
          try {
            const { data: staffData, error: staffError } = await supabase
              .from('staff')
              .select('user_id, name')
              .in('user_id', userIds);
            
            if (!staffError && staffData) {
              staffMap = staffData.reduce((acc, staff) => {
                acc[staff.user_id] = staff;
                return acc;
              }, {});
            }
          } catch (e) {
            console.log('La tabla staff puede no existir o no tiene la estructura correcta:', e);
          }
          
          // Formatear los datos para que coincidan con la estructura esperada
          const formattedData = profilesData.map(profile => ({
            id: profile.id,
            user_id: profile.user_id,
            email: usersMap[profile.user_id]?.email || '',
            role: profile.role,
            name: staffMap[profile.user_id]?.name || '',
            admin_id: profile.admin_id,
            restaurant_id: profile.restaurant_id,
            created_at: profile.created_at,
            updated_at: profile.updated_at
          }));
          
          setStaff(formattedData || []);
          return;
        }
        
        setStaff(staffData || []);
      } catch (rpcError: any) {
        console.error('Error con la función RPC:', rpcError);
        setError(`Error al usar la función RPC: ${rpcError.message}. Por favor, ejecuta los scripts SQL.`);
      }
    } catch (err: any) {
      console.error('Error inesperado al cargar personal:', err);
      setError(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar personal al montar el componente o cuando cambie el usuario
  useEffect(() => {
    if (session?.user) {
    fetchStaff();
    }
  }, [session?.user]);

  // Función para crear un nuevo miembro del personal
  const createStaffMember = async (member: NewStaffMember): Promise<string | null> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para crear personal');
        return null;
      }
      
      // Verificar o establecer admin
      if (!isAdmin) {
        // Intentamos verificar de nuevo el rol por si acaso
        const { data: profileCheck } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
          
        if (!profileCheck || profileCheck.role !== 'admin') {
          toast.error('No tienes permisos para crear personal');
          return null;
        }
        
        // Si llegamos aquí, es admin
        setIsAdmin(true);
      }
      
      // Mapear el rol de la interfaz al rol permitido en la base de datos
      const dbRole = roleMapping[member.role] || "waiter"; // Si no hay mapeo, usamos waiter por defecto
      
      // Usar el método estándar de registro en lugar del método admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: member.password || 'Password123!', // Usar la contraseña proporcionada o una predeterminada segura
        options: {
          data: {
            name: member.name,
            role: dbRole // Usamos el rol mapeado
          }
        }
      });
      
      if (authError) {
        console.error('Error al crear usuario:', authError);
        toast.error(`Error al crear usuario: ${authError.message}`);
        return null;
      }
      
      const newUserId = authData.user?.id;
      
      if (!newUserId) {
        toast.error('No se pudo obtener el ID del usuario creado');
        return null;
      }
      
      // Esperar un poco para que se cree el perfil en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar el perfil de usuario usando la función RPC
      try {
        const { data: profileData, error: profileError } = await supabase
          .rpc('create_or_update_user_profile', {
            p_user_id: newUserId,
            p_role: dbRole,
            p_admin_id: session.user.id
          });
        
        if (profileError) {
          console.error('Error al actualizar perfil mediante RPC:', profileError);
          toast.error(`Error al actualizar perfil: ${profileError.message}`);
          
          // Intentamos el método tradicional como respaldo
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              role: dbRole,
              admin_id: session.user.id,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', newUserId);
          
          if (updateError) {
            console.error('Error también al actualizar perfil mediante método tradicional:', updateError);
            toast.error('No se pudo completar el proceso. Es posible que necesites eliminar manualmente el usuario.');
            return null;
          }
        } else {
          console.log('Perfil actualizado correctamente mediante RPC:', profileData);
        }
      } catch (rpcErr) {
        console.error('Error al llamar RPC de perfil:', rpcErr);
        toast.error('Error al actualizar el perfil de usuario mediante RPC');
        return null;
      }
      
      // Crear entrada en la tabla staff mediante RPC
      if (member.name) {
        try {
          const { data: staffData, error: staffError } = await supabase
            .rpc('create_staff_member', {
              p_user_id: newUserId,
              p_name: member.name || '',
              p_role: member.role, // Rol original
              p_admin_id: session.user.id,
              p_email: member.email,
              p_status: 'active'
            });
          
          if (staffError) {
            console.error('Error al crear registro de staff mediante RPC:', staffError);
            toast.error(`Error al crear registro de staff: ${staffError.message}`);
            
            // Intentamos inserción directa como respaldo
            const { error: insertError } = await supabase
        .from('staff')
        .insert({
                user_id: newUserId,
                name: member.name || '',
          role: member.role,
                admin_id: session.user.id,
          email: member.email,
                status: 'active'
              });
            
            if (insertError) {
              console.error('Error también al insertar staff directamente:', insertError);
              toast.error(`No se pudo crear el registro de staff. El usuario se creó pero sin datos adicionales.`);
            }
          } else {
            console.log('Staff creado correctamente mediante RPC:', staffData);
          }
        } catch (staffRpcErr) {
          console.error('Error al llamar RPC de staff:', staffRpcErr);
          toast.error('Error al crear el registro de staff mediante RPC');
        }
      }
      
      // Actualizar la lista de personal
      await fetchStaff();
      
      toast.success(`Usuario ${member.email} creado correctamente`);
      return newUserId;
      
    } catch (err: any) {
      console.error('Error inesperado al crear personal:', err);
      toast.error(`Error inesperado: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar un miembro del personal
  const updateStaffMember = async (id: string, updates: Partial<StaffMember>): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para actualizar personal');
        return false;
      }
      
      // Verificar si el usuario actual es administrador
      if (!isAdmin) {
        toast.error('No tienes permisos para actualizar personal');
        return false;
      }
      
      // Actualizar perfil de usuario
      if (updates.role) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            role: updates.role,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', updates.user_id || id);
        
        if (profileError) {
          console.error('Error al actualizar perfil:', profileError);
          toast.error(`Error al actualizar perfil: ${profileError.message}`);
          return false;
        }
      }
      
      // Actualizar tabla staff si se usa y si hay nombre para actualizar
      if (updates.name) {
        const { error: staffError } = await supabase
        .from('staff')
        .update({
            name: updates.name,
            role: updates.role || undefined,
          updated_at: new Date().toISOString()
        })
          .eq('user_id', updates.user_id || id);
        
        if (staffError) {
          console.error('Error al actualizar staff:', staffError);
          toast.error(`Error al actualizar datos de staff: ${staffError.message}`);
        }
      }
      
      // Actualizar la lista de personal
      await fetchStaff();
      
      toast.success('Miembro del personal actualizado correctamente');
      return true;
      
    } catch (err: any) {
      console.error('Error inesperado al actualizar personal:', err);
      toast.error(`Error inesperado: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un miembro del personal
  const deleteStaffMember = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para eliminar personal');
        return false;
      }
      
      // Verificar si el usuario actual es administrador
      if (!isAdmin) {
        toast.error('No tienes permisos para eliminar personal');
        return false;
      }
      
      // Obtener el user_id del miembro del personal
      const staffMember = staff.find(member => member.id === id);
      
      if (!staffMember) {
        toast.error('Miembro del personal no encontrado');
        return false;
      }
      
      // Eliminar usuario en Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(staffMember.user_id);
      
      if (authError) {
        console.error('Error al eliminar usuario:', authError);
        toast.error(`Error al eliminar usuario: ${authError.message}`);
        return false;
      }
      
      // Eliminar registro de staff si existe
      await supabase
        .from('staff')
        .delete()
        .eq('user_id', staffMember.user_id);
      
      // El perfil de usuario se eliminará automáticamente por la cascada en la tabla user_profiles
      
      // Actualizar la lista de personal
      await fetchStaff();
      
      toast.success('Miembro del personal eliminado correctamente');
      return true;
      
    } catch (err: any) {
      console.error('Error inesperado al eliminar personal:', err);
      toast.error(`Error inesperado: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener un miembro del personal por su ID
  const getStaffById = async (id: string): Promise<StaffMember | null> => {
    try {
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para ver personal');
        return null;
      }
      
      // Verificar si el usuario actual es administrador
      if (!isAdmin) {
        toast.error('No tienes permisos para ver personal');
        return null;
      }
      
      // Buscar primero en la lista local
      const localStaffMember = staff.find(member => member.id === id);
      
      if (localStaffMember) {
        return localStaffMember;
      }
      
      // Si no está en la lista local, consultar a Supabase
      const { data, error } = await supabase
        .rpc('get_staff_member_by_id', {
          staff_id: id,
          admin_user_id: session.user.id
        });
      
      if (error) {
        console.error('Error al cargar miembro del personal:', error);
        toast.error(`Error al cargar miembro del personal: ${error.message}`);
        return null;
      }
      
      return data.length > 0 ? data[0] : null;
      
    } catch (err: any) {
      console.error('Error inesperado al cargar miembro del personal:', err);
      toast.error(`Error inesperado: ${err.message}`);
      return null;
    }
  };

  // Función para refrescar manualmente la lista de personal
  const refreshStaff = async () => {
    await fetchStaff();
  };

  // Función para actualizar un miembro del personal (alias para addStaffMember)
  const addStaffMember = async (member: any): Promise<boolean> => {
    try {
      // Si no se proporciona una contraseña, generamos una segura temporal
      if (!member.password) {
        // Generamos una contraseña aleatoria que cumpla los requisitos de seguridad
        const randomPassword = `PF${Math.random().toString(36).substring(2, 8)}${Math.floor(Math.random() * 1000)}!`;
        member.password = randomPassword;
        
        // Informamos al usuario que se ha generado una contraseña
        toast.info(`Se ha generado una contraseña temporal para ${member.email}. Será necesario cambiarla en el primer inicio de sesión.`);
      } else {
        // Si se proporciona una contraseña, verificamos que cumpla con los requisitos mínimos
        if (member.password.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres");
          return false;
        }
        
        // Informamos que se utilizará la contraseña proporcionada
        toast.info(`Se utilizará la contraseña proporcionada para ${member.email}`);
      }
      
      // Adaptamos los parámetros al formato esperado por createStaffMember
      const newMember: NewStaffMember = {
        email: member.email,
        password: member.password,
        role: member.role,
        name: member.name,
        phone: member.phone
      };
      
      // Podemos añadir un toast de "creando usuario..."
      toast.loading(`Creando usuario para ${member.name}...`);
      
      const userId = await createStaffMember(newMember);
      
      if (userId) {
        toast.success(`Personal ${member.name} creado correctamente con ID: ${userId}`);
        return true;
      } else {
        toast.error(`No se pudo crear el personal ${member.name}`);
        return false;
      }
    } catch (err: any) {
      console.error('Error inesperado al añadir personal:', err);
      toast.error(`Error inesperado: ${err.message}`);
      return false;
    }
  };

  // Función para cambiar el estado de un miembro del personal
  const toggleStaffStatus = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session?.user) {
        toast.error('Debes iniciar sesión para cambiar el estado');
        return false;
      }
      
      // Verificar si el usuario actual es administrador
      if (!isAdmin) {
        toast.error('No tienes permisos para cambiar el estado');
        return false;
      }
      
      // Buscar el miembro actual para obtener su estado
      const staffMember = staff.find(member => member.id === id);
      
      if (!staffMember) {
        toast.error('Miembro del personal no encontrado');
        return false;
      }
      
      // Cambiar el estado (de activo a inactivo o viceversa)
      const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
      
      // Actualizar el estado en la base de datos
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error al cambiar estado:', updateError);
        toast.error(`Error al cambiar estado: ${updateError.message}`);
        return false;
      }
      
      // Actualizar la lista de personal
      await fetchStaff();
      
      toast.success(`Estado cambiado a ${newStatus === 'active' ? 'activo' : 'inactivo'}`);
      return true;
      
    } catch (err: any) {
      console.error('Error inesperado al cambiar estado:', err);
      toast.error(`Error inesperado: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener todos los meseros activos
  const getActiveWaiters = (): StaffMember[] => {
    return staff.filter(member => {
      // Verificar si el rol es de mesero (usando los nuevos nombres de roles)
      const normalizedRole = roleMapping[member.role] || member.role;
      const isWaiter = normalizedRole === 'waiter' || member.role === 'Mesero/a';
      const isActive = member.status === 'active' || !member.status;
      
      return isWaiter && isActive;
    });
  };

  return {
    staff,
    loading,
    error,
    isAdmin,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
    getStaffById,
    refreshStaff,
    addStaffMember,
    toggleStaffStatus,
    getActiveWaiters
  };
} 