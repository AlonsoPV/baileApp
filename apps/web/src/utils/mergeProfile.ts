import { ProfileUser } from '../types/db';

/**
 * Merges partial profile updates with the current profile state
 * Ensures arrays and objects are properly merged, not overwritten
 */
/**
 * Normaliza valores undefined a null para evitar problemas con la base de datos
 */
function normalizeValue<T>(value: T | undefined | null): T | null {
  return value === undefined ? null : value;
}

export function mergeProfile(
  current: ProfileUser | null | undefined,
  updates: Partial<Omit<ProfileUser, 'user_id' | 'created_at'>>
): Partial<ProfileUser> {
  if (!current) {
    // Normalizar todos los valores undefined a null
    const normalized: any = {};
    for (const [key, value] of Object.entries(updates)) {
      normalized[key] = normalizeValue(value);
    }
    return normalized;
  }

  // Normalizar valores antes de mergear
  const normalizedUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    normalizedUpdates[key] = normalizeValue(value);
  }

  return {
    ...current,
    ...normalizedUpdates,
    // Preserve arrays if not explicitly updated
    ritmos: normalizedUpdates.ritmos !== null && normalizedUpdates.ritmos !== undefined 
      ? normalizedUpdates.ritmos 
      : current.ritmos,
    zonas: normalizedUpdates.zonas !== null && normalizedUpdates.zonas !== undefined 
      ? normalizedUpdates.zonas 
      : current.zonas,
    premios: normalizedUpdates.premios !== null && normalizedUpdates.premios !== undefined 
      ? normalizedUpdates.premios 
      : current.premios,
    respuestas: normalizedUpdates.respuestas !== null && normalizedUpdates.respuestas !== undefined 
      ? { ...(current.respuestas || {}), ...normalizedUpdates.respuestas }
      : current.respuestas,
    // Merge redes sociales properly
    redes_sociales: normalizedUpdates.redes_sociales !== null && normalizedUpdates.redes_sociales !== undefined 
      ? { ...(current.redes_sociales || {}), ...normalizedUpdates.redes_sociales }
      : current.redes_sociales,
  };
}

