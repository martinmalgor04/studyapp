'use client';

import { ExamForm } from './exam-form';
import type { ExamType } from '@/lib/validations/exams';

interface ExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  exam?: {
    id: string;
    type: ExamType;
    number: number | null;
    date: string;
    description: string | null;
  };
}

export function ExamDialog({ isOpen, onClose, subjectId, exam }: ExamDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />

        {/* Dialog */}
        <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            {exam ? 'Editar Examen' : 'Nuevo Examen'}
          </h2>

          <ExamForm subjectId={subjectId} exam={exam} onSuccess={onClose} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
