'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Difficulty } from '@/lib/validations/topics';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
};

const DIFFICULTY_VARIANT: Record<Difficulty, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

interface RecentTopicsProps {
  topics: Array<{
    id: string;
    name: string;
    difficulty: Difficulty;
    hours: number;
    subject_id: string;
    subjects?: { name: string } | null;
    created_at: string | null;
  }>;
}

export function RecentTopics({ topics }: RecentTopicsProps) {
  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  if (topics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Temas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No tenés temas aún</p>
            <p className="mt-1 text-xs text-on-surface-variant/70">
              Usá el widget de arriba para agregar uno
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temas Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.slice(0, 5).map((topic) => (
          <Link
            key={topic.id}
            href={`/dashboard/subjects/${topic.subject_id}`}
            className="flex items-center justify-between rounded-xl border border-outline-variant/10 p-3 transition-all hover:border-tertiary/20 hover:bg-tertiary-container/10"
          >
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary-container/30">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  sticky_note_2
                </span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-on-surface">{topic.name}</p>
                {topic.subjects && (
                  <p className="text-xs text-on-surface-variant">{topic.subjects.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">{formatHours(topic.hours)}</span>
              <Badge variant={DIFFICULTY_VARIANT[topic.difficulty]}>
                {DIFFICULTY_LABELS[topic.difficulty]}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
