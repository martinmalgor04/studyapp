'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserName, updatePassword, deleteUserAccount } from '@/lib/actions/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateUserName(name);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Nombre actualizado correctamente');
    }
    
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const result = await updatePassword(newPassword);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await deleteUserAccount();
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      setShowDeleteModal(false);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-error-container/20 border border-error/20 p-4">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="rounded-lg bg-secondary-container/20 border border-secondary/20 p-4">
          <p className="text-sm text-on-secondary-container">{success}</p>
        </div>
      )}

      {/* Información Básica */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-headline text-lg text-on-surface">Información Personal</h2>
          <form onSubmit={handleUpdateName} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Email</label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="mt-1 bg-surface-container-low opacity-60"
              />
              <p className="mt-1 text-xs text-on-surface-variant/60">El email no se puede cambiar</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Nombre</label>
              <Input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-headline text-lg text-on-surface">Cambiar Contraseña</h2>
          <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Nueva Contraseña</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                className="mt-1"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Confirmar Contraseña</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Zona Peligrosa */}
      <Card className="border-error/20 bg-error-container/10">
        <CardContent className="pt-6">
          <h2 className="font-headline text-lg text-error">Zona Peligrosa</h2>
          <p className="mt-2 text-sm text-on-error-container/80">
            Una vez que eliminés tu cuenta, no hay vuelta atrás. Por favor, estar seguro.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="mt-4 border-error/30 text-error hover:bg-error-container/20"
          >
            Eliminar Cuenta Permanentemente
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50">
          <div className="mx-4 max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/10">
            <h3 className="font-headline text-lg text-on-surface">¿Eliminar Cuenta?</h3>
            <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
              <p className="font-medium text-error">Esta acción es IRREVERSIBLE.</p>
              <p>Se eliminarán permanentemente:</p>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>Todas tus materias</li>
                <li>Todos tus temas</li>
                <li>Todos tus exámenes</li>
                <li>Todas tus sesiones de estudio</li>
                <li>Tu cuenta de usuario</li>
              </ul>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-on-surface-variant">
                Escribí <span className="font-mono font-bold text-error">ELIMINAR</span> para confirmar:
              </label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteConfirmText(e.target.value)}
                className="mt-2"
                placeholder="ELIMINAR"
                autoFocus
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'ELIMINAR'}
              >
                {loading ? 'Eliminando...' : 'Eliminar Cuenta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
