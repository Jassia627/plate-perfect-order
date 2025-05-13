import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Database, Loader2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initializeDatabase, getCreateTablesSql, createSampleData } from '@/integrations/supabase/setup';

interface DatabaseInitializerProps {
  children: React.ReactNode;
}

export function DatabaseInitializer({ children }: DatabaseInitializerProps) {
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [hasTablesError, setHasTablesError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Verificar si las tablas existen
  useEffect(() => {
    async function checkTables() {
      try {
        setIsChecking(true);
        const databaseReady = await initializeDatabase();
        setHasTablesError(!databaseReady);
      } catch (error) {
        console.error('Error al verificar tablas:', error);
        setHasTablesError(true);
      } finally {
        setIsChecking(false);
      }
    }
    
    checkTables();
  }, []);

  const createTablesManually = async () => {
    try {
      setIsInitializing(true);
      
      // Abrir el panel SQL de Supabase en una nueva pestaña
      window.open('https://supabase.com/dashboard/project/qszflpzaiyijwqlcmopv/sql', '_blank');
      
      // Copiar el SQL al portapapeles
      await navigator.clipboard.writeText(getCreateTablesSql());
      
      toast.success('SQL copiado al portapapeles', {
        description: 'Pega el SQL en el editor de Supabase y ejecútalo.'
      });
      
      // Mostrar instrucciones adicionales
      toast.info('Cuando hayas creado las tablas, regresa aquí', {
        duration: 8000,
        action: {
          label: 'Verificar',
          onClick: async () => {
            const databaseReady = await initializeDatabase();
            if (databaseReady) {
              setHasTablesError(false);
              toast.success('¡Tablas creadas correctamente!');
              // Crear datos de ejemplo
              await createSampleData();
              window.location.reload();
            } else {
              toast.error('Las tablas aún no existen');
            }
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ocurrió un error al copiar el SQL');
    } finally {
      setIsInitializing(false);
    }
  };
  
  const goToSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/qszflpzaiyijwqlcmopv', '_blank');
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h2 className="text-lg font-medium">Verificando base de datos...</h2>
          <p className="text-muted-foreground text-center mt-2">
            Estamos comprobando si tu base de datos está configurada correctamente.
          </p>
        </div>
      </div>
    );
  }

  if (hasTablesError) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Inicialización de Base de Datos
            </DialogTitle>
            <DialogDescription>
              Es necesario crear las tablas en la base de datos para poder utilizar la aplicación.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Base de datos no configurada</AlertTitle>
              <AlertDescription>
                No se encontraron las tablas necesarias en tu proyecto de Supabase. 
                Necesitas crear las tablas 'tables' y 'reservations' para continuar.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Sigue estos pasos:</p>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Haz clic en <b>Crear Tablas</b> a continuación</li>
                <li>Se abrirá el editor SQL de Supabase y se copiará el código necesario</li>
                <li>Pega el código en el editor y ejecútalo</li>
                <li>Regresa a esta ventana y haz clic en Verificar</li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-md overflow-auto max-h-40 text-xs relative">
              <button 
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-accent"
                onClick={() => {
                  navigator.clipboard.writeText(getCreateTablesSql());
                  toast.success('SQL copiado al portapapeles');
                }}
              >
                <Copy className="h-4 w-4" />
              </button>
              <pre className="whitespace-pre-wrap">
                {getCreateTablesSql()}
              </pre>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={goToSupabaseDashboard}
            >
              Ir al Panel de Supabase
            </Button>
            
            <Button
              onClick={createTablesManually}
              disabled={isInitializing}
              className="relative"
            >
              {isInitializing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Crear Tablas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}

export default DatabaseInitializer; 