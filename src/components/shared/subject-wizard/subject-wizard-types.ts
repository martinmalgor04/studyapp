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

/** Paso de revisión: fechas de clase por tema (mismo orden que `topics` en cursada). */
export interface CursadaDistributionData {
  topicClassDates: string[];
}

/** Alias para payload crudo del wizard (`data.cursadaDistribution`), usado por `buildSubjectWizardInput`. */
export type CursadaDistributionRawData = CursadaDistributionData;

/** Parcial en estado intermedio del paso cursada (antes de mapear a `topicIndices`). */
export interface ParcialRawData {
  id: string;
  name: string;
  date: string;
  modality: string;
  assignedTopicIds: string[];
}

/** Payload crudo `data.cursada` antes de normalizar a `SubjectWizardInput.cursada`. */
export interface CursadaRawData {
  schedule: ClassBlock[];
  topics: TopicInput[];
  parciales: ParcialRawData[];
}
