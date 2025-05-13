import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Menu, 
  ChefHat, 
  Clock, 
  FileText, 
  Users, 
  BarChart, 
  Settings, 
  CreditCard 
} from "lucide-react";

// Definir los enlaces de navegación
const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: "/tables", label: "Mesas", icon: <Menu className="h-5 w-5" /> },
  { to: "/kitchen", label: "Cocina", icon: <ChefHat className="h-5 w-5" /> },
  { to: "/orders", label: "Pedidos", icon: <Clock className="h-5 w-5" /> },
  { to: "/menu", label: "Menú", icon: <FileText className="h-5 w-5" /> },
  { to: "/cashier", label: "Caja", icon: <CreditCard className="h-5 w-5" /> },
  { to: "/staff", label: "Personal", icon: <Users className="h-5 w-5" /> },
  { to: "/reports", label: "Informes", icon: <BarChart className="h-5 w-5" /> },
  { to: "/settings", label: "Configuración", icon: <Settings className="h-5 w-5" /> },
]; 