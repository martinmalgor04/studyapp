import { deleteExam } from '@/lib/actions/exams';
import { Badge } from '@/components/ui/badge';
import {
  type ExamCategory,
  type ExamModality,
  CATEGORY_COLORS,
  formatExamLabel,
} from '@/lib/validations/exams';

interface ExamCardProps {
  exam: {
    id: string;
    category: ExamCategory;
    modality: ExamModality;
    number: number | null;
    date: string;
    description: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: () => void;
}

export function ExamCard({ exam, onEdit, onDelete }: ExamCardProps) {
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este examen?')) {
      return;
    }

    const result = await deleteExam(exam.id);
    if (result.error) {
      alert(result.error);
    } else {
      onDelete();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(exam.date);

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card transition-shadow hover:shadow-subtle">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[exam.category]}`}
            >
              {formatExamLabel(exam.category, exam.modality)}
              {exam.number && ` ${exam.number}`}
            </span>
            {daysRemaining >= 0 && daysRemaining <= 30 && (
              <Badge
                variant={
                  daysRemaining <= 7
                    ? 'error'
                    : daysRemaining <= 14
                      ? 'warning'
                      : 'outline'
                }
              >
                {daysRemaining === 0
                  ? 'HOY'
                  : daysRemaining === 1
                    ? 'Mañana'
                    : `En ${daysRemaining} días`}
              </Badge>
            )}
          </div>

          <p className="mt-3 text-sm font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_month</span>
            {formatDate(exam.date)}
          </p>

          {exam.description && (
            <p className="mt-2 text-sm text-on-surface-variant">{exam.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(exam.id)}
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
    </div>
  );
}
