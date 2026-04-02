'use client';

import { useMemo } from 'react';
import { SubjectForm } from './subject-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SemesterType, SubjectStatus } from '@/lib/validations/subjects';

interface SubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: {
    id: string;
    name: string;
    description: string | null;
    year?: number | null;
    semester?: string | null;
    status?: string;
    professors?: string[] | null;
    schedule?: unknown;
  };
}

const VALID_SEMESTERS: readonly string[] = ['ANNUAL', 'FIRST', 'SECOND'];
const VALID_STATUSES: readonly string[] = ['CURSANDO', 'APROBADA', 'REGULAR', 'LIBRE'];

export function SubjectDialog({ isOpen, onClose, subject }: SubjectDialogProps) {
  const formSubject = useMemo(() => {
    if (!subject) return undefined;
    return {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      year: subject.year,
      semester: (subject.semester && VALID_SEMESTERS.includes(subject.semester)
        ? subject.semester
        : null) as SemesterType | null,
      status: (subject.status && VALID_STATUSES.includes(subject.status)
        ? subject.status
        : undefined) as SubjectStatus | undefined,
      professors: subject.professors,
      schedule: (subject.schedule ?? null) as Record<string, unknown> | null,
    };
  }, [subject]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Editar Materia' : 'Nueva Materia'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <SubjectForm subject={formSubject} onSuccess={onClose} onCancel={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
