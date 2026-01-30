'use client';

import Link from 'next/link';

interface StatsCardsProps {
  stats: {
    subjects: number;
    exams: number;
    topics: number;
    upcomingExams: number;
    todaySessions: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Link
        href="/dashboard/subjects"
        data-testid="stat-card"
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
      >
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <span className="text-2xl">📚</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Materias</p>
            <p className="text-2xl font-bold text-gray-900">{stats.subjects}</p>
          </div>
        </div>
      </Link>

      <div data-testid="stat-card" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <span className="text-2xl">📝</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Temas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.topics}</p>
          </div>
        </div>
      </div>

      <div data-testid="stat-card" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <span className="text-2xl">✓</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Sesiones Hoy</p>
            <p className="text-2xl font-bold text-gray-900">{stats.todaySessions}</p>
          </div>
        </div>
      </div>

      <div data-testid="stat-card" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <span className="text-2xl">📋</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Exámenes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.exams}</p>
          </div>
        </div>
      </div>

      <div data-testid="stat-card" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
            <span className="text-2xl">⏰</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Próximos Exámenes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.upcomingExams}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
