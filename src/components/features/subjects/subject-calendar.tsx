'use client';

import { useState } from 'react';

interface Session {
  id: string;
  topic_id: string;
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

interface Topic {
  id: string;
  name: string;
}

interface SubjectCalendarProps {
  subjectId: string;
  sessions: Session[];
  exams: Exam[];
  topics: Topic[];
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Obtener días del mes con contexto (días del mes anterior y siguiente para completar semanas)
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
function getEventsForDay(date: Date, sessions: Session[], exams: Exam[], topics: Topic[]) {
  const dateStr = date.toISOString().split('T')[0];
  
  const daySessions = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_at).toISOString().split('T')[0];
    return sessionDate === dateStr;
  });
  
  const dayExams = exams.filter(e => {
    const examDate = new Date(e.date).toISOString().split('T')[0];
    return examDate === dateStr;
  });
  
  return { sessions: daySessions, exams: dayExams };
}

// Colores según estado de sesión
function getSessionColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'PENDING':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'INCOMPLETE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ABANDONED':
      return 'bg-gray-100 text-gray-600 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

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

export function SubjectCalendar({ subjectId, sessions, exams, topics }: SubjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Header con navegación */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
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
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-purple-200 border border-purple-400"></div>
          <span>Examen</span>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {/* Header de días de la semana */}
        {WEEKDAYS.map(day => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
        
        {/* Días del mes */}
        {calendarDays.map((day, index) => {
          const events = getEventsForDay(day.date, sessions, exams, topics);
          const isToday = day.date.toDateString() === today.toDateString();
          const dateStr = day.date.toISOString().split('T')[0];
          
          return (
            <div
              key={index}
              className={`min-h-24 border border-gray-200 p-1 ${
                !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Número del día */}
              <div className={`text-xs font-medium mb-1 ${
                !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
              } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                {day.date.getDate()}
              </div>
              
              {/* Eventos del día */}
              <div className="space-y-1">
                {/* Exámenes */}
                {events.exams.map(exam => (
                  <div
                    key={exam.id}
                    className={`rounded border px-1 py-0.5 text-xs font-medium ${getExamColor(exam.date)}`}
                    title={`${exam.type}${exam.number ? ` ${exam.number}` : ''}`}
                  >
                    📝 {exam.type.includes('FINAL') ? 'Final' : `P${exam.number}`}
                  </div>
                ))}
                
                {/* Sesiones */}
                {events.sessions.slice(0, 2).map(session => {
                  const topic = topics.find(t => t.id === session.topic_id);
                  return (
                    <div
                      key={session.id}
                      className={`rounded border px-1 py-0.5 text-xs truncate ${getSessionColor(session.status)}`}
                      title={`${topic?.name || 'Tema'} - R${session.number} (${session.duration}min)`}
                    >
                      R{session.number} {topic?.name?.substring(0, 8) || 'Tema'}
                    </div>
                  );
                })}
                
                {/* Indicador de más eventos */}
                {events.sessions.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{events.sessions.length - 2} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
