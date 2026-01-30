'use client';

import Link from 'next/link';
import type { Difficulty, TopicSource } from '@/lib/validations/topics';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  EASY: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HARD: 'bg-red-100 text-red-800',
};

interface RecentTopicsProps {
  topics: Array<{
    id: string;
    name: string;
    difficulty: Difficulty;
    hours: number;
    subject_id: string;
    subjects?: {
      name: string;
    };
    created_at: string;
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
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Temas Recientes</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No tenés temas aún</p>
          <p className="mt-1 text-xs text-gray-400">
            Usá el widget de arriba para agregar uno
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">Temas Recientes</h3>

      <div className="space-y-3">
        {topics.slice(0, 5).map((topic) => (
          <Link
            key={topic.id}
            href={`/dashboard/subjects/${topic.subject_id}`}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-all hover:border-purple-200 hover:bg-purple-50"
          >
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-lg">📝</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{topic.name}</p>
                {topic.subjects && (
                  <p className="text-xs text-gray-500">{topic.subjects.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{formatHours(topic.hours)}</span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[topic.difficulty]}`}
              >
                {DIFFICULTY_LABELS[topic.difficulty]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
