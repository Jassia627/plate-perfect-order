import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus, Phone, Mail, MoreVertical, Loader2, RefreshCcw, Key, Eye, EyeOff, AlertCircle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useStaff, StaffMember, NewStaffMember } from "@/hooks/use-staff";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Mapa de roles a accesos/permisos
const roleAccess = {
  "Mesero/a": "mesero",
  "Cocinero/a": "cocina",
  "Cajero/a": "cajero",
  "Administrador/a": "admin"
};

const Staff = () => {
  const { staff, loading, error, addStaffMember, updateStaffMember, deleteStaffMember, toggleStaffStatus, refreshStaff } = useStaff();
  const { registerStaffMember } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para modales
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  
  // Estados para formularios
  const [newStaffData, setNewStaffData] = useState<NewStaffMember>({
    name: "",
    role: "",
    phone: "",
    email: "",
    password: "",
    status: "active"
  });
  
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [accountStaff, setAccountStaff] = useState<StaffMember | null>(null);
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Roles disponibles - simplificados a los 4 roles principales
  const availableRoles = [
    "Mesero/a",
    "Cocinero/a",
    "Cajero/a",
    "Administrador/a"
  ];
  
  // Filtrar personal según la búsqueda
  const filteredStaff = staff.filter(member => 
    (member.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (member.role?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (member.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );
  
  // Manejar la adición de un nuevo miembro
  const handleAddStaff = async () => {
    if (!newStaffData.name || !newStaffData.role || !newStaffData.phone || !newStaffData.email) {
      return; // Validación básica
    }
    
    // Validamos la contraseña si está presente
    if (newStaffData.password && newStaffData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    await addStaffMember(newStaffData);
    setNewStaffData({
      name: "",
      role: "",
      phone: "",
      email: "",
      password: "",
      status: "active"
    });
    setIsAddDialogOpen(false);
  };
  
  // Manejar la edición de un miembro
  const handleEditStaff = async () => {
    if (!editingStaff) return;
    
    await updateStaffMember(editingStaff.id, {
      name: editingStaff.name,
      role: editingStaff.role,
      phone: editingStaff.phone,
      email: editingStaff.email
    });
    
    setEditingStaff(null);
    setIsEditDialogOpen(false);
  };
  
  // Manejar la eliminación de un miembro
  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    
    await deleteStaffMember(deletingStaff.id);
    setDeletingStaff(null);
    setIsDeleteDialogOpen(false);
  };
  
  // Manejar cambio de estado
  const handleToggleStatus = async (member: StaffMember) => {
    await toggleStaffStatus(member.id);
  };

  // Manejar la creación de una cuenta de usuario
  const handleCreateUserAccount = async () => {
    if (!accountStaff || !accountPassword || accountPassword.length < 6) {
      toast.error("Por favor ingresa una contraseña válida de al menos 6 caracteres");
      return;
    }

    setCreatingAccount(true);

    try {
      // Obtener el rol de sistema según el rol de staff
      const systemRole = roleAccess[accountStaff.role as keyof typeof roleAccess] || "personal";
      
      const success = await registerStaffMember(
        accountStaff.email,
        accountPassword,
        accountStaff.name,
        systemRole,
        accountStaff.phone
      );

      if (success) {
        setIsCreateAccountDialogOpen(false);
        setAccountStaff(null);
        setAccountPassword("");
        toast.success("Registro exitoso");
      }
    } catch (error) {
      console.error("Error al crear cuenta:", error);
      toast.error("Error al crear cuenta de usuario");
    } finally {
      setCreatingAccount(false);
    }
  };

  return (
    <MainLayout title="Personal" subtitle="Gestiona tu equipo de trabajo">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar personal..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={refreshStaff}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Actualizar</span>
            </Button>
            <Button 
              className="flex items-center gap-1"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span>Añadir Miembro</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Personal</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando personal...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                {error}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron miembros del personal</p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone size={14} className="mr-2 text-muted-foreground" /> 
                            {member.phone}
                          </div>
                          <div className="flex items-center text-sm">
                            <Mail size={14} className="mr-2 text-muted-foreground" /> 
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {member.status === "active" ? "Activo" : "Inactivo"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              setAccountStaff(member);
                              setIsCreateAccountDialogOpen(true);
                            }}
                            title="Crear cuenta de usuario"
                          >
                            <Key size={14} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingStaff(member);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(member)}
                                className={member.status === "active" ? "text-amber-600" : "text-green-600"}
                              >
                                {member.status === "active" ? "Desactivar" : "Activar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDeletingStaff(member);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Añadir Miembro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Miembro del Personal</DialogTitle>
            <DialogDescription>
              Completa el formulario para añadir un nuevo miembro al equipo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={newStaffData.name}
                onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                placeholder="Ej: Ana Martínez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Posición</Label>
              <Select
                value={newStaffData.role}
                onValueChange={(value) => setNewStaffData({ ...newStaffData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar posición" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={newStaffData.phone}
                onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                placeholder="Ej: 612-345-678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={newStaffData.email}
                onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                placeholder="Ej: nombre@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showNewPassword ? "text" : "password"}
                  value={newStaffData.password}
                  onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                  placeholder="Contraseña segura"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {newStaffData.password ? 
                  (newStaffData.password.length < 6 ? 
                    "La contraseña debe tener al menos 6 caracteres" : 
                    "Contraseña válida") : 
                  "Si no especificas una contraseña, se generará una automáticamente"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddStaff}
              disabled={!newStaffData.name || !newStaffData.role || !newStaffData.phone || !newStaffData.email}
            >
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Editar Miembro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Miembro del Personal</DialogTitle>
            <DialogDescription>
              Actualiza la información del miembro del equipo.
            </DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre completo</Label>
                <Input
                  id="edit-name"
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Posición</Label>
                <Select
                  value={editingStaff.role}
                  onValueChange={(value) => setEditingStaff({ ...editingStaff, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar posición" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo electrónico</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditStaff}
              disabled={!editingStaff || !editingStaff.name || !editingStaff.role || !editingStaff.phone || !editingStaff.email}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmación para eliminar miembro */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente a <strong>{deletingStaff?.name}</strong> del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para crear cuenta de usuario */}
      <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear cuenta de acceso</DialogTitle>
            <DialogDescription>
              Crea una cuenta de usuario para {accountStaff?.name} con permisos específicos según su rol.
            </DialogDescription>
          </DialogHeader>
          {accountStaff && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Correo electrónico</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={accountStaff.email}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-role">Rol en el sistema</Label>
                <Input
                  id="account-role"
                  value={roleAccess[accountStaff.role as keyof typeof roleAccess] || "personal"}
                  disabled
                />
                <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                  <h4 className="font-medium mb-1">Accesos para este rol:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {accountStaff.role === "Mesero/a" ? (
                      <>
                        <li>Dashboard general</li>
                        <li>Gestión de mesas</li>
                        <li>Toma de pedidos</li>
                      </>
                    ) : accountStaff.role === "Cocinero/a" ? (
                      <>
                        <li>Dashboard general</li>
                        <li>Vista de cocina</li>
                        <li>Vista de pedidos</li>
                      </>
                    ) : accountStaff.role === "Cajero/a" ? (
                      <>
                        <li>Dashboard general</li>
                        <li>Vista de caja</li>
                        <li>Cobro de cuentas</li>
                        <li>Informes de ventas</li>
                      </>
                    ) : accountStaff.role === "Administrador/a" ? (
                      <>
                        <li>Acceso completo a todas las funciones</li>
                        <li>Gestión de personal</li>
                        <li>Configuración del sistema</li>
                        <li>Administración de usuarios</li>
                      </>
                    ) : (
                      <li>Acceso limitado al sistema</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="account-password"
                    type={showPassword ? "text" : "password"}
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="Ingrese una contraseña segura"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  La contraseña debe tener al menos 6 caracteres.
                </p>
              </div>
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <p className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  El usuario recibirá un correo para verificar su cuenta
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAccountDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUserAccount}
              disabled={!accountStaff || !accountPassword || accountPassword.length < 6 || creatingAccount}
            >
              {creatingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Crear Cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Staff;
