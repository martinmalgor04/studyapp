'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import type { TopicInput } from './subject-wizard-types';

const DIFFICULTY_DEFAULTS: Record<TopicInput['difficulty'], number> = {
  EASY: 35,
  MEDIUM: 70,
  HARD: 105,
};

const DIFFICULTY_OPTIONS: {
  value: TopicInput['difficulty'];
  label: string;
  classes: string;
  activeClasses: string;
}[] = [
  {
    value: 'EASY',
    label: 'Fácil',
    classes: 'hover:bg-secondary-container/20 hover:text-secondary',
    activeClasses: 'bg-secondary-container/30 text-secondary',
  },
  {
    value: 'MEDIUM',
    label: 'Medio',
    classes: 'hover:bg-tertiary-container/20 hover:text-tertiary',
    activeClasses: 'bg-tertiary-container/30 text-tertiary',
  },
  {
    value: 'HARD',
    label: 'Difícil',
    classes: 'hover:bg-error-container/20 hover:text-error',
    activeClasses: 'bg-error-container/30 text-error',
  },
];

interface TopicEntryPanelProps {
  topics: TopicInput[];
  onChange: (topics: TopicInput[]) => void;
  className?: string;
}

export function TopicEntryPanel({ topics, onChange, className }: TopicEntryPanelProps) {
  const [newTopicName, setNewTopicName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (editingHoursId && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [editingHoursId]);

  const addTopic = useCallback(() => {
    const trimmed = newTopicName.trim();
    if (!trimmed) return;

    const topic: TopicInput = {
      id: crypto.randomUUID(),
      name: trimmed,
      difficulty: 'MEDIUM',
      hours: DIFFICULTY_DEFAULTS.MEDIUM,
    };

    onChange([...topics, topic]);
    setNewTopicName('');
    addInputRef.current?.focus();
  }, [newTopicName, topics, onChange]);

  const removeTopic = useCallback(
    (id: string) => {
      onChange(topics.filter(t => t.id !== id));
    },
    [topics, onChange],
  );

  const updateTopic = useCallback(
    (id: string, patch: Partial<Omit<TopicInput, 'id'>>) => {
      onChange(
        topics.map(t => {
          if (t.id !== id) return t;
          const updated = { ...t, ...patch };
          if (patch.difficulty && !patch.hours) {
            updated.hours = DIFFICULTY_DEFAULTS[patch.difficulty];
          }
          return updated;
        }),
      );
    },
    [topics, onChange],
  );

  const commitNameEdit = useCallback(
    (id: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed) {
        updateTopic(id, { name: trimmed });
      }
      setEditingId(null);
    },
    [updateTopic],
  );

  const commitHoursEdit = useCallback(
    (id: string, value: string) => {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        updateTopic(id, { hours: parsed });
      }
      setEditingHoursId(null);
    },
    [updateTopic],
  );

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic();
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Add input */}
      <div className="flex gap-2">
        <Input
          ref={addInputRef}
          value={newTopicName}
          onChange={e => setNewTopicName(e.target.value)}
          onKeyDown={handleAddKeyDown}
          placeholder="Nombre del tema..."
          className="flex-1 rounded-xl border-outline-variant/20 bg-surface-container-lowest"
        />
        <button
          type="button"
          onClick={addTopic}
          disabled={!newTopicName.trim()}
          aria-label="Agregar tema"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            'bg-tertiary text-on-tertiary transition-all duration-200',
            'hover:bg-tertiary-dim active:scale-95',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>

      {/* List */}
      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/60">
          <span className="material-symbols-outlined text-[48px] mb-3">library_books</span>
          <p className="text-sm font-body">Agregá tu primer tema de estudio</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col">
          {topics.map(topic => (
            <li
              key={topic.id}
              className="group flex items-center gap-3 border-b border-outline-variant/10 py-3 transition-all duration-200 last:border-b-0"
            >
              {/* Name (inline editable) */}
              <div className="min-w-0 flex-1">
                {editingId === topic.id ? (
                  <input
                    ref={editInputRef}
                    defaultValue={topic.name}
                    onBlur={e => commitNameEdit(topic.id, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitNameEdit(topic.id, e.currentTarget.value);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className={cn(
                      'w-full rounded-lg border border-tertiary/40 bg-surface-container-lowest px-2 py-1',
                      'text-sm font-body text-on-surface outline-none',
                      'focus:ring-2 focus:ring-tertiary/30',
                    )}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingId(topic.id)}
                    className="w-full truncate text-left text-sm font-body text-on-surface hover:text-tertiary transition-colors"
                  >
                    {topic.name}
                  </button>
                )}
              </div>

              {/* Difficulty pills */}
              <div className="flex shrink-0 gap-1">
                {DIFFICULTY_OPTIONS.map(opt => {
                  const isActive = topic.difficulty === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateTopic(topic.id, { difficulty: opt.value })}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                        isActive
                          ? opt.activeClasses
                          : cn('text-on-surface-variant/60', opt.classes),
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Duration */}
              {editingHoursId === topic.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <input
                    ref={hoursInputRef}
                    type="number"
                    min={1}
                    defaultValue={topic.hours}
                    onBlur={e => commitHoursEdit(topic.id, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitHoursEdit(topic.id, e.currentTarget.value);
                      }
                      if (e.key === 'Escape') setEditingHoursId(null);
                    }}
                    className={cn(
                      'w-14 rounded-lg border border-tertiary/40 bg-surface-container-lowest px-2 py-1',
                      'text-center text-xs font-body text-on-surface outline-none',
                      'focus:ring-2 focus:ring-tertiary/30',
                    )}
                  />
                  <span className="text-xs text-on-surface-variant/50">min</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingHoursId(topic.id)}
                  className="shrink-0 text-xs text-on-surface-variant/50 hover:text-tertiary transition-colors"
                  aria-label={`Editar duración de ${topic.name}`}
                >
                  ~{topic.hours} min
                </button>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeTopic(topic.id)}
                aria-label={`Eliminar ${topic.name}`}
                className={cn(
                  'shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  'text-on-surface-variant/40 hover:text-error',
                )}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Counter */}
      {topics.length > 0 && (
        <p className="mt-3 text-center text-xs text-on-surface-variant/60">
          {topics.length} {topics.length === 1 ? 'tema agregado' : 'temas agregados'}
        </p>
      )}
    </div>
  );
}
