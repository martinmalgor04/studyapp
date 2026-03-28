import { ExamCard } from './exam-card';
import type { ExamCategory, ExamModality } from '@/lib/validations/exams';

interface ExamListProps {
  exams: Array<{
    id: string;
    category: ExamCategory;
    modality: ExamModality;
    number: number | null;
    date: string;
    description: string | null;
  }>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExamList({ exams, onEdit, onDelete }: ExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-sm text-gray-500">
          No hay exámenes registrados. Creá el primero para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} onEdit={onEdit} onDelete={() => onDelete(exam.id)} />
      ))}
    </div>
  );
}
