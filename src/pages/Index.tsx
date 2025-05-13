import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-restaurant-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-restaurant-secondary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full py-6 px-8 flex justify-between items-center backdrop-blur-sm bg-white/50 sticky top-0 z-50"
      >
        <h1 className="text-2xl font-semibold text-restaurant-dark">
          Plate<span className="text-restaurant-primary">Perfect</span>
        </h1>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/dashboard" className="text-restaurant-dark hover:text-restaurant-primary transition-colors font-medium">
                Demo
              </Link>
            </li>
            <li>
              <Link to="/" className="text-restaurant-dark hover:text-restaurant-primary transition-colors font-medium">
                Características
              </Link>
            </li>
            <li>
              <Link to="/" className="text-restaurant-dark hover:text-restaurant-primary transition-colors font-medium">
                Precios
              </Link>
            </li>
            <li>
              <Link to="/" className="text-restaurant-dark hover:text-restaurant-primary transition-colors font-medium">
                Contacto
              </Link>
            </li>
          </ul>
        </nav>
      </motion.header>

      {/* Hero */}
      <main className="flex-1 flex flex-col md:flex-row">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16"
        >
          <div className="inline-block">
            <span className="bg-restaurant-primary/10 text-restaurant-primary px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
              ¡Nuevo! Versión 2.0 disponible
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-restaurant-dark leading-tight">
            Administre su restaurante con <span className="text-restaurant-primary">facilidad</span>
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-md leading-relaxed">
            Una plataforma completa para la gestión de restaurantes: mesas, pedidos, personal e inventario todo en un solo lugar.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/dashboard">
                <Button className="bg-restaurant-primary hover:bg-restaurant-primary/90 text-white px-8 py-6 rounded-lg flex items-center text-base shadow-lg shadow-restaurant-primary/25">
                  Comencemos
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="px-8 py-6 rounded-lg border-2 border-restaurant-dark text-restaurant-dark text-base hover:bg-restaurant-dark hover:text-white transition-colors">
                Solicitar información
              </Button>
            </motion.div>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-restaurant-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-restaurant-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-restaurant-dark text-lg">Gestión de mesas</h3>
              <p className="text-sm text-muted-foreground mt-2">Visualice y administre sus mesas fácilmente</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-restaurant-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-restaurant-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-restaurant-dark text-lg">Pedidos en tiempo real</h3>
              <p className="text-sm text-muted-foreground mt-2">Coordine cocina y servicio sin problemas</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-restaurant-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-restaurant-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-restaurant-dark text-lg">Analítica detallada</h3>
              <p className="text-sm text-muted-foreground mt-2">Informes y métricas para optimizar su negocio</p>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full md:w-1/2 bg-restaurant-light p-8 flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-restaurant-primary/5 to-restaurant-accent/5" />
          <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-restaurant-accent/20">
              <div className="p-6">
                <div className="flex justify-between mb-6">
                  <div className="w-32 h-8 bg-restaurant-primary/20 rounded-lg animate-pulse"></div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-restaurant-secondary/20 rounded-full"></div>
                    <div className="w-8 h-8 bg-restaurant-secondary/20 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="h-24 bg-white/80 rounded-lg shadow-sm"></div>
                  <div className="h-24 bg-white/80 rounded-lg shadow-sm"></div>
                  <div className="h-24 bg-white/80 rounded-lg shadow-sm"></div>
                </div>
                
                <div className="h-32 bg-white/80 rounded-lg shadow-sm w-full mb-4"></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-white/80 rounded-lg shadow-sm"></div>
                  <div className="h-24 bg-white/80 rounded-lg shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
