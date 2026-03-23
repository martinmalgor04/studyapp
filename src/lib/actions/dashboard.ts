'use server';

import { getAuthenticatedUser } from '@/lib/utils/auth';
import { findAllSubjects } from '@/lib/repositories/subjects.repository';
import { findExamsBySubjectIds } from '@/lib/repositories/exams.repository';
import { findTopicsBySubjectIds } from '@/lib/repositories/topics.repository';
import { findUpcomingSessions } from '@/lib/repositories/sessions.repository';

export async function getDashboardData() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      stats: { subjects: 0, exams: 0, topics: 0, upcomingExams: 0, todaySessions: 0 },
      subjects: [],
      topics: [],
      sessions: [],
    };
  }

  const subjects = await findAllSubjects();
  const subjectIds = subjects.map((s) => s.id);

  const [exams, topics, sessions] = await Promise.all([
    findExamsBySubjectIds(subjectIds),
    findTopicsBySubjectIds(subjectIds),
    findUpcomingSessions(user.id, 30),
  ]);

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(now.getDate() + 30);

  const upcomingExams = exams.filter((exam) => {
    const examDate = new Date(exam.date);
    return examDate >= now && examDate <= thirtyDaysLater;
  }).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subjectsWithCounts = subjects.map((subject) => ({
    ...subject,
    topics_count: topics.filter((t) => t.subject_id === subject.id).length,
    exams_count: exams.filter((e) => e.subject_id === subject.id).length,
  }));

  return {
    stats: {
      subjects: subjects.length,
      exams: exams.length,
      topics: topics.length,
      upcomingExams,
      todaySessions: sessions.filter(
        (s) =>
          s.status === 'PENDING' &&
          new Date(s.scheduled_at).toDateString() === today.toDateString(),
      ).length,
    },
    subjects: subjectsWithCounts,
    topics,
    sessions,
  };
}
