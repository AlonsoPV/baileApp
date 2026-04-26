import { messageForAcademyWeeklyViolation } from '@/lib/academyWeeklyClassRules';
import { COPY_UBICACIONES_LEGACY_OVER_LIMIT } from '@/lib/academyLocationLimits';

/** Cronograma / triggers compartidos (academia y maestro). */
export function friendlyCronogramaConstraintMessage(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.includes('ACADEMY_BASIC_NO_WEEKLY_CLASS')) {
    return messageForAcademyWeeklyViolation('basic_no_weekly');
  }
  if (raw.includes('ACADEMY_PRO_WEEKLY_MAX_ONE_DAY')) {
    return messageForAcademyWeeklyViolation('pro_multi_day');
  }
  if (raw.includes('ACADEMY_SPECIFIC_DATE_CLASS_LIMIT')) {
    return 'Tu plan Basic permite hasta 5 clases con fecha específica. Actualiza a Pro o Premium.';
  }
  return null;
}

/** Todos los errores de triggers al guardar `profiles_academy` (cronograma + ubicaciones, etc.). */
export function friendlyAcademyProfileConstraintMessage(raw: string | undefined): string | null {
  const fromCrono = friendlyCronogramaConstraintMessage(raw);
  if (fromCrono) return fromCrono;
  if (raw?.includes('ACADEMY_BASIC_UBICACIONES_LIMIT')) {
    return COPY_UBICACIONES_LEGACY_OVER_LIMIT;
  }
  return null;
}

/** Errores de RPC de métricas (academia) por plan. */
export function friendlyAcademyMetricsRpcMessage(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.includes('ACADEMY_BASIC_NO_CLASS_METRICS')) {
    return 'Las estadísticas de clases requieren plan Pro o Premium.';
  }
  if (raw.includes('ACADEMY_STUDENT_METRICS_PREMIUM_ONLY')) {
    return 'Las métricas de alumnos están disponibles con plan Premium.';
  }
  if (raw.includes('ACADEMY_METRICS_ATTENDANCE_PREMIUM_ONLY')) {
    return 'Marcar asistencia y pago en métricas está disponible con plan Premium.';
  }
  return null;
}
