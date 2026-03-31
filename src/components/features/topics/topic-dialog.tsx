'use client';

import { TopicForm } from './topic-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Difficulty, TopicSource } from '@/lib/validations/topics';

interface TopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  exams: Array<{ id: string; category: string; modality: string; number: number | null; date: string }>;
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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {topic ? 'Editar Tema' : 'Nuevo Tema'}
          </DialogTitle>
        </DialogHeader>

        <TopicForm
          subjectId={subjectId}
          exams={exams}
          topic={topic}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
