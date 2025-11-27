/**
 * Normaliza ritmos de diferentes formatos a slugs del catálogo
 * para usar con RitmosChips (diseño moderno consistente)
 */

import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";

/**
 * Mapeo de IDs numéricos de tags a slugs del catálogo
 * Actualiza este mapeo según tu tabla tags en Supabase
 */
const TAG_ID_TO_SLUG: Record<number, string> = {
  1: 'salsa_on1',
  2: 'moderna',
  3: 'salsa_on2',
  4: 'salsa_casino',
  5: 'bachata_tradicional',
  6: 'bachata_sensual',
  7: 'merengue',
  8: 'cumbia',
  9: 'timba',
  10: 'kizomba',
  11: 'semba',
  12: 'zouk',
  13: 'hiphop',
  14: 'breakdance',
  15: 'reggaeton',
  16: 'twerk',
  17: 'danzon',
  18: 'rockandroll',
  19: 'swing',
  20: 'chachacha',
  21: 'boogiewoogie',
  66: 'yoga',
  67: 'pilates',
  68: 'cumbia_sonidera',
};

/**
 * Mapeo de nombres de tags a slugs del catálogo
 */
export const TAG_NAME_TO_SLUG: Record<string, string> = {
  'Salsa On 1': 'salsa_on1',
  'Moderna': 'moderna',
  'Salsa On 2': 'salsa_on2',
  'Salsa Casino': 'salsa_casino',
  'Bachata tradicional': 'bachata_tradicional',
  'Bachata Tradicional': 'bachata_tradicional',
  'Bachata sensual': 'bachata_sensual',
  'Bachata Sensual': 'bachata_sensual',
  'Merengue': 'merengue',
  'Cumbia': 'cumbia',
  'Timba': 'timba',
  'Kizomba': 'kizomba',
  'Semba': 'semba',
  'Zouk': 'zouk',
  'Hip hop': 'hiphop',
  'Hip Hop': 'hiphop',
  'Break dance': 'breakdance',
  'Reggaetón': 'reggaeton',
  'Reggaeton': 'reggaeton',
  'Twerk': 'twerk',
  'Danzón': 'danzon',
  'Rock and Roll': 'rockandroll',
  'Swing': 'swing',
  'Cha-cha-chá': 'chachacha',
  'Boogie Woogie': 'boogiewoogie',
  'Yoga': 'yoga',
  'Pilates': 'pilates',
  'Cumbia Sonidera': 'cumbia_sonidera',
};

/**
 * Normaliza ritmos desde diferentes fuentes a slugs
 * @param profile - Objeto de perfil (user, teacher, academy, organizer, brand)
 * @param allTags - Array de tags de Supabase (opcional, para nombres)
 * @returns Array de slugs para usar con RitmosChips
 */
export function normalizeRitmosToSlugs(
  profile: any,
  allTags?: Array<{ id: number; nombre: string; tipo: string }>
): string[] {
  const slugs: string[] = [];

  // 1) Prioridad máxima: ritmos_seleccionados (ya son slugs)
  if (Array.isArray(profile?.ritmos_seleccionados) && profile.ritmos_seleccionados.length > 0) {
    return profile.ritmos_seleccionados.filter((s: any) => typeof s === 'string');
  }

  // 2) Si hay ritmos (IDs numéricos), mapear a slugs
  if (Array.isArray(profile?.ritmos) && profile.ritmos.length > 0) {
    profile.ritmos.forEach((id: any) => {
      const numId = typeof id === 'number' ? id : parseInt(id, 10);
      if (!isNaN(numId) && TAG_ID_TO_SLUG[numId]) {
        slugs.push(TAG_ID_TO_SLUG[numId]);
      }
    });
  }

  // 3) Si hay estilos (algunos perfiles usan esta key)
  if (slugs.length === 0 && Array.isArray(profile?.estilos) && profile.estilos.length > 0) {
    profile.estilos.forEach((id: any) => {
      const numId = typeof id === 'number' ? id : parseInt(id, 10);
      if (!isNaN(numId) && TAG_ID_TO_SLUG[numId]) {
        slugs.push(TAG_ID_TO_SLUG[numId]);
      }
    });
  }

  // 4) Si tenemos allTags y ritmos numéricos, intentar por nombre
  if (slugs.length === 0 && allTags && Array.isArray(profile?.ritmos)) {
    profile.ritmos.forEach((id: any) => {
      const tag = allTags.find(t => t.id === id && t.tipo === 'ritmo');
      if (tag && TAG_NAME_TO_SLUG[tag.nombre]) {
        slugs.push(TAG_NAME_TO_SLUG[tag.nombre]);
      }
    });
  }

  return [...new Set(slugs)]; // Eliminar duplicados
}

/**
 * Valida que todos los slugs existan en el catálogo
 */
export function validateRitmoSlugs(slugs: string[]): string[] {
  const validSlugs = new Set<string>();
  RITMOS_CATALOG.forEach(group => {
    group.items.forEach(item => validSlugs.add(item.id));
  });
  return slugs.filter(s => validSlugs.has(s));
}

