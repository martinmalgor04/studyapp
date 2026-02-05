'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSubject } from '@/lib/actions/subjects';
import { getExamsBySubject } from '@/lib/actions/exams';
import { getTopicsBySubject } from '@/lib/actions/topics';
import { getSessionsBySubject } from '@/lib/actions/sessions';
import { ExamList } from '@/components/features/exams/exam-list';
import { ExamDialog } from '@/components/features/exams/exam-dialog';
import { TopicList } from '@/components/features/topics/topic-list';
import { TopicDialog } from '@/components/features/topics/topic-dialog';
import { UnifiedCalendar } from '@/components/shared/calendar/unified-calendar';
import type { ExamType } from '@/lib/validations/exams';

interface PageProps {
  params: {
    id: string;
  };
}

export default function SubjectDetailPage({ params }: PageProps) {
  const [subject, setSubject] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [subjectData, examsData, topicsData, sessionsData] = await Promise.all([
      getSubject(params.id),
      getExamsBySubject(params.id),
      getTopicsBySubject(params.id),
      getSessionsBySubject(params.id),
    ]);
    setSubject(subjectData);
    setExams(examsData);
    setTopics(topicsData);
    setSessions(sessionsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleEditExam = async (id: string) => {
    const exam = exams.find((e) => e.id === id);
    setEditingExam(exam);
    setIsExamDialogOpen(true);
  };

  const handleDeleteExam = async () => {
    loadData(); // Recargar lista después de eliminar
  };

  const handleCloseExamDialog = () => {
    setIsExamDialogOpen(false);
    setEditingExam(null);
    loadData(); // Recargar lista
  };

  const handleNewExam = () => {
    setEditingExam(null);
    setIsExamDialogOpen(true);
  };

  const handleEditTopic = async (id: string) => {
    const topic = topics.find((t) => t.id === id);
    setEditingTopic(topic);
    setIsTopicDialogOpen(true);
  };

  const handleDeleteTopic = async () => {
    loadData(); // Recargar lista después de eliminar
  };

  const handleCloseTopicDialog = () => {
    setIsTopicDialogOpen(false);
    setEditingTopic(null);
    loadData(); // Recargar lista
  };

  const handleNewTopic = () => {
    setEditingTopic(null);
    setIsTopicDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-900">Materia no encontrada</p>
          <Link href="/dashboard/subjects" className="mt-2 text-blue-600 hover:underline">
            Volver a Materias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/subjects"
          className="mb-4 inline-flex items-center text-sm text-blue-600 hover:underline"
        >
          ← Volver a Materias
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
        {subject.description && (
          <p className="mt-2 text-sm text-gray-600">{subject.description}</p>
        )}
      </div>

      {/* Sección de Exámenes */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Exámenes</h2>
          <button
            onClick={handleNewExam}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo Examen
          </button>
        </div>

        <ExamList exams={exams} onEdit={handleEditExam} onDelete={handleDeleteExam} />
      </div>

      {/* Sección de Calendario */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Calendario</h2>
        <UnifiedCalendar
          defaultView="month"
          sessions={sessions}
          exams={exams}
          onStatusChange={loadData}
        />
      </div>

      {/* Sección de Temas */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Temas</h2>
          <button
            onClick={handleNewTopic}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Nuevo Tema
          </button>
        </div>

        <TopicList topics={topics} onEdit={handleEditTopic} onDelete={handleDeleteTopic} />
      </div>

      <ExamDialog
        isOpen={isExamDialogOpen}
        onClose={handleCloseExamDialog}
        subjectId={params.id}
        exam={editingExam}
      />

      <TopicDialog
        isOpen={isTopicDialogOpen}
        onClose={handleCloseTopicDialog}
        subjectId={params.id}
        exams={exams}
        topic={editingTopic}
      />
    </div>
  );
}
