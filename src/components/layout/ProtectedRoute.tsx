import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { normalizeRole, routeRoleAccess } from "@/lib/roles";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si es una ruta de menú público (que contiene un ID)
    const isPublicMenuRoute = location.pathname.match(/^\/menu\/[\w-]+$/);
    if (isPublicMenuRoute) {
      // No verificar autenticación para rutas de menú público
      return;
    }

    // Si no está cargando y no hay usuario, redirigir al login
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    // Si hay usuario, verificar permisos según la ruta
    if (!loading && user) {
      const currentPath = location.pathname;
      const rawUserRole = user.user_metadata?.role || 'mesero'; // Rol predeterminado si no se especifica
      const userRole = normalizeRole(rawUserRole); // Normalizar el rol
      
      // Verificar si la ruta actual tiene restricciones
      const allowedRoles = routeRoleAccess[currentPath];
      
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        toast.error(`No tienes permisos para acceder a esta sección (${currentPath})`);
        // Redirigir a una ruta permitida según el rol
        if (userRole === 'mesero') {
          navigate('/tables');
        } else if (userRole === 'cocina') {
          navigate('/kitchen');
        } else if (userRole === 'cajero') {
          navigate('/cashier');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, loading, navigate, location.pathname]);

  // Si es una ruta de menú público, renderizar el contenido directamente
  if (location.pathname.match(/^\/menu\/[\w-]+$/)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-restaurant-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // La redirección se maneja en el useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;
