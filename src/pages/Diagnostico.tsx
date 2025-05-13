import DiagnosticoTablas from '@/components/DiagnosticoTablas';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DiagnosticoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Diagnóstico del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Esta página ayuda a verificar si la solución al problema de visibilidad de mesas se ha implementado correctamente.
            Podrás ver las mesas visibles para tu usuario, si tienen asignado correctamente el campo admin_id, y también crear
            una mesa de prueba para verificar que las nuevas mesas se crean con la configuración correcta.
          </p>
        </div>
        
        <DiagnosticoTablas />
      </div>
    </div>
  );
} 