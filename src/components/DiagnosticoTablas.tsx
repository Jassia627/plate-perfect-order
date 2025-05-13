import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function DiagnosticoTablas() {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const { session } = useAuth();

  const ejecutarDiagnostico = async () => {
    if (!session?.user) {
      alert('Debes iniciar sesión para ejecutar el diagnóstico');
      return;
    }

    setCargando(true);
    try {
      // 1. Obtenemos las mesas y verificamos si tienen admin_id
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('id, number, user_id, admin_id');

      if (tablesError) {
        throw new Error(`Error al obtener mesas: ${tablesError.message}`);
      }

      // 2. Verificamos el perfil del usuario actual
      const { data: perfil, error: perfilError } = await supabase
        .from('user_profiles')
        .select('role, admin_id')
        .eq('user_id', session.user.id)
        .single();

      if (perfilError && perfilError.code !== 'PGRST116') {
        throw new Error(`Error al obtener perfil: ${perfilError.message}`);
      }
      
      // 3. Obtenemos los usuarios que gestiona el usuario actual
      const { data: gestionados, error: gestionadosError } = await supabase
        .from('user_profiles')
        .select('user_id, role')
        .eq('admin_id', session.user.id);
        
      if (gestionadosError) {
        console.warn('Error al obtener usuarios gestionados:', gestionadosError);
      }
      
      // Crear un mapa de usuarios gestionados para fácil acceso
      const usuariosGestionados = new Map();
      gestionados?.forEach(u => usuariosGestionados.set(u.user_id, u.role));

      // 4. Verificamos las políticas de seguridad
      const { data: policies, error: policiesError } = await supabase
        .rpc('list_table_policies');

      if (policiesError) {
        console.warn('No se pudo obtener las políticas:', policiesError);
      }

      // Resultado del diagnóstico
      setDiagnostico({
        usuario: {
          id: session.user.id,
          email: session.user.email,
          rol: perfil?.role || 'No definido'
        },
        mesas: {
          total: tables.length,
          conAdminId: tables.filter(t => t.admin_id !== null).length,
          sinAdminId: tables.filter(t => t.admin_id === null).length,
          detalle: tables.map(t => {
            const esPropia = t.user_id === session.user.id;
            return {
              numero: t.number,
              user_id: t.user_id,
              admin_id: t.admin_id,
              esPropia,
              tieneAdminId: t.admin_id !== null,
              razonVisibilidad: calcularRazonVisibilidad(t.user_id, t.admin_id, session.user.id, usuariosGestionados)
            };
          })
        },
        usuariosGestionados: Array.from(usuariosGestionados.entries()).map(([id, rol]) => ({ id, rol })),
        politicas: policies || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      alert(`Error al ejecutar diagnóstico: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCargando(false);
    }
  };

  const crearMesaPrueba = async () => {
    if (!session?.user) {
      alert('Debes iniciar sesión para crear una mesa de prueba');
      return;
    }

    setCargando(true);
    try {
      // Encontrar el número más alto y añadir 1
      const { data: ultimaMesa, error: ultimaError } = await supabase
        .from('tables')
        .select('number')
        .order('number', { ascending: false })
        .limit(1)
        .single();

      const nuevoNumero = ultimaError ? 100 : (ultimaMesa.number + 1);

      // Crear mesa de prueba
      const { data, error } = await supabase
        .from('tables')
        .insert({
          number: nuevoNumero,
          capacity: 2,
          shape: 'circle',
          width: 60,
          height: 60,
          x: 100,
          y: 100,
          status: 'available',
          user_id: session.user.id,
          admin_id: session.user.id  // Explícitamente asignamos admin_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error al crear mesa de prueba: ${error.message}`);
      }

      alert(`Mesa de prueba #${data.number} creada con éxito. admin_id: ${data.admin_id || 'NO ASIGNADO'}`);
      ejecutarDiagnostico(); // Actualizar diagnóstico
    } catch (error) {
      console.error('Error al crear mesa:', error);
      alert(`Error al crear mesa de prueba: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCargando(false);
    }
  };

  // Función para determinar por qué el usuario puede ver una mesa
  const calcularRazonVisibilidad = (mesa_user_id: string, mesa_admin_id: string, user_id: string, gestionados: Map<string, string>) => {
    // Caso 1: Es el propietario de la mesa
    if (mesa_user_id === user_id) {
      return "Es tu mesa (eres el propietario)";
    }
    
    // Caso 2: Es el administrador de la mesa pero no el propietario
    if (mesa_admin_id === user_id && mesa_user_id !== user_id) {
      return "Eres el administrador de esta mesa";
    }
    
    // Caso 3: La mesa pertenece a un usuario que el usuario actual administra
    if (gestionados.has(mesa_user_id)) {
      return `Pertenece a un ${gestionados.get(mesa_user_id)} que administras`;
    }

    // Caso 4: Ambos son administradores (sin relación jerárquica directa)
    // En este caso, algo en las políticas RLS permite ver esta mesa
    if (mesa_user_id === mesa_admin_id) {
      return `Pertenece a otro administrador (ID: ${mesa_user_id.substring(0, 8)}...)`;
    }
    
    // Caso 5: No se puede determinar la razón exacta
    return `Razón desconocida (Revisar política RLS - Mesa del usuario ${mesa_user_id.substring(0, 8)}...)`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Diagnóstico de Mesas - Solución RLS</CardTitle>
      </CardHeader>
      <CardContent>
        {!diagnostico && !cargando && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Este componente verifica si se ha solucionado el problema de visibilidad de mesas.
              Haz clic en "Ejecutar Diagnóstico" para comprobar el estado actual.
            </AlertDescription>
          </Alert>
        )}

        {cargando && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {diagnostico && !cargando && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Usuario actual</h3>
              <p><strong>ID:</strong> {diagnostico.usuario.id}</p>
              <p><strong>Email:</strong> {diagnostico.usuario.email}</p>
              <p><strong>Rol:</strong> {diagnostico.usuario.rol}</p>
              
              {diagnostico.usuariosGestionados?.length > 0 && (
                <div className="mt-2">
                  <p><strong>Usuarios que administras:</strong> {diagnostico.usuariosGestionados.length}</p>
                  <ul className="text-sm text-gray-600 ml-4 list-disc">
                    {diagnostico.usuariosGestionados.map((u, i) => (
                      <li key={i}>{u.rol}: {u.id.substring(0, 8)}...</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Mesas visibles ({diagnostico.mesas.total})</h3>
              
              {diagnostico.mesas.sinAdminId > 0 ? (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Problemas detectados</AlertTitle>
                  <AlertDescription>
                    Se encontraron {diagnostico.mesas.sinAdminId} mesas sin admin_id asignado.
                    Esto puede causar problemas de visibilidad entre usuarios.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default" className="mb-4 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Todo correcto</AlertTitle>
                  <AlertDescription>
                    Todas las mesas tienen admin_id asignado correctamente.
                  </AlertDescription>
                </Alert>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">¿Es propia?</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">¿Tiene admin_id?</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">user_id</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">admin_id</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón visibilidad</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {diagnostico.mesas.detalle.map((mesa: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{mesa.numero}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mesa.esPropia ? (
                            <span className="text-green-500">Sí</span>
                          ) : (
                            <span className="text-blue-500">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mesa.tieneAdminId ? (
                            <span className="text-green-500">Sí</span>
                          ) : (
                            <span className="text-red-500">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mesa.user_id?.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mesa.admin_id ? mesa.admin_id.substring(0, 8) + '...' : 'NULL'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {mesa.razonVisibilidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={ejecutarDiagnostico} 
          disabled={cargando}>
          {cargando ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={crearMesaPrueba} 
          disabled={cargando}>
          Crear Mesa de Prueba
        </Button>
      </CardFooter>
    </Card>
  );
} 