'use client';

import { useRouter } from 'next/navigation';
import { deleteSubject } from '@/lib/actions/subjects';
import { Badge } from '@/components/ui/badge';

type SubjectStatus = 'CURSANDO' | 'APROBADA' | 'REGULAR' | 'LIBRE';

interface SubjectCardProps {
  subject: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    status?: SubjectStatus;
    progress_percentage?: number;
    total_sessions?: number;
    completed_sessions?: number;
  };
  onEdit: (id: string) => void;
  onDelete: () => void;
}

function getSubjectStatusBadge(status: SubjectStatus | undefined): { label: string; variant: 'outline' | 'warning' | 'success' | 'error' } | null {
  if (!status || status === 'CURSANDO') return null;
  const badges: Record<SubjectStatus, { label: string; variant: 'outline' | 'warning' | 'success' | 'error' }> = {
    CURSANDO: { label: 'Cursando', variant: 'outline' },
    REGULAR: { label: 'Final pendiente', variant: 'warning' },
    APROBADA: { label: 'Aprobada', variant: 'success' },
    LIBRE: { label: 'Libre', variant: 'error' },
  };
  return badges[status];
}

function getProgressBadge(progress: number): { label: string; variant: 'default' | 'outline' | 'success' | 'secondary' } {
  if (progress <= 25) return { label: 'Inicio', variant: 'default' };
  if (progress <= 50) return { label: 'Intermedio', variant: 'outline' };
  if (progress <= 75) return { label: 'Avanzado', variant: 'success' };
  return { label: 'Casi listo', variant: 'secondary' };
}

export function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const router = useRouter();
  const progress = subject.progress_percentage || 0;
  const progressBadge = getProgressBadge(progress);
  const subjectStatusBadge = getSubjectStatusBadge(subject.status);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    e.stopPropagation();
    onEdit(subject.id);
  };

  const handleCardClick = () => {
    router.push(`/dashboard/subjects/${subject.id}`);
  };

  return (
    <div
      data-testid="subject-card"
      onClick={handleCardClick}
      className="group cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-card transition-all hover:border-tertiary/20 hover:shadow-subtle"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-on-surface">{subject.name}</h3>
              <Badge variant={progressBadge.variant}>
                {progressBadge.label}
              </Badge>
              {subjectStatusBadge && (
                <Badge variant={subjectStatusBadge.variant}>
                  {subjectStatusBadge.label}
                </Badge>
              )}
            </div>
            {subject.description && (
              <p className="mt-1 text-sm text-on-surface-variant">{subject.description}</p>
            )}
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="rounded-lg p-1 text-tertiary hover:bg-tertiary-container/30"
              title="Editar"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg p-1 text-error hover:bg-error-container/30"
              title="Eliminar"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-on-surface-variant">Progreso</span>
            <span className="text-xs font-bold text-on-surface">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-container">
            <div
              className="h-2 rounded-full bg-secondary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>{subject.total_sessions || 0} sesiones</span>
          </div>
          <p className="text-xs text-on-surface-variant/70">
            Creada: {new Date(subject.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}
