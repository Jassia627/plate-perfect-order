'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function TestUserId() {
  const { session } = useAuth();

  const getUserId = () => {
    if (session?.user) {
      console.log('ID del usuario actual:', session.user.id);
      console.log('Email del usuario:', session.user.email);
      console.log('Sesión completa:', session);
      alert(`ID del usuario: ${session.user.id}`);
    } else {
      console.log('No hay usuario autenticado');
      alert('No hay usuario autenticado');
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Prueba de ID de Usuario</h2>
      <p className="mb-4">
        {session?.user 
          ? `Usuario autenticado: ${session.user.email}` 
          : 'No hay usuario autenticado'}
      </p>
      <Button onClick={getUserId}>Mostrar ID de Usuario</Button>
    </div>
  );
} 