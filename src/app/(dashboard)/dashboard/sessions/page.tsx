import { createClient } from '@/lib/supabase/server';
import { getUpcomingSessions } from '@/lib/actions/sessions';
import { getSubjects } from '@/lib/actions/subjects';
import { SessionsClient } from './sessions-client';
import { Button } from '@/components/ui/button';

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    return null;
  }

  const [sessions, subjects] = await Promise.all([
    getUpcomingSessions(30),
    getSubjects(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-3xl text-on-surface">Sesiones de Estudio</h1>
          <p className="mt-2 text-on-surface-variant">
            Próximos 30 días - Gestioná tus sesiones de repaso programadas
          </p>
        </div>
        <Button
          title="Funcionalidad próximamente"
          disabled
        >
          + Nueva Sesión
        </Button>
      </div>

      <SessionsClient
        initialSessions={sessions}
        initialSubjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
