import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export const SettingsDebug = () => {
  const { session } = useAuth();
  const [name, setName] = useState('PlatePerfect Test');
  const [phone, setPhone] = useState('123-456-789');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<'restaurant' | 'billing'>('restaurant');

  // Datos para facturación
  const [companyName, setCompanyName] = useState('Empresa Test');
  const [taxId, setTaxId] = useState('B12345678');
  const [billingEmail, setBillingEmail] = useState('facturacion@test.com');
  const [billingAddress, setBillingAddress] = useState('Calle Facturación 123');

  // Función para probar la creación directa de un registro
  const testCreate = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Datos para la prueba
      const testData = {
        user_id: session.user.id,
        name: name,
        phone: phone,
        address: 'Dirección de prueba',
        description: 'Descripción de prueba',
        dark_mode: false,
        auto_print: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Datos para crear:', testData);

      // Eliminar registros existentes para evitar duplicados
      await supabase
        .from('restaurant_settings')
        .delete()
        .eq('user_id', session.user.id);

      // Crear nuevo registro
      const { data, error: insertError } = await supabase
        .from('restaurant_settings')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        toast.error(`Error al crear: ${insertError.message}`);
        console.error('Error al crear:', insertError);
      } else {
        setResults(data);
        toast.success('Registro creado correctamente');
        console.log('Registro creado:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para probar la actualización directa de un registro
  const testUpdate = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Primero obtenemos el registro existente
      const { data: existingRecord, error: fetchError } = await supabase
        .from('restaurant_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Registro no encontrado: ${fetchError.message}`);
        console.error('Error al buscar registro:', fetchError);
        return;
      }

      // Datos para actualizar
      const updateData = {
        name: name,
        phone: phone,
        updated_at: new Date().toISOString()
      };

      console.log('Datos para actualizar:', updateData);
      console.log('ID del registro:', existingRecord.id);

      // Actualizar registro
      const { data, error: updateError } = await supabase
        .from('restaurant_settings')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        toast.error(`Error al actualizar: ${updateError.message}`);
        console.error('Error al actualizar:', updateError);
      } else {
        setResults(data);
        toast.success('Registro actualizado correctamente');
        console.log('Registro actualizado:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar la estructura de la tabla
  const verifyTable = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Primero obtenemos los registros existentes
      const { data, error: fetchError } = await supabase
        .from('restaurant_settings')
        .select('*');

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Error al verificar: ${fetchError.message}`);
        console.error('Error al verificar tabla:', fetchError);
      } else {
        setResults({ table_data: data, count: data?.length || 0 });
        toast.success(`Verificación completada: ${data?.length || 0} registros`);
        console.log('Datos de la tabla:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para ejecutar el script SQL para crear las tablas
  const createTables = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Script SQL simplificado para crear la tabla restaurant_settings y billing_settings
      const createTablesSQL = `
        -- Primero creamos la tabla de restaurante
        CREATE TABLE IF NOT EXISTS public.restaurant_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id),
          name TEXT NOT NULL DEFAULT 'PlatePerfect',
          phone TEXT NOT NULL DEFAULT '912 345 678',
          address TEXT NOT NULL DEFAULT 'Calle Principal 123',
          description TEXT NOT NULL DEFAULT 'Restaurante de comida mediterránea',
          dark_mode BOOLEAN NOT NULL DEFAULT false,
          auto_print BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Ahora creamos la tabla de facturación
        CREATE TABLE IF NOT EXISTS public.billing_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id),
          company_name TEXT NOT NULL DEFAULT 'PlatePerfect Inc.',
          tax_id TEXT NOT NULL DEFAULT 'B12345678',
          billing_email TEXT NOT NULL DEFAULT 'billing@plateperfect.com',
          billing_address TEXT NOT NULL DEFAULT 'Calle Principal 123, 28001 Madrid',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;

      console.log('Ejecutando SQL para crear tablas');
      
      // Plan B: mostrar instrucciones para crear manualmente
      setResults({
        instrucciones: "Para crear las tablas manualmente, copia el SQL de abajo y ejecútalo en el editor SQL de Supabase",
        script_sql: `
-- Configuración del restaurante
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT 'PlatePerfect',
  phone TEXT NOT NULL DEFAULT '912 345 678',
  address TEXT NOT NULL DEFAULT 'Calle Principal 123, 28001 Madrid',
  description TEXT NOT NULL DEFAULT 'Restaurante de comida mediterránea',
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  auto_print BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas de seguridad para restaurant_settings
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias configuraciones de restaurante"
ON public.restaurant_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias configuraciones de restaurante"
ON public.restaurant_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias configuraciones de restaurante"
ON public.restaurant_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Configuración de facturación
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL DEFAULT 'PlatePerfect Inc.',
  tax_id TEXT NOT NULL DEFAULT 'B12345678',
  billing_email TEXT NOT NULL DEFAULT 'billing@plateperfect.com',
  billing_address TEXT NOT NULL DEFAULT 'Calle Principal 123, 28001 Madrid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas de seguridad para billing_settings
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias configuraciones de facturación"
ON public.billing_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias configuraciones de facturación"
ON public.billing_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias configuraciones de facturación"
ON public.billing_settings FOR UPDATE
USING (auth.uid() = user_id);`
      });
      
      toast.success('Instrucciones SQL generadas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para probar la creación directa de un registro de facturación
  const testCreateBilling = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Datos para la prueba
      const testData = {
        user_id: session.user.id,
        company_name: companyName,
        tax_id: taxId,
        billing_email: billingEmail,
        billing_address: billingAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Datos para crear facturación:', testData);

      // Eliminar registros existentes para evitar duplicados
      await supabase
        .from('billing_settings')
        .delete()
        .eq('user_id', session.user.id);

      // Crear nuevo registro
      const { data, error: insertError } = await supabase
        .from('billing_settings')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        toast.error(`Error al crear facturación: ${insertError.message}`);
        console.error('Error al crear facturación:', insertError);
      } else {
        setResults(data);
        toast.success('Registro de facturación creado correctamente');
        console.log('Registro de facturación creado:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar registros duplicados de facturación
  const cleanupDuplicateBillingRecords = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Obtenemos todos los registros para el usuario
      const { data: allRecords, error: fetchError } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Error al buscar registros: ${fetchError.message}`);
        console.error('Error al buscar registros:', fetchError);
        return;
      }

      if (!allRecords || allRecords.length <= 1) {
        toast.info('No hay registros duplicados para eliminar');
        setResults({ message: 'No hay registros duplicados', count: allRecords?.length || 0 });
        return;
      }

      // Mantener solo el registro más reciente
      const mostRecentRecord = allRecords[0];
      const recordsToDelete = allRecords.slice(1);
      const idsToDelete = recordsToDelete.map(record => record.id);

      console.log('Registro a mantener:', mostRecentRecord);
      console.log('Registros a eliminar:', recordsToDelete);

      // Eliminar los registros duplicados
      const { error: deleteError } = await supabase
        .from('billing_settings')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        setError(deleteError.message);
        toast.error(`Error al eliminar duplicados: ${deleteError.message}`);
        console.error('Error al eliminar duplicados:', deleteError);
      } else {
        setResults({ 
          message: `Se eliminaron ${recordsToDelete.length} registros duplicados`, 
          kept_record: mostRecentRecord,
          deleted_records: recordsToDelete
        });
        toast.success(`Se eliminaron ${recordsToDelete.length} registros duplicados`);
        console.log('Limpieza completada');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para probar la actualización directa de un registro de facturación
  const testUpdateBilling = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Primero obtenemos los registros existentes (sin usar .single())
      const { data: existingRecords, error: fetchError } = await supabase
        .from('billing_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Error al buscar registros de facturación: ${fetchError.message}`);
        console.error('Error al buscar registros de facturación:', fetchError);
        return;
      }

      if (!existingRecords || existingRecords.length === 0) {
        setError('No se encontraron registros de facturación');
        toast.error('No se encontraron registros de facturación');
        console.error('No hay registros de facturación');
        return;
      }

      // Si hay múltiples registros, usamos el más reciente
      const existingRecord = existingRecords[0];
      
      if (existingRecords.length > 1) {
        console.warn(`Se encontraron ${existingRecords.length} registros de facturación. Usando el más reciente.`);
        toast.warning(`Existen ${existingRecords.length} registros de facturación. Usa "Limpiar Duplicados" para resolver este problema.`);
      }

      // Datos para actualizar
      const updateData = {
        company_name: companyName,
        tax_id: taxId,
        billing_email: billingEmail,
        billing_address: billingAddress,
        updated_at: new Date().toISOString()
      };

      console.log('Datos para actualizar facturación:', updateData);
      console.log('ID del registro:', existingRecord.id);

      // Actualizar registro
      const { data, error: updateError } = await supabase
        .from('billing_settings')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        toast.error(`Error al actualizar facturación: ${updateError.message}`);
        console.error('Error al actualizar facturación:', updateError);
      } else {
        setResults(data);
        toast.success('Registro de facturación actualizado correctamente');
        console.log('Registro de facturación actualizado:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar la estructura de la tabla de facturación
  const verifyBillingTable = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Obtenemos los registros existentes
      const { data, error: fetchError } = await supabase
        .from('billing_settings')
        .select('*');

      if (fetchError) {
        setError(fetchError.message);
        toast.error(`Error al verificar facturación: ${fetchError.message}`);
        console.error('Error al verificar tabla de facturación:', fetchError);
      } else {
        setResults({ table_data: data, count: data?.length || 0 });
        toast.success(`Verificación de facturación completada: ${data?.length || 0} registros`);
        console.log('Datos de la tabla de facturación:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error inesperado');
      console.error('Error inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Depuración de Configuraciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-b mb-4">
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === 'restaurant' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('restaurant')}
              >
                Restaurante
              </Button>
              <Button 
                variant={activeTab === 'billing' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('billing')}
              >
                Facturación
              </Button>
            </div>
          </div>

          {activeTab === 'restaurant' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={testCreate} 
                  disabled={loading}
                  variant="secondary"
                >
                  Crear Configuración
                </Button>
                <Button 
                  onClick={testUpdate} 
                  disabled={loading}
                  variant="outline"
                >
                  Actualizar Configuración
                </Button>
                <Button 
                  onClick={verifyTable} 
                  disabled={loading}
                  variant="ghost"
                >
                  Verificar Tabla
                </Button>
                <Button 
                  onClick={createTables} 
                  disabled={loading}
                  variant="destructive"
                >
                  Crear Tablas
                </Button>
              </div>
            </>
          )}

          {activeTab === 'billing' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nombre de empresa</Label>
                  <Input 
                    id="company-name" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">CIF/NIF</Label>
                  <Input 
                    id="tax-id" 
                    value={taxId} 
                    onChange={(e) => setTaxId(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-email">Email facturación</Label>
                  <Input 
                    id="billing-email" 
                    value={billingEmail} 
                    onChange={(e) => setBillingEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-address">Dirección facturación</Label>
                  <Input 
                    id="billing-address" 
                    value={billingAddress} 
                    onChange={(e) => setBillingAddress(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex space-x-4 flex-wrap">
                <Button 
                  onClick={testCreateBilling} 
                  disabled={loading}
                  variant="secondary"
                >
                  Crear Facturación
                </Button>
                <Button 
                  onClick={testUpdateBilling} 
                  disabled={loading}
                  variant="outline"
                >
                  Actualizar Facturación
                </Button>
                <Button 
                  onClick={verifyBillingTable} 
                  disabled={loading}
                  variant="ghost"
                >
                  Verificar Tabla
                </Button>
                <Button 
                  onClick={cleanupDuplicateBillingRecords} 
                  disabled={loading}
                  variant="destructive"
                  className="mt-2 sm:mt-0"
                >
                  Limpiar Duplicados
                </Button>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {results && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="font-medium">Resultados:</p>
              <pre className="text-xs overflow-auto mt-2">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 