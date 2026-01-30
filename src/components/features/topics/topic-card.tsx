'use client';

import { deleteTopic } from '@/lib/actions/topics';
import type { Difficulty, TopicSource } from '@/lib/validations/topics';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  EASY: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HARD: 'bg-red-100 text-red-800',
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
    e.stopPropagation(); // Evitar que se abra el editor
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
    onEdit(topic.id); // Click en la card abre edición
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
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{topic.name}</h3>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${DIFFICULTY_COLORS[topic.difficulty]}`}
            >
              {DIFFICULTY_LABELS[topic.difficulty]}
            </span>
          </div>

          {topic.description && (
            <p className="mt-2 text-sm text-gray-600">{topic.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center">⏱️ {formatHours(topic.hours)}</span>
            <span className="flex items-center">📚 {SOURCE_LABELS[topic.source]}</span>
            {topic.source_date && (
              <span className="flex items-center">📅 {formatDate(topic.source_date)}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
