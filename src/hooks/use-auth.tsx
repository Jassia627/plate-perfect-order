import { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDatabaseRole, FrontendRole, getRoleDisplayName } from '@/lib/roles';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{user: User | null, session: Session | null} | null>;
  signOut: () => Promise<void>;
  registerStaffMember: (email: string, password: string, name: string, role: string, phone: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configurar el listener para cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Verificar si ya hay una sesión activa
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Error de inicio de sesión:', error);
        
        // Mensajes de error más descriptivos basados en el código
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciales inválidas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email no confirmado. Por favor revisa tu correo y confirma tu cuenta.');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        console.log('Inicio de sesión exitoso:', data);
      }
    } catch (err) {
      console.error('Error completo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<{user: User | null, session: Session | null} | null> => {
    try {
      setLoading(true);
      setError(null);
      // Registrar como administrador automáticamente
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: email.split('@')[0], // Usar parte del correo como nombre
            role: "admin" // Asignar rol de administrador por defecto
          }
        }
      });
      
      if (error) {
        console.error('Error de registro:', error);
        setError(`Error: ${error.message}`);
        return null;
      } else {
        console.log('Registro exitoso:', data);
        // Verificar si es necesario confirmar el correo electrónico
        if (data?.user?.identities?.length === 0) {
          setError('Este correo ya está registrado. Intenta iniciar sesión.');
          return null;
        } else if (data?.user?.confirmed_at) {
          toast.success('Cuenta de administrador creada con éxito. Ahora puedes iniciar sesión.');
          setError('Registro exitoso. Ahora puedes iniciar sesión.');
        } else {
          toast.info('Revisa tu correo para confirmar tu cuenta de administrador.');
          setError('Registro exitoso. Por favor, revisa tu correo para confirmar tu cuenta antes de iniciar sesión.');
        }
        
        // Devolver los datos del usuario creado
        return {
          user: data.user,
          session: data.session
        };
      }
    } catch (err) {
      console.error('Error completo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al registrarse');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar un nuevo miembro del personal con cuenta de acceso
  const registerStaffMember = async (email: string, password: string, name: string, role: string, phone: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Convertir el rol del frontend al formato de la base de datos
      const dbRole = getDatabaseRole(role as FrontendRole);
      
      // Verificar si el miembro ya existe en la tabla staff
      const { data: existingStaffList, error: searchError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', email);
      
      if (searchError) {
        console.error('Error al buscar miembro existente:', searchError);
        toast.error(`Error al verificar usuario: ${searchError.message}`);
        setError(`Error al verificar usuario: ${searchError.message}`);
        return false;
      }
      
      // Determinamos si ya existe un miembro con ese email
      const existingStaff = existingStaffList && existingStaffList.length > 0 ? existingStaffList[0] : null;
      
      // Intentar iniciar sesión para verificar si el usuario ya existe
      let userId = null;
      
      try {
        // 1. Primero intentamos crear la cuenta de usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              name,
              role  // Guardar el rol original en metadata (se normalizará en la UI)
            }
          }
        });
        
        if (authError) {
          // Si el error es porque el usuario ya existe
          if (authError.message.includes('already registered')) {
            console.log('El usuario ya está registrado, obteniendo el ID...');
            
            // Para obtener el ID del usuario ya registrado, podemos usar admin APIs,
            // pero como no tenemos acceso, vamos a usar la información disponible
            
            // Verificar si ya tenemos un user_id en el registro de staff
            if (existingStaff && existingStaff.user_id) {
              userId = existingStaff.user_id;
              console.log('Usando el user_id existente en el registro de staff:', userId);
            } else {
              // Si no tenemos el user_id, avisamos al usuario que ya existe
              toast.warning(`El usuario ${email} ya está registrado en el sistema. Se actualizará su información de staff.`);
              
              // Intentamos un truco: enviar un restablecimiento de contraseña para confirmar que existe
              await supabase.auth.resetPasswordForEmail(email);
              toast.info(`Se ha enviado un correo a ${email} para restablecer la contraseña.`);
            }
          } else {
            // Si es otro tipo de error
            console.error('Error al crear cuenta de usuario:', authError);
            toast.error(`Error al crear cuenta: ${authError.message}`);
            setError(`Error al crear cuenta: ${authError.message}`);
            return false;
          }
        } else if (authData && authData.user) {
          // Si se creó correctamente el usuario
          userId = authData.user.id;
          console.log('Usuario creado correctamente con ID:', userId);
        } else {
          console.error('No se pudo crear el usuario y no se obtuvo error');
          toast.error('No se pudo crear el usuario');
          setError('No se pudo crear el usuario');
          return false;
        }
      } catch (authErr: any) {
        console.error('Error inesperado al crear usuario:', authErr);
        toast.error(`Error inesperado: ${authErr.message}`);
        return false;
      }
      
      // Si no pudimos obtener un userId, no podemos continuar con el registro en staff
      if (!userId && !existingStaff) {
        console.error('No se pudo obtener el ID de usuario y no hay registro de staff existente');
        toast.error('No se pudo completar el registro. Intente más tarde o contacte al administrador.');
        return false;
      }
      
      // 2. Si no existe en la tabla staff, crear el registro
      if (!existingStaff) {
        if (!userId) {
          toast.error('No se pudo obtener el ID de usuario para crear el registro de staff');
          return false;
        }
        
        // Intentar primero con la función RPC si existe
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('create_staff_member', {
              p_user_id: userId,
              p_name: name,
              p_role: dbRole,
              p_admin_id: user?.id || null,
              p_email: email,
              p_phone: phone,
              p_status: 'active'
            });
          
          if (rpcError) {
            console.warn('Error al usar RPC, intentando con insert directo:', rpcError);
            
            // Si falla la RPC, intentamos el insert directo
            const { error: staffError } = await supabase
              .from('staff')
              .insert([
                {
                  user_id: userId,
                  name,
                  role: dbRole,
                  admin_id: user?.id || null,
                  phone,
                  email,
                  status: 'active'
                }
              ]);
            
            if (staffError) {
              console.error('Error al registrar en tabla staff:', staffError);
              toast.error(`Error al registrar en tabla staff: ${staffError.message}`);
              setError(`Error al registrar en tabla staff: ${staffError.message}`);
              // No retornamos false aquí, porque la cuenta de Auth ya se creó correctamente
            }
          } else {
            console.log('Staff creado mediante RPC con éxito', rpcData);
          }
        } catch (rpcErr) {
          console.error('Error inesperado con RPC:', rpcErr);
          
          // Si hay un error con la RPC, intentamos el insert directo
          const { error: staffError } = await supabase
            .from('staff')
            .insert([
              {
                user_id: userId,
                name,
                role: dbRole,
                admin_id: user?.id || null,
                phone,
                email,
                status: 'active'
              }
            ]);
          
          if (staffError) {
            console.error('Error al registrar en tabla staff:', staffError);
            toast.error(`Error al registrar en tabla staff: ${staffError.message}`);
            setError(`Error al registrar en tabla staff: ${staffError.message}`);
          }
        }
      } else {
        // Si ya existe un registro en staff, actualizarlo
        const { error: updateError } = await supabase
          .from('staff')
          .update({
            user_id: userId || existingStaff.user_id, // Usar el nuevo ID si lo tenemos, o el existente
            name: name || existingStaff.name, // Actualizar el nombre si se proporciona
            role: dbRole || existingStaff.role, // Actualizar el rol normalizado si se proporciona
            admin_id: user?.id || existingStaff.admin_id, // Actualizar admin_id si tenemos un usuario actual
            phone: phone || existingStaff.phone, // Actualizar el teléfono si se proporciona
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStaff.id);
        
        if (updateError) {
          console.error('Error al actualizar registro existente:', updateError);
          toast.error(`Error al actualizar registro: ${updateError.message}`);
        } else {
          console.log('Registro de staff actualizado correctamente');
        }
      }
      
      // Esperar un poco para que se cree el perfil en la base de datos 
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar el perfil de usuario usando la función RPC
      try {
        const { data: profileData, error: profileError } = await supabase
          .rpc('create_or_update_user_profile', {
            p_user_id: userId,
            p_role: dbRole, // Actualizar con el rol normalizado
            p_admin_id: user?.id
          });
        
        if (profileError) {
          console.error('Error al actualizar perfil mediante RPC:', profileError);
          // No mostrar error al usuario, intentar con método tradicional
          
          // Intentamos el método tradicional como respaldo
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              role: dbRole, // Actualizar con el rol normalizado
              admin_id: user?.id,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error también al actualizar perfil mediante método tradicional:', updateError);
            // No mostrar error al usuario para no confundirlo 
          }
        } else {
          console.log('Perfil actualizado correctamente mediante RPC:', profileData);
        }
      } catch (rpcErr) {
        console.error('Error al llamar RPC de perfil:', rpcErr);
        // No mostrar error al usuario para no confundirlo
      }
      
      // Mostrar mensaje de éxito con el nombre legible del rol
      const roleDisplayName = getRoleDisplayName(role);
      
      toast.success(`${name} ${existingStaff ? 'actualizado' : 'registrado'} correctamente como ${roleDisplayName}`);
      
      if (!existingStaff) {
        toast.info("El usuario debe verificar su correo electrónico para poder iniciar sesión");
      }
      
      return true;
    } catch (err: any) {
      console.error('Error completo al registrar miembro:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al registrar miembro';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      registerStaffMember,
      loading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
