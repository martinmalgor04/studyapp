'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExamList } from '@/components/features/exams/exam-list';
import { ExamDialog } from '@/components/features/exams/exam-dialog';
import { TopicList } from '@/components/features/topics/topic-list';
import { TopicDialog } from '@/components/features/topics/topic-dialog';
import { UnifiedCalendar } from '@/components/shared/calendar/unified-calendar';
import { MotivationalQuote } from '@/components/shared/motivational-quote';
import { Button } from '@/components/ui/button';

interface SubjectRow {
  id: string;
  name: string;
  description?: string | null;
  [key: string]: unknown;
}

interface ExamRow {
  id: string;
  date: string;
  category: 'PARCIAL' | 'RECUPERATORIO' | 'FINAL' | 'TP';
  modality: 'THEORY' | 'PRACTICE' | 'THEORY_PRACTICE';
  number: number | null;
  description: string | null;
}

interface TopicRow {
  id: string;
  name: string;
  description: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  hours: number;
  source: 'CLASS' | 'FREE_STUDY' | 'PROGRAM';
  source_date: string | null;
  exam_id: string | null;
}

interface SessionRow {
  id: string;
  scheduled_at: string;
  number: number;
  duration: number;
  priority: string | null;
  status: string | null;
  topic?: { id: string; name: string; difficulty?: string | null } | null;
  topic_id?: string | null;
}

interface SubjectDetailClientProps {
  subject: SubjectRow;
  initialExams: ExamRow[];
  initialTopics: TopicRow[];
  initialSessions: SessionRow[];
}

export function SubjectDetailClient({
  subject,
  initialExams,
  initialTopics,
  initialSessions,
}: SubjectDetailClientProps) {
  const router = useRouter();
  const [exams, setExams] = useState<ExamRow[]>(initialExams);
  const [topics, setTopics] = useState<TopicRow[]>(initialTopics);
  const [sessions, setSessions] = useState<SessionRow[]>(initialSessions);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRow | null>(null);
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null);

  useEffect(() => {
    setExams(initialExams);
  }, [initialExams]);

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const handleEditExam = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    setEditingExam(exam ?? null);
    setIsExamDialogOpen(true);
  };

  const handleDeleteExam = () => {
    router.refresh();
  };

  const handleCloseExamDialog = () => {
    setIsExamDialogOpen(false);
    setEditingExam(null);
    router.refresh();
  };

  const handleNewExam = () => {
    setEditingExam(null);
    setIsExamDialogOpen(true);
  };

  const handleEditTopic = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    setEditingTopic(topic ?? null);
    setIsTopicDialogOpen(true);
  };

  const handleDeleteTopic = () => {
    router.refresh();
  };

  const handleCloseTopicDialog = () => {
    setIsTopicDialogOpen(false);
    setEditingTopic(null);
    router.refresh();
  };

  const handleNewTopic = () => {
    setEditingTopic(null);
    setIsTopicDialogOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/subjects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-rounded text-[18px]">arrow_back</span>
          Volver a Materias
        </Link>
        <h1 className="font-headline text-3xl text-on-surface">{subject.name as string}</h1>
        {subject.description && (
          <p className="mt-2 text-sm text-on-surface-variant">{subject.description as string}</p>
        )}
      </div>

      {/* Sección de Exámenes */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-xl text-on-surface">Exámenes</h2>
          <Button onClick={handleNewExam} size="sm">
            + Nuevo Examen
          </Button>
        </div>

        <ExamList exams={exams} onEdit={handleEditExam} onDelete={handleDeleteExam} />
      </div>

      {/* Sección de Calendario */}
      <div className="mb-8">
        <h2 className="font-headline text-xl text-on-surface mb-4">Calendario</h2>
        <UnifiedCalendar
          defaultView="month"
          sessions={sessions}
          exams={exams}
          onStatusChange={() => router.refresh()}
        />
      </div>

      {/* Sección de Temas */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-xl text-on-surface">Temas</h2>
          <Button onClick={handleNewTopic} variant="secondary" size="sm">
            + Nuevo Tema
          </Button>
        </div>

        <TopicList topics={topics} onEdit={handleEditTopic} onDelete={handleDeleteTopic} />
      </div>

      <ExamDialog
        isOpen={isExamDialogOpen}
        onClose={handleCloseExamDialog}
        subjectId={subject.id}
        exam={editingExam ?? undefined}
      />

      <TopicDialog
        isOpen={isTopicDialogOpen}
        onClose={handleCloseTopicDialog}
        subjectId={subject.id}
        exams={exams}
        topic={editingTopic ?? undefined}
      />

      <MotivationalQuote />
    </div>
  );
}
