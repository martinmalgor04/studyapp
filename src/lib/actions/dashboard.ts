'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      stats: { subjects: 0, exams: 0, topics: 0, upcomingExams: 0, todaySessions: 0 },
      subjects: [],
      topics: [],
      sessions: [],
    };
  }

  // Obtener materias con conteos
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, description, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Obtener todos los exámenes
  const { data: exams } = await supabase
    .from('exams')
    .select('id, date, subject_id')
    .in('subject_id', subjects?.map((s) => s.id) || []);

  // Obtener todos los topics con info de materia
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, difficulty, hours, source, source_date, subject_id, created_at, subjects(name)')
    .in('subject_id', subjects?.map((s) => s.id) || [])
    .order('created_at', { ascending: false });

  // Calcular exámenes próximos (siguiente 30 días)
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);

  const upcomingExams =
    exams?.filter((exam) => {
      const examDate = new Date(exam.date);
      return examDate >= now && examDate <= thirtyDaysLater;
    }).length || 0;

  // Obtener sesiones próximas (próximos 30 días para vista semanal)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  const thirtyDaysLater2 = new Date(today);
  thirtyDaysLater2.setDate(thirtyDaysLater2.getDate() + 30);
  const sessionsEnd = thirtyDaysLater2.toISOString();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, topic:topics(name, difficulty), subject:subjects(name)')
    .eq('user_id', user.id)
    .gte('scheduled_at', todayStart)
    .lt('scheduled_at', sessionsEnd)
    .eq('status', 'PENDING')
    .order('scheduled_at', { ascending: true });

  // Agregar conteos a las materias
  const subjectsWithCounts = subjects?.map((subject) => ({
    ...subject,
    topics_count: topics?.filter((t) => t.subject_id === subject.id).length || 0,
    exams_count: exams?.filter((e) => e.subject_id === subject.id).length || 0,
  })) || [];

  return {
    stats: {
      subjects: subjects?.length || 0,
      exams: exams?.length || 0,
      topics: topics?.length || 0,
      upcomingExams,
      todaySessions: sessions?.filter((s) => s.status === 'PENDING').length || 0,
    },
    subjects: subjectsWithCounts,
    topics: topics || [],
    sessions: sessions || [],
  };
}
