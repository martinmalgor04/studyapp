import { getSubjects } from '@/lib/actions/subjects';
import { SubjectsPageClient } from './subjects-page-client';

export default async function SubjectsPage() {
  const subjects = await getSubjects();
  return <SubjectsPageClient initialSubjects={subjects ?? []} />;
}
