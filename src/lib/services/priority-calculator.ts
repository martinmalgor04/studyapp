import type { Difficulty } from '@/lib/validations/topics';

export type Priority = 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW';

interface PriorityParams {
  daysToExam: number | null; // null si no hay examen asignado
  difficulty: Difficulty;
  sessionNumber: number; // 1-6
  daysToSession: number; // Días desde hoy hasta la sesión
  isFinal?: boolean; // true para finales (aplica bonus de urgencia)
}

/**
 * Calcula el score de urgencia basado en días hasta el examen
 * Rango: 0-40 puntos
 */
function calculateUrgencyScore(daysToExam: number | null): number {
  if (daysToExam === null) return 0; // Sin examen = sin urgencia

  if (daysToExam <= 3) return 40; // Muy urgente
  if (daysToExam <= 7) return 35; // Urgente
  if (daysToExam <= 14) return 30; // Próximo
  if (daysToExam <= 21) return 20; // Medio
  if (daysToExam <= 30) return 10; // Lejano
  return 5; // Muy lejano
}

/**
 * Calcula el score de dificultad
 * Rango: 10-30 puntos
 */
function calculateDifficultyScore(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'EASY':
      return 10;
    case 'MEDIUM':
      return 20;
    case 'HARD':
      return 30;
  }
}

/**
 * Calcula el score según el número de sesión
 * Rango: 5-20 puntos
 * Las primeras sesiones son más importantes
 */
function calculateSessionScore(sessionNumber: number): number {
  switch (sessionNumber) {
    case 1:
      return 20; // Primer repaso es crítico
    case 2:
      return 18;
    case 3:
      return 15;
    case 4:
      return 12;
    case 5:
      return 10;
    case 6:
      return 5;
    default:
      return 5;
  }
}

/**
 * Calcula el score de proximidad (cercanía a la fecha de la sesión)
 * Rango: 2-12 puntos
 * Sesiones más cercanas tienen mayor prioridad
 */
function calculateProximityScore(daysToSession: number): number {
  if (daysToSession < 0) return 0; // Sesión pasada (no debería pasar)
  if (daysToSession === 0) return 12; // Hoy
  if (daysToSession === 1) return 10; // Mañana
  if (daysToSession <= 3) return 8; // Próximos 3 días
  if (daysToSession <= 7) return 5; // Esta semana
  if (daysToSession <= 14) return 3; // Próximas 2 semanas
  return 2; // Lejano
}

/**
 * Calcula la prioridad de una sesión de estudio
 * Retorna el nivel de prioridad basado en el score total
 */
export function calculatePriority(params: PriorityParams): Priority {
  const { daysToExam, difficulty, sessionNumber, daysToSession, isFinal = false } = params;

  let urgencyScore = calculateUrgencyScore(daysToExam);
  const difficultyScore = calculateDifficultyScore(difficulty);
  const sessionScore = calculateSessionScore(sessionNumber);
  const proximityScore = calculateProximityScore(daysToSession);

  // BONUS para finales: urgencia mínima = 30
  // Los finales son más importantes que parciales, incluso si están lejos
  if (isFinal && urgencyScore < 30) {
    urgencyScore = 30;
  }

  const totalScore = urgencyScore + difficultyScore + sessionScore + proximityScore;

  // Clasificación por rangos
  if (totalScore >= 85) return 'CRITICAL';
  if (totalScore >= 70) return 'URGENT';
  if (totalScore >= 50) return 'IMPORTANT';
  if (totalScore >= 30) return 'NORMAL';
  return 'LOW';
}

/**
 * Calcula los días entre dos fechas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
