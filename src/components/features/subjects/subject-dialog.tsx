'use client';

import { SubjectForm } from './subject-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function SubjectDialog({ isOpen, onClose, subject }: SubjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Editar Materia' : 'Nueva Materia'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <SubjectForm subject={subject} onSuccess={onClose} onCancel={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
