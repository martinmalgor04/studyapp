'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteSubject } from '@/lib/actions/subjects';

interface SubjectCardProps {
  subject: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };
  onEdit: (id: string) => void;
  onDelete: () => void;
}

export function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const router = useRouter();

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
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
          {subject.description && (
            <p className="mt-1 text-sm text-gray-600">{subject.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Creada: {new Date(subject.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="rounded-md bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
