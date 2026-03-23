import { notFound } from 'next/navigation';
import { getSubject } from '@/lib/actions/subjects';
import { getExamsBySubject } from '@/lib/actions/exams';
import { getTopicsBySubject } from '@/lib/actions/topics';
import { getSessionsBySubject } from '@/lib/actions/sessions';
import { SubjectDetailClient } from './subject-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [subject, exams, topics, sessions] = await Promise.all([
    getSubject(id),
    getExamsBySubject(id),
    getTopicsBySubject(id),
    getSessionsBySubject(id),
  ]);

  if (!subject) return notFound();

  return (
    <SubjectDetailClient
      subject={subject}
      initialExams={exams ?? []}
      initialTopics={topics ?? []}
      initialSessions={sessions ?? []}
    />
  );
}
