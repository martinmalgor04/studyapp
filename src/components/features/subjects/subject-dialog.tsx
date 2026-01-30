'use client';

import { SubjectForm } from './subject-form';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">
          {subject ? 'Editar Materia' : 'Nueva Materia'}
        </h2>
        <div className="mt-4">
          <SubjectForm subject={subject} onSuccess={onClose} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
