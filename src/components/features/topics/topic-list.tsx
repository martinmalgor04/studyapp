import { TopicCard } from './topic-card';
import type { Difficulty, TopicSource } from '@/lib/validations/topics';

interface TopicListProps {
  topics: Array<{
    id: string;
    name: string;
    description: string | null;
    difficulty: Difficulty;
    hours: number;
    source: TopicSource;
    source_date: string | null;
  }>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TopicList({ topics, onEdit, onDelete }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">topic</span>
        <p className="font-headline text-lg text-on-surface-variant">No hay temas registrados</p>
        <p className="text-sm text-on-surface-variant/60 mt-1">Creá el primero para empezar a estudiar</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} onEdit={onEdit} onDelete={() => onDelete(topic.id)} />
      ))}
    </div>
  );
}
