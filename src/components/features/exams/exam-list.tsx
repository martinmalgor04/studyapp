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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">assignment</span>
        <p className="font-headline text-lg text-on-surface-variant">No hay exámenes registrados</p>
        <p className="text-sm text-on-surface-variant/60 mt-1">Creá el primero para empezar a planificar</p>
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
