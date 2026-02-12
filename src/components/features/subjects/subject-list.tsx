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
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No tienes materias creadas aún.</p>
        <p className="mt-1 text-sm text-gray-400">Hace click en &quot;Nueva Materia&quot; para empezar.</p>
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
