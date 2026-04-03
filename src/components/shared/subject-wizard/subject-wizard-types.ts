export type StudyPath = 'CURSANDO' | 'LIBRE';

export interface SubjectWizardData {
  name: string;
  year?: number;
  semester?: 'ANNUAL' | 'FIRST' | 'SECOND';
  status?: 'CURSANDO' | 'APROBADA' | 'REGULAR' | 'LIBRE';
  professors?: string;
  description?: string;
  studyPath: StudyPath;
}

export interface ClassBlock {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string;
  endTime: string;
}

export type ClassScheduleData = ClassBlock[];

export interface TopicInput {
  id: string;
  name: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  hours: number;
}
