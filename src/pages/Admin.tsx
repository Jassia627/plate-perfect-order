import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserPlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

// Datos de ejemplo para usuarios
const initialUsers = [
  { id: 1, name: "Admin Principal", email: "admin@restaurante.com", role: "admin", active: true },
  { id: 2, name: "Juan Pérez", email: "juanperez@restaurante.com", role: "mesero", active: true },
  { id: 3, name: "María López", email: "marialopez@restaurante.com", role: "cajero", active: true },
  { id: 4, name: "Carlos Gómez", email: "carlosgomez@restaurante.com", role: "cocina", active: false },
  { id: 5, name: "Ana Martínez", email: "anamartinez@restaurante.com", role: "mesero", active: true },
];

// Datos de ejemplo para roles
const roles = [
  { id: 1, name: "admin", description: "Acceso completo al sistema", permissions: ["all"] },
  { id: 2, name: "mesero", description: "Gestión de mesas y órdenes", permissions: ["tables", "orders"] },
  { id: 3, name: "cajero", description: "Gestión de pagos y cierres", permissions: ["payments", "reports"] },
  { id: 4, name: "cocina", description: "Vista de órdenes y preparación", permissions: ["orders-view"] },
];

const Admin = () => {
  const [users, setUsers] = useState(initialUsers);
  const [currentRoles] = useState(roles);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: 0, name: "", email: "", role: "", active: true });
  const [currentRole, setCurrentRole] = useState({ id: 0, name: "", description: "", permissions: [] });
  const [isEditing, setIsEditing] = useState(false);

  // Función para agregar o actualizar usuario
  const handleSaveUser = () => {
    if (isEditing) {
      setUsers(users.map(user => user.id === currentUser.id ? currentUser : user));
    } else {
      setUsers([...users, { ...currentUser, id: users.length + 1 }]);
    }
    setIsUserDialogOpen(false);
    resetUserForm();
  };

  // Función para eliminar usuario
  const handleDeleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  // Función para editar usuario
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsEditing(true);
    setIsUserDialogOpen(true);
  };

  // Función para resetear formulario
  const resetUserForm = () => {
    setCurrentUser({ id: 0, name: "", email: "", role: "", active: true });
    setIsEditing(false);
  };

  // Función para cambiar el estado activo de un usuario
  const toggleUserActive = (id) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, active: !user.active } : user
    ));
  };

  return (
    <MainLayout 
      title="Administración" 
      subtitle="Gestión de usuarios y permisos del sistema"
    >
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles y Permisos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Usuarios del sistema</h2>
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetUserForm}>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                    Complete los datos del usuario para {isEditing ? "actualizar sus datos" : "crearlo en el sistema"}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nombre</Label>
                    <Input 
                      id="name" 
                      value={currentUser.name} 
                      onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})} 
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Correo</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={currentUser.email} 
                      onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})} 
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Rol</Label>
                    <Select 
                      value={currentUser.role}
                      onValueChange={(value) => setCurrentUser({...currentUser, role: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">Activo</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch 
                        id="active" 
                        checked={currentUser.active} 
                        onCheckedChange={(checked) => setCurrentUser({...currentUser, active: checked})} 
                      />
                      <Label htmlFor="active">Usuario activo en el sistema</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleSaveUser}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div 
                          className={`flex items-center ${user.active ? 'text-green-600' : 'text-red-600'}`}
                          onClick={() => toggleUserActive(user.id)}
                        >
                          {user.active ? 
                            <><CheckCircleIcon className="h-4 w-4 mr-1" /> Activo</> : 
                            <><XCircleIcon className="h-4 w-4 mr-1" /> Inactivo</>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Roles del sistema</h2>
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setCurrentRole({ id: 0, name: "", description: "", permissions: [] });
                  setIsEditing(false);
                }}>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Nuevo Rol
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Rol</DialogTitle>
                  <DialogDescription>
                    Define un nuevo rol para el sistema.
                  </DialogDescription>
                </DialogHeader>
                {/* Formulario de rol aquí */}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission, index) => (
                            <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Admin; 