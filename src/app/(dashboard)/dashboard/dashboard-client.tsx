'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardData } from '@/lib/actions/dashboard';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RecentSubjects } from '@/components/features/dashboard/recent-subjects';
import { RecentTopics } from '@/components/features/dashboard/recent-topics';
import { QuickAddTopic } from '@/components/features/dashboard/quick-add-topic';
import { SessionList } from '@/components/features/sessions/session-list';

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [data, setData] = useState<{
    stats: { subjects: number; exams: number; topics: number; upcomingExams: number; todaySessions: number };
    subjects: any[];
    topics: any[];
    sessions: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const dashboardData = await getDashboardData();
    setData(dashboardData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-gray-500">Error al cargar datos</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {userName}</h2>
        <p className="mt-1 text-gray-600">
          Acá tenés un resumen de tu progreso de estudio
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={data.stats} />

      {/* Quick Add Topic */}
      <QuickAddTopic
        subjects={data.subjects.map((s) => ({ id: s.id, name: s.name }))}
        onSuccess={loadData}
      />

      {/* Sesiones Próximas */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Próximas Sesiones</h3>
            <p className="text-sm text-gray-500">
              {data.sessions.length} sesiones pendientes
            </p>
          </div>
          <Link
            href="/dashboard/sessions"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todas las sesiones →
          </Link>
        </div>
        <SessionList 
          sessions={data.sessions} 
          onStatusChange={loadData}
          onReschedule={() => {}} 
        />
      </div>

      {/* Two columns: Recent Subjects + Recent Topics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSubjects subjects={data.subjects} />
        <RecentTopics topics={data.topics} />
      </div>

      {/* Info about next features */}
      {data.stats.subjects === 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">¿Por dónde empezar?</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
            <li>Creá una <strong>materia</strong> haciendo click en "Materias" en el menú</li>
            <li>Agregá los <strong>exámenes</strong> de esa materia con sus fechas</li>
            <li>Registrá los <strong>temas</strong> a medida que vas teniendo clases</li>
            <li>El sistema generará automáticamente tus <strong>sesiones de repaso</strong></li>
          </ol>
        </div>
      )}
    </div>
  );
}
