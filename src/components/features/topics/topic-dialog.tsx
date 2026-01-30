'use client';

import { TopicForm } from './topic-form';
import type { Difficulty, TopicSource } from '@/lib/validations/topics';

interface TopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  exams: Array<{ id: string; type: string; number: number | null; date: string }>;
  topic?: {
    id: string;
    name: string;
    description: string | null;
    difficulty: Difficulty;
    hours: number;
    source: TopicSource;
    source_date: string | null;
    exam_id: string | null;
  };
}

export function TopicDialog({ isOpen, onClose, subjectId, exams, topic }: TopicDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />

        {/* Dialog */}
        <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            {topic ? 'Editar Tema' : 'Nuevo Tema'}
          </h2>

          <TopicForm
            subjectId={subjectId}
            exams={exams}
            topic={topic}
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
