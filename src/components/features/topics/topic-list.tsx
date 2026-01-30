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
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-sm text-gray-500">
          No hay temas registrados. Creá el primero para empezar.
        </p>
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
