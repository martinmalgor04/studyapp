'use client';

import { useState } from 'react';
import { completeSessionWithRating } from '@/lib/actions/sessions';
import { CompleteSessionDialog } from '@/components/features/sessions/complete-session-dialog';
import { formatExamShortLabel, formatExamLabel, type ExamCategory, type ExamModality } from '@/lib/validations/exams';
import { Button } from '@/components/ui/button';

interface Session {
  id: string;
  topic_id?: string | null;
  topic?: {
    id: string;
    name: string;
    difficulty?: string | null;
    source_date?: string | null;
  } | null;
  number: number;
  scheduled_at: string;
  duration: number;
  priority: string | null;
  status: string | null;
  session_type?: 'REVIEW' | 'PRE_CLASS' | string | null;
  adjusted_for_conflict?: boolean | null;
  original_scheduled_at?: string | null;
}

interface Exam {
  id: string;
  category: string;
  modality: string;
  number: number | null;
  date: string;
  description: string | null;
}

interface UnifiedCalendarProps {
  defaultView?: 'week' | '2weeks' | 'month';
  sessions: Session[];
  exams?: Exam[];
  onStatusChange?: () => void;
  onReschedule?: (session: Session) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-error-container/30 border-error/30 text-on-error-container',
  URGENT: 'bg-primary-container/30 border-primary/30 text-on-primary-container',
  IMPORTANT: 'bg-surface-container-high border-outline-variant/30 text-on-surface',
  NORMAL: 'bg-tertiary-container/20 border-tertiary/30 text-on-tertiary-container',
  LOW: 'bg-surface-container border-outline-variant/20 text-on-surface-variant',
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getExamColor(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(date);
  examDate.setHours(0, 0, 0, 0);
  
  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
  } else if (daysUntil <= 3) {
    return 'bg-error-container/30 text-on-error-container border-error/30';
  } else if (daysUntil <= 7) {
    return 'bg-primary-container/30 text-on-primary-container border-primary/30';
  } else {
    return 'bg-tertiary-container/30 text-tertiary border-tertiary/30';
  }
}

interface SessionCardItemProps {
  session: Session;
  loadingSession: string | null;
  onComplete: (session: Session) => void;
}

function SessionCardItem({ session, loadingSession, onComplete }: SessionCardItemProps) {
  const time = new Date(session.scheduled_at).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  
  const topicName = session.topic?.name || 'Tema';
  const isCompleted = session.status === 'COMPLETED';
  const isPreClass = session.session_type === 'PRE_CLASS' || session.number === 0;
  const sessionKindLabel = isPreClass ? 'Pre-clase' : `R${session.number}`;

  return (
    <div
      className={`rounded-lg border-l-2 p-2 mb-1 ${
        isCompleted 
          ? 'bg-secondary-container/20 border-l-secondary opacity-75' 
          : PRIORITY_COLORS[session.priority ?? 'NORMAL'] || PRIORITY_COLORS.NORMAL
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold truncate flex items-center gap-1">
          {topicName} {isPreClass ? '·' : '-'} {sessionKindLabel}
          {session.adjusted_for_conflict && (
            <span
              className="material-symbols-outlined text-[12px] text-primary flex-shrink-0"
              title={
                session.original_scheduled_at
                  ? `Reubicada por conflicto. Original: ${new Date(session.original_scheduled_at).toLocaleString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })}`
                  : 'Reubicada por conflicto de calendario'
              }
              aria-label="Sesión reubicada por conflicto"
            >
              warning
            </span>
          )}
        </div>
        {isCompleted && (
          <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0">check_circle</span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
        <span className="material-symbols-outlined text-[12px]">schedule</span>
        <span>{time}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[12px]">timer</span>
        <span>{session.duration}min</span>
      </div>
      {!isCompleted && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onComplete(session)}
          disabled={loadingSession === session.id}
          className="mt-2 w-full text-xs h-7"
        >
          {loadingSession === session.id ? (
            '...'
          ) : (
            <>
              <span className="material-symbols-outlined text-[12px]">check</span>
              <span>Completar</span>
            </>
          )}
        </Button>
      )}
      {isCompleted && (
        <div className="mt-2 text-xs text-secondary font-medium text-center flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[12px]">check_circle</span>
          Completada
        </div>
      )}
    </div>
  );
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let firstDayOfWeek = firstDay.getDay() - 1;
  if (firstDayOfWeek === -1) firstDayOfWeek = 6;
  
  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false });
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({ date, isCurrentMonth: true });
  }
  
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
  }
  
  return days;
}

function getEventsForDay(date: Date, sessions: Session[], exams: Exam[] = []) {
  const dateStr = date.toISOString().split('T')[0];

  const daySessions = sessions.filter((s) => {
    const sessionDate = new Date(s.scheduled_at).toISOString().split('T')[0];
    return sessionDate === dateStr;
  });
  
  const dayExams = exams.filter(e => {
    const examDate = new Date(e.date).toISOString().split('T')[0];
    return examDate === dateStr;
  });
  
  return { sessions: daySessions, exams: dayExams };
}

export function UnifiedCalendar({
  defaultView = 'month',
  sessions,
  exams = [],
  onStatusChange,
  onReschedule,
}: UnifiedCalendarProps) {
  void onReschedule;
  const [view, setView] = useState<'week' | '2weeks' | 'month'>(defaultView);
  const [weekOffset, setWeekOffset] = useState(0);
  const [twoWeekOffset, setTwoWeekOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadingSession, setLoadingSession] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(null);

  const getWeekDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + (weekOffset * 7));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getTwoWeekDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + (twoWeekOffset * 14));
    
    const days = [];
    for (let i = 0; i < 14; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const formatDayLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.toDateString() === today.toDateString()) {
      return 'HOY';
    }
    
    return date.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleComplete = (session: Session) => {
    setSessionToComplete(session);
    setShowCompleteDialog(true);
  };

  const handleCompleteWithRating = async (sessionId: string, rating: 'EASY' | 'NORMAL' | 'HARD') => {
    setLoadingSession(sessionId);
    const result = await completeSessionWithRating(sessionId, rating);
    if (!result.error && onStatusChange) {
      await Promise.resolve(onStatusChange());
    }
    setLoadingSession(null);
    setShowCompleteDialog(false);
    setSessionToComplete(null);
  };

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  
  const goToPreviousTwoWeeks = () => setTwoWeekOffset(twoWeekOffset - 1);
  const goToNextTwoWeeks = () => setTwoWeekOffset(twoWeekOffset + 1);
  const goToCurrentTwoWeeks = () => setTwoWeekOffset(0);
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const calendarDays = getCalendarDays(currentYear, currentMonth);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setWeekOffset(0);
    setTwoWeekOffset(0);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const viewToggle = (
    <div className="flex rounded-lg bg-surface-container p-1">
      {(['week', '2weeks', 'month'] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`rounded-lg px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors ${
            view === v ? 'bg-surface-container-lowest text-on-surface shadow-card' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title={v === 'week' ? 'Vista semanal' : v === '2weeks' ? 'Vista de 2 semanas' : 'Vista mensual'}
        >
          <span className="hidden sm:inline">{v === 'week' ? 'Semanal' : v === '2weeks' ? '2 Semanas' : 'Mensual'}</span>
          <span className="sm:hidden">{v === 'week' ? 'S' : v === '2weeks' ? '2S' : 'M'}</span>
        </button>
      ))}
    </div>
  );

  if (view === 'week' || view === '2weeks') {
    const days = view === 'week' ? getWeekDays() : getTwoWeekDays();
    
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = new Date(session.scheduled_at);
      const dayKey = date.toISOString().split('T')[0];
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    const examsByDay = exams.reduce((acc, exam) => {
      const date = new Date(exam.date);
      const dayKey = date.toISOString().split('T')[0];
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(exam);
      return acc;
    }, {} as Record<string, Exam[]>);

    if (sessions.length === 0 && exams.length === 0) {
      return (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-12 text-center">
          <p className="text-on-surface-variant">No hay sesiones ni exámenes para mostrar</p>
        </div>
      );
    }

    const goToPrevious = view === 'week' ? goToPreviousWeek : goToPreviousTwoWeeks;
    const goToNext = view === 'week' ? goToNextWeek : goToNextTwoWeeks;
    const goToCurrent = view === 'week' ? goToCurrentWeek : goToCurrentTwoWeeks;
    const currentOffset = view === 'week' ? weekOffset : twoWeekOffset;
    const viewLabel = view === 'week' ? 'semana' : '2 semanas';

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Anterior
            </Button>
            {currentOffset !== 0 && (
              <Button variant="outline" size="sm" onClick={goToCurrent}>
                Esta {viewLabel}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={goToNext}>
              Siguiente
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Button>
          </div>
          {viewToggle}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day, index) => {
            const dayKey = day.toISOString().split('T')[0];
            const daySessions = sessionsByDay[dayKey] || [];
            const dayExams = examsByDay[dayKey] || [];
            const todayClass = isToday(day);
            const pastDay = isPast(day);

            return (
              <div
                key={index}
                className={`flex flex-col rounded-xl border-2 min-h-[180px] ${
                  todayClass 
                    ? 'border-tertiary/20 bg-surface-container-lowest ring-2 ring-tertiary/20 shadow-xl' 
                    : 'border-outline-variant/10 bg-surface-container-lowest'
                } ${pastDay && !todayClass ? 'opacity-60' : ''} p-3`}
              >
                <div className="mb-2 text-center border-b border-outline-variant/10 pb-2">
                  <div className={`font-label text-[10px] font-bold uppercase tracking-widest ${todayClass ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                    {formatDayLabel(day)}
                  </div>
                  <div className={`font-headline text-2xl ${todayClass ? 'text-tertiary' : 'text-on-surface'}`}>
                    {day.getDate()}
                  </div>
                </div>

                {dayExams.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {dayExams.map((exam) => (
                      <div
                        key={exam.id}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium flex items-center gap-1 ${getExamColor(exam.date)}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">assignment</span>
                        <span>{formatExamShortLabel(exam.category as ExamCategory, exam.number)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  {daySessions.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xs text-on-surface-variant/40">—</p>
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <SessionCardItem
                        key={session.id}
                        session={session}
                        loadingSession={loadingSession}
                        onComplete={handleComplete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <CompleteSessionDialog
          isOpen={showCompleteDialog}
          session={sessionToComplete}
          onComplete={handleCompleteWithRating}
          onClose={() => {
            setShowCompleteDialog(false);
            setSessionToComplete(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-headline text-lg text-on-surface">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Button>
          </div>
          {viewToggle}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-tertiary-container/30 border border-tertiary/30"></div>
          <span className="text-on-surface-variant">Sesión Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-secondary-container/30 border border-secondary/30"></div>
          <span className="text-on-surface-variant">Sesión Completada</span>
        </div>
        {exams.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-tertiary-container/50 border border-tertiary/30"></div>
            <span className="text-on-surface-variant">Examen</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="py-2 text-center font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          const events = getEventsForDay(day.date, sessions, exams);
          const isTodayDate = day.date.toDateString() === today.toDateString();
          const pastDay = day.date < today && !isTodayDate;
          
          return (
            <div
              key={index}
              className={`min-h-[180px] border border-outline-variant/10 p-2 flex flex-col rounded-lg ${
                !day.isCurrentMonth ? 'bg-surface-container-low' : 'bg-surface-container-lowest'
              } ${isTodayDate ? 'ring-2 ring-tertiary/20 shadow-xl bg-surface-container-lowest' : ''} ${pastDay ? 'opacity-50' : ''}`}
            >
              <div className={`text-xs font-medium mb-2 ${
                !day.isCurrentMonth ? 'text-on-surface-variant/40' : 'text-on-surface-variant'
              } ${isTodayDate ? 'text-tertiary font-bold' : ''}`}>
                {day.date.getDate()}
              </div>
              
              <div className="flex-1 flex flex-col space-y-1">
                {events.exams.map(exam => (
                  <div
                    key={exam.id}
                    className={`rounded-lg border px-2 py-1 text-xs font-medium mb-1 flex items-center gap-1 ${getExamColor(exam.date)}`}
                    title={formatExamLabel(exam.category as ExamCategory, exam.modality as ExamModality) + (exam.number ? ` ${exam.number}` : '')}
                  >
                    <span className="material-symbols-outlined text-[12px]">assignment</span>
                    <span>{formatExamShortLabel(exam.category as ExamCategory, exam.number)}</span>
                  </div>
                ))}
                
                {events.sessions.length === 0 && events.exams.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-on-surface-variant/30">—</p>
                  </div>
                ) : (
                  events.sessions.map(session => (
                    <SessionCardItem
                      key={session.id}
                      session={session}
                      loadingSession={loadingSession}
                      onComplete={handleComplete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CompleteSessionDialog
        isOpen={showCompleteDialog}
        session={sessionToComplete}
        onComplete={handleCompleteWithRating}
        onClose={() => {
          setShowCompleteDialog(false);
          setSessionToComplete(null);
        }}
      />
    </div>
  );
}
