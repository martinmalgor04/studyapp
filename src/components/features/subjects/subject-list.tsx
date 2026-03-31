'use client';

import { SubjectCard } from './subject-card';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface SubjectListProps {
  subjects: Subject[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SubjectList({ subjects, onEdit, onDelete }: SubjectListProps) {
  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">school</span>
        <p className="font-headline text-lg text-on-surface-variant">No hay materias todavía</p>
        <p className="text-sm text-on-surface-variant/60 mt-1">Creá tu primera materia para empezar</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          onEdit={onEdit}
          onDelete={() => onDelete(subject.id)}
        />
      ))}
    </div>
  );
}
