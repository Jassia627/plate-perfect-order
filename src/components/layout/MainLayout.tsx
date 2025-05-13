import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ProtectedRoute from "./ProtectedRoute";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type MainLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

const MainLayout = ({ children, title, subtitle, actions }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Detectar tamaño de pantalla y cerrar sidebar automáticamente en móviles
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Comprobar al cargar
    checkScreenSize();
    
    // Comprobar al cambiar tamaño de ventana
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background relative">
        {/* Sidebar móvil con overlay */}
        <div 
          className={`md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-200 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`fixed md:relative z-30 h-full transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title={title} 
            subtitle={subtitle} 
            actions={actions}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            showMenuButton={!sidebarOpen}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MainLayout;
