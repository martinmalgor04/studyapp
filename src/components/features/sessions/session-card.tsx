'use client';

import { useState } from 'react';
import { updateSessionStatus, deleteSession } from '@/lib/actions/sessions';

type Priority = 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW';
type SessionStatus = 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'ABANDONED';

interface SessionCardProps {
  session: {
    id: string;
    topic: { id: string; name: string };
    subject: { id: string; name: string };
    scheduled_at: string;
    duration: number;
    priority: Priority;
    status: SessionStatus;
    number: number;
  };
  onStatusChange: () => void;
  onReschedule: (session: any) => void;
}

const PRIORITY_CONFIG = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: '🔴 CRÍTICO' },
  URGENT: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: '🟠 URGENTE' },
  IMPORTANT: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: '🟡 IMPORTANTE' },
  NORMAL: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: '🔵 NORMAL' },
  LOW: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', label: '⚪ BAJA' },
};

const STATUS_CONFIG = {
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', label: '⏰ Pendiente' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Completada' },
  RESCHEDULED: { bg: 'bg-orange-100', text: 'text-orange-800', label: '🔄 Reagendada' },
  ABANDONED: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Abandonada' },
};

export function SessionCard({ session, onStatusChange, onReschedule }: SessionCardProps) {
  const [loading, setLoading] = useState(false);
  
  const priorityStyle = PRIORITY_CONFIG[session.priority];
  const statusStyle = STATUS_CONFIG[session.status];
  
  const sessionDate = new Date(session.scheduled_at);
  const dateStr = sessionDate.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeStr = sessionDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const handleComplete = async () => {
    setLoading(true);
    const result = await updateSessionStatus(session.id, 'COMPLETED');
    if (!result.error) {
      onStatusChange();
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
    if (!confirm('¿Eliminar esta sesión?')) return;
    
    setLoading(true);
    const result = await deleteSession(session.id);
    if (!result.error) {
      onStatusChange();
    }
    setLoading(false);
  };

  return (
    <div className={`rounded-lg border-2 ${priorityStyle.border} bg-white p-4 shadow-sm`}>
      {/* Header: Badges de prioridad y estado */}
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
          {priorityStyle.label}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Content: Info de la sesión */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{session.subject.name}</span>
            </p>
            <h3 className="flex items-center gap-1 text-sm font-semibold text-gray-900 mt-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{session.topic.name} - R{session.number}</span>
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dateStr} - {timeStr}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {session.duration} min
          </span>
        </div>
      </div>

      {/* Actions: Botones */}
      {session.status === 'PENDING' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            ✓ Completar
          </button>
          <button
            onClick={() => onReschedule(session)}
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            🔄 Reagendar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            🗑️
          </button>
        </div>
      )}

      {session.status === 'COMPLETED' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleIncomplete}
            disabled={loading}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            ↩️ Marcar Incompleta
          </button>
        </div>
      )}
    </div>
  );
}
