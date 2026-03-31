'use client';

import { useState } from 'react';
import { updateSessionStatus, deleteSession, completeSessionWithRating, startSession, createPartialSession, markSessionIncomplete } from '@/lib/actions/sessions';
import { CompleteSessionDialog } from './complete-session-dialog';
import { StudyModeDialog } from './study-mode-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const safeConfirm = (message: string): boolean => {
  if (typeof window !== 'undefined') return window.confirm(message);
  return false;
};

type Priority = 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW';
type SessionStatus = 'PENDING' | 'COMPLETED' | 'INCOMPLETE' | 'RESCHEDULED' | 'ABANDONED';

interface Session {
  id: string;
  adjusted_for_conflict?: boolean | null;
  original_scheduled_at?: string | null;
  topic?: { id: string; name: string } | null;
  subject?: { id: string; name: string } | null;
  scheduled_at: string;
  duration?: number | null;
  duration_minutes?: number | null;
  priority?: Priority | string | null;
  status: SessionStatus | string;
  number?: number;
}

interface SessionCardProps {
  session: Session;
  onStatusChange: () => void;
  onReschedule: (session: Session) => void;
}

const PRIORITY_CONFIG = {
  CRITICAL: { border: 'border-error/30', label: 'CRÍTICO', variant: 'error' as const },
  URGENT: { border: 'border-primary/30', label: 'URGENTE', variant: 'default' as const },
  IMPORTANT: { border: 'border-outline-variant/40', label: 'IMPORTANTE', variant: 'warning' as const },
  NORMAL: { border: 'border-tertiary/30', label: 'NORMAL', variant: 'outline' as const },
  LOW: { border: 'border-outline-variant/20', label: 'BAJA', variant: 'outline' as const },
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', variant: 'outline' as const },
  COMPLETED: { label: 'Completada', variant: 'success' as const },
  INCOMPLETE: { label: 'Parcial', variant: 'default' as const },
  RESCHEDULED: { label: 'Reagendada', variant: 'warning' as const },
  ABANDONED: { label: 'Abandonada', variant: 'error' as const },
};

export function SessionCard({ session, onStatusChange, onReschedule }: SessionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
  
  const priority = (session.priority as Priority) || 'NORMAL';
  const status = (session.status as SessionStatus) || 'PENDING';
  const duration = session.duration ?? session.duration_minutes ?? 30;

  const priorityStyle = PRIORITY_CONFIG[priority];
  const statusStyle = STATUS_CONFIG[status];
  
  const sessionDate = new Date(session.scheduled_at);
  const dateStr = sessionDate.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeStr = sessionDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const handleCompleteWithRating = async (sessionId: string, rating: 'EASY' | 'NORMAL' | 'HARD') => {
    setLoading(true);
    const result = await completeSessionWithRating(sessionId, rating);
    if (!result.error) {
      setShowCompleteDialog(false);
      await Promise.resolve(onStatusChange());
    }
    setLoading(false);
  };

  const handleStartStudy = async () => {
    await startSession(session.id);
    setShowStudyMode(true);
  };

  const handleComplete = () => {
    setShowCompleteDialog(true);
  };

  const handleStudyComplete = () => {
    setShowStudyMode(false);
    setShowCompleteDialog(true);
  };

  const handleIncompleteFromStudy = async (actualMinutes: number) => {
    setShowStudyMode(false);
    setLoading(true);

    const remaining = duration - actualMinutes;
    const wantsRemaining = remaining > 10 && safeConfirm(
      `Estudiaste ${actualMinutes} de ${duration} minutos. ¿Querés crear una sesión con los ${remaining} minutos restantes?`
    );

    if (wantsRemaining) {
      const result = await createPartialSession(session.id, actualMinutes);
      if (!result.error) {
        onStatusChange();
      }
    } else {
      const result = await markSessionIncomplete(session.id, actualMinutes);
      if (!result.error) {
        onStatusChange();
      }
    }

    setLoading(false);
  };

  const handleIncomplete = async () => {
    setLoading(true);
    const result = await updateSessionStatus(session.id, 'PENDING');
    if (!result.error) {
      onStatusChange();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!safeConfirm('¿Eliminar esta sesión?')) return;
    
    setLoading(true);
    const result = await deleteSession(session.id);
    if (!result.error) {
      onStatusChange();
    }
    setLoading(false);
  };

  return (
    <div className={`rounded-xl border-2 ${priorityStyle.border} bg-surface-container-lowest p-4 shadow-card`}>
      {/* Header: Badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={priorityStyle.variant}>
          {priorityStyle.label}
        </Badge>
        <Badge variant={statusStyle.variant}>
          {statusStyle.label}
        </Badge>
        {session.adjusted_for_conflict && (
          <Badge
            variant="warning"
            title={
              session.original_scheduled_at
                ? `Reubicada por conflicto de calendario. Horario original: ${new Date(session.original_scheduled_at).toLocaleString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'Reubicada por conflicto de calendario'
            }
            aria-label="Sesión reubicada por conflicto de calendario"
          >
            <span className="material-symbols-outlined text-[12px]">warning</span>
            Reubicada
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">menu_book</span>
              <span>{session.subject?.name ?? 'Sin materia'}</span>
            </p>
            <h3 className="flex items-center gap-1 text-sm font-semibold text-on-surface mt-1">
              <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
              <span>{session.topic?.name ?? 'Sin tema'} - R{session.number ?? 1}</span>
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            {dateStr} - {timeStr}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {duration} min
          </span>
        </div>
      </div>

      {/* Actions */}
      {status === 'PENDING' && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            onClick={handleStartStudy}
            disabled={loading}
            aria-label={`Iniciar modo estudio para ${session.topic?.name ?? 'sesión'}`}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
            Estudiar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleComplete}
            disabled={loading}
            aria-label={`Marcar como completada: ${session.topic?.name ?? 'sesión'}`}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Completar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReschedule(session)}
            disabled={loading}
            aria-label={`Reagendar sesión: ${session.topic?.name ?? 'sesión'}`}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-[14px]">event_repeat</span>
            Reagendar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            aria-label={`Eliminar sesión: ${session.topic?.name ?? 'sesión'}`}
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </Button>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleIncomplete}
            disabled={loading}
            aria-label={`Marcar como incompleta: ${session.topic?.name ?? 'sesión'}`}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-[14px]">undo</span>
            Marcar Incompleta
          </Button>
        </div>
      )}

      <CompleteSessionDialog
        isOpen={showCompleteDialog}
        session={session}
        onComplete={handleCompleteWithRating}
        onClose={() => setShowCompleteDialog(false)}
      />

      <StudyModeDialog
        isOpen={showStudyMode}
        session={session}
        onComplete={handleStudyComplete}
        onIncomplete={handleIncompleteFromStudy}
        onClose={() => setShowStudyMode(false)}
      />
    </div>
  );
}
