'use client';

import { useState } from 'react';
import { completeSessionWithRating } from '@/lib/actions/sessions';
import { CompleteSessionDialog } from '@/components/features/sessions/complete-session-dialog';

interface Session {
  id: string;
  topic_id?: string;
  topic?: {
    id: string;
    name: string;
  };
  number: number;
  scheduled_at: string;
  duration: number;
  priority: string;
  status: string;
}

interface Exam {
  id: string;
  type: string;
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
  CRITICAL: 'bg-red-100 border-red-300 text-red-800',
  URGENT: 'bg-orange-100 border-orange-300 text-orange-800',
  IMPORTANT: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  NORMAL: 'bg-blue-100 border-blue-300 text-blue-800',
  LOW: 'bg-gray-100 border-gray-300 text-gray-700',
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Colores según proximidad del examen
function getExamColor(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(date);
  examDate.setHours(0, 0, 0, 0);
  
  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    return 'bg-gray-200 text-gray-600 border-gray-400'; // Pasado
  } else if (daysUntil <= 3) {
    return 'bg-red-100 text-red-800 border-red-400'; // Urgente
  } else if (daysUntil <= 7) {
    return 'bg-orange-100 text-orange-800 border-orange-400'; // Próximo
  } else {
    return 'bg-purple-100 text-purple-800 border-purple-300'; // Futuro
  }
}

// Componente reutilizable para la tarjeta de sesión
interface SessionCardItemProps {
  session: Session;
  loadingSession: string | null;
  onComplete: (session: Session) => void;
}

function SessionCardItem({ session, loadingSession, onComplete }: SessionCardItemProps) {
  const time = new Date(session.scheduled_at).toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const topicName = session.topic?.name || 'Tema';
  const isCompleted = session.status === 'COMPLETED';
  
  return (
    <div
      className={`rounded-md border p-2 mb-1 ${
        isCompleted 
          ? 'bg-green-50 border-green-300 opacity-75' 
          : PRIORITY_COLORS[session.priority] || PRIORITY_COLORS.NORMAL
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold truncate">
          {topicName} - R{session.number}
        </div>
        {isCompleted && (
          <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{time}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{session.duration}min</span>
      </div>
      {!isCompleted && (
        <button
          onClick={() => onComplete(session)}
          disabled={loadingSession === session.id}
          className="mt-2 w-full rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loadingSession === session.id ? (
            '...'
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Completar</span>
            </>
          )}
        </button>
      )}
      {isCompleted && (
        <div className="mt-2 text-xs text-green-700 font-medium text-center">
          ✓ Completada
        </div>
      )}
    </div>
  );
}

// Obtener días del mes con contexto
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Ajustar para que Lunes sea 0 (en JS, Domingo es 0)
  let firstDayOfWeek = firstDay.getDay() - 1;
  if (firstDayOfWeek === -1) firstDayOfWeek = 6;
  
  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
  
  // Días del mes anterior para completar la primera semana
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false });
  }
  
  // Días del mes actual
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({ date, isCurrentMonth: true });
  }
  
  // Días del mes siguiente para completar la última semana
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
  }
  
  return days;
}

// Obtener eventos de un día específico
function getEventsForDay(date: Date, sessions: Session[], exams: Exam[] = []) {
  const dateStr = date.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const daySessions = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_at).toISOString().split('T')[0];
    // Mostrar PENDING siempre + COMPLETED solo del día actual
    return sessionDate === dateStr && (
      s.status === 'PENDING' || 
      (s.status === 'COMPLETED' && sessionDate === today)
    );
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
  void onReschedule; // Reserved for future reschedule from calendar
  const [view, setView] = useState<'week' | '2weeks' | 'month'>(defaultView);
  const [weekOffset, setWeekOffset] = useState(0);
  const [twoWeekOffset, setTwoWeekOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadingSession, setLoadingSession] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(null);

  // Lógica de navegación semanal
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

  // Lógica de navegación de 2 semanas
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

  // Navegación semanal
  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  
  // Navegación de 2 semanas
  const goToPreviousTwoWeeks = () => setTwoWeekOffset(twoWeekOffset - 1);
  const goToNextTwoWeeks = () => setTwoWeekOffset(twoWeekOffset + 1);
  const goToCurrentTwoWeeks = () => setTwoWeekOffset(0);
  
  // Navegación mensual
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

  // Vista semanal o de 2 semanas
  if (view === 'week' || view === '2weeks') {
    const days = view === 'week' ? getWeekDays() : getTwoWeekDays();
    
    // Agrupar sesiones por día
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = new Date(session.scheduled_at);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    // Agrupar exámenes por día
    const examsByDay = exams.reduce((acc, exam) => {
      const date = new Date(exam.date);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(exam);
      return acc;
    }, {} as Record<string, Exam[]>);

    if (sessions.length === 0 && exams.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-500">No hay sesiones ni exámenes para mostrar</p>
        </div>
      );
    }

    // Funciones de navegación según la vista
    const goToPrevious = view === 'week' ? goToPreviousWeek : goToPreviousTwoWeeks;
    const goToNext = view === 'week' ? goToNextWeek : goToNextTwoWeeks;
    const goToCurrent = view === 'week' ? goToCurrentWeek : goToCurrentTwoWeeks;
    const currentOffset = view === 'week' ? weekOffset : twoWeekOffset;
    const viewLabel = view === 'week' ? 'semana' : '2 semanas';

    return (
      <div className="space-y-4">
        {/* Navegación con selector de vistas */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            {currentOffset !== 0 && (
              <button
                onClick={goToCurrent}
                className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Esta {viewLabel}
              </button>
            )}
            <button
              onClick={goToNext}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Siguiente →
            </button>
          </div>
          
          {/* Selector de vistas */}
          <div className="flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setView('week')}
              className={`rounded px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors ${
                view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista semanal"
            >
              <span className="hidden sm:inline">Semanal</span>
              <span className="sm:hidden">S</span>
            </button>
            <button
              onClick={() => setView('2weeks')}
              className={`rounded px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors ${
                view === '2weeks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista de 2 semanas"
            >
              <span className="hidden sm:inline">2 Semanas</span>
              <span className="sm:hidden">2S</span>
            </button>
            <button
              onClick={() => setView('month')}
              className="rounded px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors text-gray-500 hover:text-gray-900"
              title="Vista mensual"
            >
              <span className="hidden sm:inline">Mensual</span>
              <span className="sm:hidden">M</span>
            </button>
          </div>
        </div>

        {/* Grid de días (7 columnas, se envuelve automáticamente para 2 semanas) */}
        <div className="grid grid-cols-7 gap-3">
          {days.map((day, index) => {
            const dayKey = day.toISOString().split('T')[0];
            const daySessions = sessionsByDay[dayKey] || [];
            const dayExams = examsByDay[dayKey] || [];
            const todayClass = isToday(day);

            return (
              <div
                key={index}
                className={`flex flex-col rounded-lg border-2 min-h-[180px] ${
                  todayClass 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-gray-200 bg-white'
                } p-3`}
              >
                {/* Header del día */}
                <div className="mb-2 text-center border-b pb-2">
                  <div className={`text-xs font-bold ${todayClass ? 'text-blue-600' : 'text-gray-500'}`}>
                    {formatDayLabel(day)}
                  </div>
                  <div className={`text-2xl font-bold ${todayClass ? 'text-blue-700' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                </div>

                {/* Exámenes del día */}
                {dayExams.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {dayExams.map((exam) => (
                      <div
                        key={exam.id}
                        className={`rounded border px-2 py-1 text-xs font-medium flex items-center gap-1 ${getExamColor(exam.date)}`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{exam.type.includes('FINAL') ? 'Final' : `P${exam.number}`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sesiones del día */}
                <div className="flex-1 space-y-2">
                  {daySessions.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xs text-gray-400">—</p>
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
      </div>
    );
  }

  // Vista mensual
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Header con navegación y selector de vistas */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hoy
            </button>
            <button
              onClick={goToNextMonth}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              →
            </button>
          </div>
          
          {/* Selector de vistas */}
          <div className="flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setView('week')}
              className="rounded px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors text-gray-500 hover:text-gray-900"
              title="Vista semanal"
            >
              <span className="hidden sm:inline">Semanal</span>
              <span className="sm:hidden">S</span>
            </button>
            <button
              onClick={() => setView('2weeks')}
              className="rounded px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors text-gray-500 hover:text-gray-900"
              title="Vista de 2 semanas"
            >
              <span className="hidden sm:inline">2 Semanas</span>
              <span className="sm:hidden">2S</span>
            </button>
            <button
              onClick={() => setView('month')}
              className="rounded px-2 py-1 text-xs sm:px-3 sm:text-sm font-medium transition-colors bg-white text-gray-900 shadow-sm"
              title="Vista mensual"
            >
              <span className="hidden sm:inline">Mensual</span>
              <span className="sm:hidden">M</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-200 border border-blue-400"></div>
          <span>Sesión Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-200 border border-green-400"></div>
          <span>Sesión Completada</span>
        </div>
        {exams.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-purple-200 border border-purple-400"></div>
            <span>Examen</span>
          </div>
        )}
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {/* Header de días de la semana */}
        {WEEKDAYS.map(day => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Días del mes */}
        {calendarDays.map((day, index) => {
          const events = getEventsForDay(day.date, sessions, exams);
          const isTodayDate = day.date.toDateString() === today.toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-[180px] border border-gray-200 p-2 flex flex-col ${
                !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Número del día */}
              <div className={`text-xs font-medium mb-2 ${
                !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
              } ${isTodayDate ? 'text-blue-600 font-bold' : ''}`}>
                {day.date.getDate()}
              </div>
              
              {/* Eventos del día */}
              <div className="flex-1 flex flex-col space-y-1">
                {/* Exámenes */}
                {events.exams.map(exam => (
                  <div
                    key={exam.id}
                    className={`rounded border px-2 py-1 text-xs font-medium mb-1 flex items-center gap-1 ${getExamColor(exam.date)}`}
                    title={`${exam.type}${exam.number ? ` ${exam.number}` : ''}`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{exam.type.includes('FINAL') ? 'Final' : `P${exam.number}`}</span>
                  </div>
                ))}
                
                {/* Sesiones */}
                {events.sessions.length === 0 && events.exams.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-gray-400 opacity-50">—</p>
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

      {/* Complete Session Dialog */}
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