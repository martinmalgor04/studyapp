'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserName, updatePassword, deleteUserAccount } from '@/lib/actions/profile';

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
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Información Básica */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
        <form onSubmit={handleUpdateName} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">El email no se puede cambiar</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      {/* Cambiar Contraseña */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h2>
        <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* Zona Peligrosa */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Zona Peligrosa</h2>
        <p className="mt-2 text-sm text-red-700">
          Una vez que eliminés tu cuenta, no hay vuelta atrás. Por favor, estar seguro.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
          className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          Eliminar Cuenta Permanentemente
        </button>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">¿Eliminar Cuenta?</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p className="font-medium text-red-600">Esta acción es IRREVERSIBLE.</p>
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
              <label className="block text-sm font-medium text-gray-700">
                Escribí <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                placeholder="ELIMINAR"
                autoFocus
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setError(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'ELIMINAR'}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
