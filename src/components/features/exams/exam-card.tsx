import { deleteExam } from '@/lib/actions/exams';
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
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
              <span
                className={`text-xs font-medium ${
                  daysRemaining <= 7
                    ? 'text-red-600'
                    : daysRemaining <= 14
                      ? 'text-orange-600'
                      : 'text-blue-600'
                }`}
              >
                {daysRemaining === 0
                  ? '¡HOY!'
                  : daysRemaining === 1
                    ? 'Mañana'
                    : `En ${daysRemaining} días`}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm font-semibold text-gray-900">
            📅 {formatDate(exam.date)}
          </p>

          {exam.description && (
            <p className="mt-2 text-sm text-gray-600">{exam.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(exam.id)}
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
