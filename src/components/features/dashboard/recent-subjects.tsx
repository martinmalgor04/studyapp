'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card>
        <CardHeader>
          <CardTitle>Materias Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No tenés materias aún</p>
            <Link
              href="/dashboard/subjects"
              className="mt-2 inline-block text-sm text-tertiary hover:underline"
            >
              Crear primera materia →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Materias Recientes</CardTitle>
          <Link href="/dashboard/subjects" className="text-sm text-tertiary hover:underline">
            Ver todas →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {subjects.slice(0, 5).map((subject) => (
          <div
            key={subject.id}
            onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant/10 p-3 transition-all hover:border-tertiary/20 hover:bg-tertiary-container/10"
          >
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary-container/30">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  menu_book
                </span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-on-surface">{subject.name}</p>
                {subject.description && (
                  <p className="text-xs text-on-surface-variant truncate max-w-[200px]">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 text-xs text-on-surface-variant">
              {subject.topics_count !== undefined && (
                <span>{subject.topics_count} temas</span>
              )}
              {subject.exams_count !== undefined && (
                <span>{subject.exams_count} exámenes</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
