'use client';

import { useState } from 'react';
import { rescheduleSession, updateSessionStatus } from '@/lib/actions/sessions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RescheduleDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic?: { name: string } | null;
    subject?: { name: string } | null;
    scheduled_at: string;
    duration?: number;
    number?: number;
    attempts?: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

function getQuickOptions() {
  const now = new Date();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const in2Days = new Date(now);
  in2Days.setDate(in2Days.getDate() + 2);
  in2Days.setHours(9, 0, 0, 0);

  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setHours(9, 0, 0, 0);

  return [
    { label: 'Manana', date: tomorrow },
    { label: 'En 2 dias', date: in2Days },
    { label: 'Proximo lunes', date: nextMonday },
  ];
}

export function RescheduleDialog({ isOpen, session, onClose, onSuccess }: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');

  if (!session) return null;

  const attempts = session.attempts || 0;
  const maxAttemptsReached = attempts >= 2;
  const quickOptions = getQuickOptions();

  const handleReschedule = async (dateStr: string) => {
    setError(null);
    setLoading(true);

    const result = await rescheduleSession(session.id, dateStr);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
      setNewDate('');
      setMode('quick');
    }
  };

  const handleQuickOption = (date: Date) => {
    handleReschedule(date.toISOString());
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    handleReschedule(new Date(newDate).toISOString());
  };

  const handleAbandon = async () => {
    setLoading(true);
    await updateSessionStatus(session.id, 'ABANDONED');
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    onClose();
    setNewDate('');
    setError(null);
    setMode('quick');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar Sesion</DialogTitle>
        </DialogHeader>

        {/* Session info */}
        <div className="rounded-xl bg-surface-container-low p-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">menu_book</span>
            <span>{session.subject?.name ?? 'Sin materia'} - {session.topic?.name ?? 'Sin tema'}</span>
            {session.number && <span className="text-on-surface-variant">R{session.number}</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-2">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>Programada: {new Date(session.scheduled_at).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          {attempts > 0 && (
            <div className="mt-2 text-xs text-on-surface-variant">
              Reagendada {attempts} {attempts === 1 ? 'vez' : 'veces'}
            </div>
          )}
        </div>

        {maxAttemptsReached && (
          <div className="mb-4 rounded-xl bg-error-container/30 border border-error/20 p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-medium text-on-error-container">
                  Esta sesion ya fue reagendada {attempts} veces.
                </p>
                <p className="text-sm text-on-error-container/80 mt-1">
                  Considerá abandonarla o completarla parcialmente.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleAbandon}
                  disabled={loading}
                  className="mt-2"
                >
                  Abandonar sesion
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-error-container/30 p-3">
            <p className="text-sm text-on-error-container">{error}</p>
          </div>
        )}

        {/* Toggle Quick/Custom */}
        <div className="mb-4 flex rounded-lg bg-surface-container p-1">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'quick' ? 'bg-surface-container-lowest text-on-surface shadow-card' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Opciones rapidas
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'custom' ? 'bg-surface-container-lowest text-on-surface shadow-card' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Fecha personalizada
          </button>
        </div>

        {mode === 'quick' && (
          <div className="space-y-2">
            {quickOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickOption(option.date)}
                disabled={loading}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 text-left transition-all hover:border-tertiary/20 hover:shadow-card disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{option.label}</p>
                    <p className="text-xs text-on-surface-variant">
                      {option.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} - 09:00
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {mode === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-date" className="block text-sm font-headline text-on-surface mb-1.5">
                Nueva fecha y hora
              </label>
              <Input
                id="new-date"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !newDate}
              className="w-full"
            >
              {loading ? 'Reagendando...' : 'Confirmar fecha'}
            </Button>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="w-full">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
