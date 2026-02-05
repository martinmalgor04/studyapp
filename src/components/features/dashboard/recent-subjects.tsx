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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
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
