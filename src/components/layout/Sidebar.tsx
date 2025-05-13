import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Calendar, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  Menu as MenuIcon,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  UtensilsCrossed,
  Shield,
  CreditCard,
  Bug,
  X
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { normalizeRole, getRoleDisplayName, FrontendRole } from "@/lib/roles";

type SidebarProps = {
  onClose?: () => void; // Nueva propiedad para cerrar el sidebar en móviles
};

type SidebarItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  roles: FrontendRole[]; // Roles que pueden ver este elemento
};

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: Home,
    roles: ["admin", "mesero", "cajero", "cocina"]
  },
  {
    title: "Mesas",
    path: "/tables",
    icon: Calendar,
    roles: ["admin", "mesero"]
  },
  {
    title: "Pedidos",
    path: "/orders",
    icon: ShoppingCart,
    roles: ["admin", "mesero", "cocina", "cajero"]
  },
  {
    title: "Caja",
    path: "/cashier",
    icon: CreditCard,
    roles: ["admin", "cajero"]
  },
  {
    title: "Menú",
    path: "/menu",
    icon: UtensilsCrossed,
    roles: ["admin"]
  },
  {
    title: "Personal",
    path: "/staff",
    icon: Users,
    roles: ["admin"]
  },
  {
    title: "Informes",
    path: "/reports",
    icon: FileText,
    roles: ["admin", "cajero"]
  },
  {
    title: "Configuración",
    path: "/settings",
    icon: Settings,
    roles: ["admin"]
  },
  {
    title: "Diagnóstico",
    path: "/diagnostico",
    icon: Bug,
    roles: ["admin"]
  },
];

const Sidebar = ({ onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  // Determinar si estamos en móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Recuperar el estado colapsado del sidebar desde localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);
  
  // Guardar el estado colapsado cuando cambia
  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
  };

  // Manejar cierre de sesión
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Has cerrado sesión correctamente");
      navigate('/auth');
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  // Obtener el rol del usuario y normalizarlo
  const rawUserRole = user?.user_metadata?.role || 'mesero';
  const userRole = normalizeRole(rawUserRole);

  // Filtrar los elementos del sidebar según el rol del usuario normalizado
  const filteredSidebarItems = sidebarItems.filter(item => 
    item.roles.includes(userRole as FrontendRole)
  );

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 h-screen border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {!collapsed && (
          <h2 className="text-xl font-bold text-restaurant-dark dark:text-white">
            Plate<span className="text-restaurant-primary">Perfect</span>
          </h2>
        )}
        <div className="flex ml-auto">
          {/* Botón de cierre en móviles */}
          {isMobile && onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="md:hidden mr-1"
            >
              <X size={20} />
            </Button>
          )}
          
          {/* Botón para colapsar */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleCollapse}
          >
            {collapsed ? <ChevronRight size={20} /> : <MenuIcon size={20} />}
          </Button>
        </div>
      </div>

      <div className="py-4 flex-1 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {filteredSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.title}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-restaurant-primary/10 text-restaurant-primary dark:bg-restaurant-primary/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                onClick={isMobile && onClose ? onClose : undefined}
              >
                <Icon size={20} className={cn(isActive ? "text-restaurant-primary" : "text-gray-500 dark:text-gray-400")} />
                {!collapsed && <span className="ml-3">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-restaurant-primary flex items-center justify-center text-white font-medium">
            {user?.email?.substring(0, 1).toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium dark:text-white">{user?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@plateperfect.com'}</p>
              {userRole && (
                <p className="text-xs font-medium text-restaurant-primary">{getRoleDisplayName(rawUserRole)}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex">
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-1">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
