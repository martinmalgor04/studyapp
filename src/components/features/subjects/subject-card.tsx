'use client';

import { useRouter } from 'next/navigation';
import { deleteSubject } from '@/lib/actions/subjects';

interface SubjectCardProps {
  subject: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    progress_percentage?: number;
    total_sessions?: number;
    completed_sessions?: number;
  };
  onEdit: (id: string) => void;
  onDelete: () => void;
}

// Helper para determinar color del borde superior según progreso
function getProgressBorderColor(progress: number): string {
  if (progress <= 25) return 'border-t-4 border-t-orange-500';
  if (progress <= 75) return 'border-t-4 border-t-green-500';
  return 'border-t-4 border-t-purple-500';
}

// Helper para determinar badge de estado
function getStatusBadge(progress: number): { label: string; className: string } {
  if (progress <= 25) return { label: 'Inicio', className: 'bg-orange-100 text-orange-800' };
  if (progress <= 50) return { label: 'Intermedio', className: 'bg-blue-100 text-blue-800' };
  if (progress <= 75) return { label: 'Avanzado', className: 'bg-green-100 text-green-800' };
  return { label: 'Casi listo', className: 'bg-purple-100 text-purple-800' };
}

export function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const router = useRouter();
  const progress = subject.progress_percentage || 0;
  const borderColor = getProgressBorderColor(progress);
  const statusBadge = getStatusBadge(progress);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar navegación
    if (!confirm('¿Estás seguro de eliminar esta materia?')) {
      return;
    }

    const result = await deleteSubject(subject.id);
    if (result.error) {
      alert(result.error);
    } else {
      onDelete();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar navegación
    onEdit(subject.id);
  };

  const handleCardClick = () => {
    router.push(`/dashboard/subjects/${subject.id}`);
  };

  return (
    <div
      data-testid="subject-card"
      onClick={handleCardClick}
      className={`cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md ${borderColor}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            {subject.description && (
              <p className="mt-1 text-sm text-gray-600">{subject.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="rounded-md p-1 text-blue-600 hover:bg-blue-50"
              title="Editar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md p-1 text-red-600 hover:bg-red-50"
              title="Eliminar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Progreso</span>
            <span className="text-xs font-bold text-gray-900">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${
                progress <= 25 ? 'bg-orange-500' : progress <= 75 ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{subject.total_sessions || 0} sesiones</span>
          </div>
          <p className="text-xs text-gray-400">
            Creada: {new Date(subject.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}
