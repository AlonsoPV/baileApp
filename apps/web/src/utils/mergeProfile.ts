import { ProfileUser } from '../types/db';

/**
 * Merges partial profile updates with the current profile state
 * Ensures arrays and objects are properly merged, not overwritten
 */
export function mergeProfile(
  current: ProfileUser | null | undefined,
  updates: Partial<Omit<ProfileUser, 'user_id' | 'created_at'>>
): Partial<ProfileUser> {
  if (!current) {
    return updates;
  }

  return {
    ...current,
    ...updates,
    // Preserve arrays if not explicitly updated
    ritmos: updates.ritmos !== undefined ? updates.ritmos : current.ritmos,
    zonas: updates.zonas !== undefined ? updates.zonas : current.zonas,
    premios: updates.premios !== undefined ? updates.premios : current.premios,
    respuestas: updates.respuestas !== undefined 
      ? { ...current.respuestas, ...updates.respuestas }
      : current.respuestas,
    // Merge redes sociales properly
    redes_sociales: updates.redes_sociales !== undefined 
      ? { ...current.redes_sociales, ...updates.redes_sociales }
      : current.redes_sociales,
  };
}

