'use client';

import { ExamForm } from './exam-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ExamCategory, ExamModality } from '@/lib/validations/exams';

interface ExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  exam?: {
    id: string;
    category: ExamCategory;
    modality: ExamModality;
    number: number | null;
    date: string;
    description: string | null;
  };
}

export function ExamDialog({ isOpen, onClose, subjectId, exam }: ExamDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {exam ? 'Editar Examen' : 'Nuevo Examen'}
          </DialogTitle>
        </DialogHeader>

        <ExamForm subjectId={subjectId} exam={exam} onSuccess={onClose} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
