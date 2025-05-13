import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const AddCurrencyColumn = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'automatic' | 'manual'>('automatic');

  const addCurrencyColumn = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Usar SQL directo para añadir la columna
      const { error } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';`
      });

      if (error) {
        console.error('Error al añadir columna currency:', error);
        setResult(`Error: ${error.message}`);
        toast.error(`Error al añadir columna currency: ${error.message}`);
      } else {
        console.log('Columna currency añadida correctamente');
        setResult('Columna currency añadida correctamente. Por favor, recarga la página.');
        toast.success('Columna currency añadida correctamente');
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setResult(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('Error inesperado al añadir columna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-red-600">Error en la base de datos</CardTitle>
        <CardDescription>
          Se detectó que falta la columna 'currency' en la tabla 'restaurant_settings'.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'automatic' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automatic">Solución automática</TabsTrigger>
            <TabsTrigger value="manual">Solución manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="automatic" className="space-y-4 mt-4">
            <p>Intenta añadir automáticamente la columna necesaria a la base de datos.</p>
            
            <Button 
              onClick={addCurrencyColumn} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Añadiendo columna...' : 'Añadir columna currency'}
            </Button>
            
            {result && (
              <div className={`p-3 rounded text-sm ${result.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {result}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4 mt-4">
            <p>Si la solución automática no funciona, sigue estos pasos manuales:</p>
            
            <ol className="list-decimal pl-5 space-y-2">
              <li>Inicia sesión en tu <a href="https://supabase.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">cuenta de Supabase</a></li>
              <li>Ve a tu proyecto</li>
              <li>Abre la sección "SQL Editor"</li>
              <li>Crea un nuevo script con el siguiente contenido:</li>
            </ol>
            
            <div className="bg-gray-100 p-3 rounded-md">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
              </pre>
            </div>
            
            <ol className="list-decimal pl-5 space-y-2" start={5}>
              <li>Ejecuta el script</li>
              <li>Recarga esta página</li>
            </ol>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AddCurrencyColumn; 