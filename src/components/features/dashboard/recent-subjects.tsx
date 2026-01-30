'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RecentSubjectsProps {
  subjects: Array<{
    id: string;
    name: string;
    description: string | null;
    topics_count?: number;
    exams_count?: number;
  }>;
}

export function RecentSubjects({ subjects }: RecentSubjectsProps) {
  const router = useRouter();

  if (subjects.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Materias Recientes</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No tenés materias aún</p>
          <Link
            href="/dashboard/subjects"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Crear primera materia →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Materias Recientes</h3>
        <Link href="/dashboard/subjects" className="text-sm text-blue-600 hover:underline">
          Ver todas →
        </Link>
      </div>

      <div className="space-y-3">
        {subjects.slice(0, 5).map((subject) => (
          <div
            key={subject.id}
            onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 transition-all hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-lg">📚</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{subject.name}</p>
                {subject.description && (
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              {subject.topics_count !== undefined && (
                <span>{subject.topics_count} temas</span>
              )}
              {subject.exams_count !== undefined && (
                <span>{subject.exams_count} exámenes</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
