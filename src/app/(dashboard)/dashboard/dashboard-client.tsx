'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData } from '@/lib/actions/dashboard';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RecentSubjects } from '@/components/features/dashboard/recent-subjects';
import { RecentTopics } from '@/components/features/dashboard/recent-topics';
import { QuickAddTopic } from '@/components/features/dashboard/quick-add-topic';
import { UnifiedCalendar } from '@/components/shared/calendar/unified-calendar';
import { MotivationalQuote } from '@/components/shared/motivational-quote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

interface DashboardClientProps {
  userName: string;
  initialData: DashboardData;
}

export function DashboardClient({ userName, initialData }: DashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-headline text-2xl text-on-surface">Bienvenido, {userName}</h2>
        <p className="mt-1 text-on-surface-variant">
          Acá tenés un resumen de tu progreso de estudio
        </p>
      </div>

      <StatsCards stats={data.stats} />

      <QuickAddTopic
        subjects={data.subjects.map((s) => ({ id: s.id, name: s.name }))}
        onSuccess={() => router.refresh()}
      />

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Próximas Sesiones</CardTitle>
              <p className="text-sm text-on-surface-variant mt-1">
                {data.sessions.length} sesiones pendientes
              </p>
            </div>
            <Link
              href="/dashboard/sessions"
              className="text-sm font-medium text-tertiary hover:text-tertiary-dim"
            >
              Ver todas las sesiones →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <UnifiedCalendar
            defaultView="week"
            sessions={data.sessions}
            onStatusChange={() => router.refresh()}
          />
        </CardContent>
      </Card>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSubjects subjects={data.subjects} />
        <RecentTopics topics={data.topics} />
      </div>

      {/* Onboarding info */}
      {data.stats.subjects === 0 && (
        <Card className="border-tertiary/20 bg-tertiary-container/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-on-tertiary-container">¿Por dónde empezar?</h3>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-on-tertiary-container/80 marker:text-tertiary">
              <li>Creá una <strong>materia</strong> haciendo click en &quot;Materias&quot; en el menú</li>
              <li>Agregá los <strong>exámenes</strong> de esa materia con sus fechas</li>
              <li>Registrá los <strong>temas</strong> a medida que vas teniendo clases</li>
              <li>El sistema generará automáticamente tus <strong>sesiones de repaso</strong></li>
            </ol>
          </CardContent>
        </Card>
      )}

      <MotivationalQuote />
    </div>
  );
}
