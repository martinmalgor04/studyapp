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
            <p className="text-xs text-gray-500">
              📚 {session.subject.name}
            </p>
            <h3 className="text-sm font-semibold text-gray-900">
              📝 {session.topic.name} - R{session.number}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>📅 {dateStr} - {timeStr}</span>
          <span>⏱️ {session.duration} min</span>
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
