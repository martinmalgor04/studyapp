export function calculateSubjectProgress(
  sessions: Array<{ status: string }>,
): { total: number; completed: number; percentage: number } {
  const total = sessions.length;
  const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}
