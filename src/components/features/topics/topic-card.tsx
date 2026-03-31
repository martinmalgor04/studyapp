'use client';

import { deleteTopic } from '@/lib/actions/topics';
import { Badge } from '@/components/ui/badge';
import type { Difficulty, TopicSource } from '@/lib/validations/topics';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
};

const DIFFICULTY_VARIANT: Record<Difficulty, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

const SOURCE_LABELS: Record<TopicSource, string> = {
  CLASS: 'Clase',
  FREE_STUDY: 'Estudio Libre',
  PROGRAM: 'Programa',
};

interface TopicCardProps {
  topic: {
    id: string;
    name: string;
    description: string | null;
    difficulty: Difficulty;
    hours: number;
    source: TopicSource;
    source_date: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: () => void;
}

export function TopicCard({ topic, onEdit, onDelete }: TopicCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este tema?')) {
      return;
    }

    const result = await deleteTopic(topic.id);
    if (result.error) {
      alert(result.error);
    } else {
      onDelete();
    }
  };

  const handleCardClick = () => {
    onEdit(topic.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card transition-all hover:border-secondary/20 hover:shadow-subtle"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-on-surface">{topic.name}</h3>
            <Badge variant={DIFFICULTY_VARIANT[topic.difficulty]}>
              {DIFFICULTY_LABELS[topic.difficulty]}
            </Badge>
          </div>

          {topic.description && (
            <p className="mt-2 text-sm text-on-surface-variant">{topic.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {formatHours(topic.hours)}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              {SOURCE_LABELS[topic.source]}
            </span>
            {topic.source_date && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                {formatDate(topic.source_date)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            className="rounded-lg p-1 text-error hover:bg-error-container/30"
            title="Eliminar"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
