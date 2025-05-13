
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-100">
      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-restaurant-dark">
          Plate<span className="text-restaurant-primary">Perfect</span>
        </h1>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/dashboard" className="text-restaurant-dark hover:text-restaurant-primary transition-colors">
                Demo
              </Link>
            </li>
            <li>
              <Link to="/" className="text-restaurant-dark hover:text-restaurant-primary transition-colors">
                Características
              </Link>
            </li>
            <li>
              <Link to="/" className="text-restaurant-dark hover:text-restaurant-primary transition-colors">
                Precios
              </Link>
            </li>
            <li>
              <Link to="/" className="text-restaurant-dark hover:text-restaurant-primary transition-colors">
                Contacto
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16">
          <h2 className="text-4xl md:text-5xl font-bold text-restaurant-dark">
            Administre su restaurante con facilidad
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-md">
            Una plataforma completa para la gestión de restaurantes: mesas, pedidos, personal e inventario todo en un solo lugar.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/dashboard">
              <Button className="bg-restaurant-primary hover:bg-restaurant-primary/90 text-white px-8 py-6 rounded-lg flex items-center text-base">
                comencemos
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="px-8 py-6 rounded-lg border-restaurant-dark text-restaurant-dark text-base">
              Solicitar información
            </Button>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-restaurant-dark">Gestión de mesas</h3>
              <p className="text-sm text-muted-foreground mt-1">Visualice y administre sus mesas fácilmente</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-restaurant-dark">Pedidos en tiempo real</h3>
              <p className="text-sm text-muted-foreground mt-1">Coordine cocina y servicio sin problemas</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-restaurant-dark">Analítica detallada</h3>
              <p className="text-sm text-muted-foreground mt-1">Informes y métricas para optimizar su negocio</p>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-restaurant-light p-8 flex items-center justify-center">
          <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-restaurant-accent/20">
              <div className="p-6">
                <div className="flex justify-between mb-6">
                  <div className="w-32 h-8 bg-restaurant-primary/20 rounded"></div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-restaurant-secondary/20 rounded-full"></div>
                    <div className="w-8 h-8 bg-restaurant-secondary/20 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="h-24 bg-white/80 rounded shadow-sm"></div>
                  <div className="h-24 bg-white/80 rounded shadow-sm"></div>
                  <div className="h-24 bg-white/80 rounded shadow-sm"></div>
                </div>
                
                <div className="h-32 bg-white/80 rounded shadow-sm w-full mb-4"></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-white/80 rounded shadow-sm"></div>
                  <div className="h-24 bg-white/80 rounded shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
