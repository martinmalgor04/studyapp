export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const WEEKDAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Formatea una hora desde formato HH:MM:SS a HH:MM
 */
export function formatTimeShort(time: string): string {
  return time.substring(0, 5);
}

/**
 * Convierte día de la semana (0-6) a nombre corto
 * @param dayIndex 0=Domingo, 1=Lunes, ..., 6=Sábado
 */
export function getDayName(dayIndex: number, short: boolean = true): string {
  // Ajustar índice: 0=Dom, 1=Lun, ... → WEEKDAYS[0]=Lun
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return short ? WEEKDAYS[adjustedIndex] : WEEKDAYS_FULL[adjustedIndex];
}

/**
 * Genera array de horas del día (00:00 - 23:00)
 */
export function generateHoursArray(): string[] {
  const hours: string[] = [];
  for (let i = 0; i < 24; i++) {
    hours.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return hours;
}

/**
 * Calcula la altura en píxeles de un bloque de tiempo
 * @param startTime Hora inicio (HH:MM)
 * @param endTime Hora fin (HH:MM)
 * @param hourHeight Altura por hora en píxeles
 */
export function calculateBlockHeight(
  startTime: string,
  endTime: string,
  hourHeight: number = 60
): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const durationMinutes = endMinutes - startMinutes;
  
  return (durationMinutes / 60) * hourHeight;
}

/**
 * Calcula el offset vertical de un bloque desde las 00:00
 */
export function calculateBlockOffset(
  startTime: string,
  hourHeight: number = 60
): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMinute;
  
  return (totalMinutes / 60) * hourHeight;
}
