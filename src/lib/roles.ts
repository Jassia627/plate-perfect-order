/**
 * Utilidad para manejar los roles en la aplicación
 * Mantiene la coherencia entre los roles de la base de datos y los del frontend
 */

// Tipos para roles - solo permitir los 4 roles oficiales
export type DatabaseRole = 'admin' | 'waiter' | 'chef' | 'cashier';
export type FrontendRole = 'admin' | 'mesero' | 'cocina' | 'cajero';

/**
 * Normaliza un rol de cualquier formato al formato estándar del frontend
 * @param role El rol a normalizar (puede venir de la BD o de user_metadata)
 * @returns El rol normalizado en formato frontend
 */
export const normalizeRole = (role?: string | null): FrontendRole => {
  if (!role) return 'mesero'; // Valor por defecto

  const roleLower = role.toLowerCase();
  
  // Mapeo de roles de BD a roles frontend - simplificado a los 4 roles oficiales
  if (roleLower === 'waiter' || roleLower === 'camarero' || roleLower.includes('amarero')) {
    return 'mesero';
  }
  
  if (roleLower === 'chef' || roleLower.includes('cocin')) {
    return 'cocina';
  }
  
  if (roleLower === 'cashier' || roleLower === 'cajero') {
    return 'cajero';
  }
  
  if (roleLower === 'manager' || roleLower === 'admin' || roleLower === 'administrator') {
    return 'admin';
  }
  
  // Si no coincide con ninguno, devolver mesero como valor predeterminado seguro
  return 'mesero';
};

/**
 * Obtiene el rol para la base de datos a partir de un rol de frontend
 * @param frontendRole El rol del frontend
 * @returns El rol correspondiente para la base de datos
 */
export const getDatabaseRole = (frontendRole: FrontendRole): DatabaseRole => {
  const roleMap: Record<FrontendRole, DatabaseRole> = {
    'admin': 'admin',
    'mesero': 'waiter',
    'cocina': 'chef',
    'cajero': 'cashier'
  };
  
  return roleMap[frontendRole];
};

/**
 * Obtiene el nombre legible/amigable de un rol
 * @param role El rol (en cualquier formato)
 * @returns Nombre legible del rol
 */
export const getRoleDisplayName = (role?: string | null): string => {
  if (!role) return 'Mesero/a';
  
  const roleMap: Record<string, string> = {
    'admin': 'Administrador',
    'administrator': 'Administrador',
    'manager': 'Administrador',
    'mesero': 'Mesero/a',
    'waiter': 'Mesero/a',
    'camarero': 'Mesero/a',
    'cajero': 'Cajero/a',
    'cashier': 'Cajero/a',
    'cocina': 'Cocinero/a',
    'chef': 'Cocinero/a'
  };
  
  return roleMap[role.toLowerCase()] || role;
};

/**
 * Obtiene las rutas permitidas para un rol específico
 * @param role El rol del usuario
 * @returns Array de rutas a las que puede acceder
 */
export const getAllowedRoutes = (role: FrontendRole): string[] => {
  const routesByRole: Record<FrontendRole, string[]> = {
    'admin': ['/dashboard', '/tables', '/orders', '/kitchen', '/menu', '/staff', '/reports', '/settings', '/admin', '/cashier'],
    'mesero': ['/dashboard', '/tables', '/orders'],
    'cocina': ['/dashboard', '/kitchen', '/orders'],
    'cajero': ['/dashboard', '/orders', '/reports', '/cashier']
  };
  
  return routesByRole[role] || [];
};

/**
 * Mapa de rutas a roles permitidos
 */
export const routeRoleAccess: Record<string, FrontendRole[]> = {
  '/dashboard': ['admin', 'mesero', 'cajero', 'cocina'],
  '/tables': ['admin', 'mesero'],
  '/orders': ['admin', 'mesero', 'cocina', 'cajero'],
  '/kitchen': ['admin', 'cocina'],
  '/menu': ['admin'],
  '/staff': ['admin'],
  '/reports': ['admin', 'cajero'],
  '/settings': ['admin'],
  '/admin': ['admin'],
  '/cashier': ['admin', 'cajero']
}; 