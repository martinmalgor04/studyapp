'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CompleteSessionDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic?: { name: string } | null;
    number?: number;
  } | null;
  onComplete: (sessionId: string, rating: 'EASY' | 'NORMAL' | 'HARD') => Promise<void>;
  onClose: () => void;
}

export function CompleteSessionDialog({ isOpen, session, onComplete, onClose }: CompleteSessionDialogProps) {
  if (!session) return null;

  const handleRating = async (rating: 'EASY' | 'NORMAL' | 'HARD') => {
    await onComplete(session.id, rating);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Excelente trabajo
          </DialogTitle>
          <DialogDescription className="text-center">
            Completaste: <span className="font-semibold text-on-surface">{session.topic?.name ?? 'Tema'} - R{session.number ?? 1}</span>
          </DialogDescription>
        </DialogHeader>

        <h3 className="text-center text-lg font-medium text-on-surface">
          ¿Cómo te fue con este tema?
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 my-4">
          <button
            onClick={() => handleRating('EASY')}
            className="rounded-xl border-2 border-secondary/20 bg-secondary-container/20 p-6 transition-all hover:border-secondary/40 hover:shadow-subtle"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-secondary-container/40">
              <span className="material-symbols-outlined text-[32px] text-secondary">check_circle</span>
            </div>
            <h4 className="mt-4 text-lg font-semibold text-on-surface">Fácil</h4>
            <p className="mt-1 text-xs text-on-surface-variant">Lo entendí rápido</p>
          </button>

          <button
            onClick={() => handleRating('NORMAL')}
            className="rounded-xl border-2 border-tertiary/20 bg-tertiary-container/20 p-6 transition-all hover:border-tertiary/40 hover:shadow-subtle"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-tertiary-container/40">
              <span className="material-symbols-outlined text-[32px] text-tertiary">thumb_up</span>
            </div>
            <h4 className="mt-4 text-lg font-semibold text-on-surface">Normal</h4>
            <p className="mt-1 text-xs text-on-surface-variant">Lo repasé bien</p>
          </button>

          <button
            onClick={() => handleRating('HARD')}
            className="rounded-xl border-2 border-primary/20 bg-primary-container/20 p-6 transition-all hover:border-primary/40 hover:shadow-subtle"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary-container/40">
              <span className="material-symbols-outlined text-[32px] text-primary">warning</span>
            </div>
            <h4 className="mt-4 text-lg font-semibold text-on-surface">Difícil</h4>
            <p className="mt-1 text-xs text-on-surface-variant">Me costó bastante</p>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
