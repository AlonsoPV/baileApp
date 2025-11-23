import { ZONAS_CATALOG } from '@/lib/zonasCatalog';

/**
 * Valida que las zonas seleccionadas solo incluyan IDs que existen en el catálogo de zonas.
 * Filtra cualquier zona que no esté en el catálogo.
 * 
 * @param selectedZonaIds - Array de IDs de zonas seleccionadas
 * @param allTags - Array de tags de la base de datos (para mapear IDs a slugs)
 * @returns Array de IDs válidos que existen en el catálogo
 */
export function validateZonasAgainstCatalog(
  selectedZonaIds: (number | null | undefined)[] | null | undefined,
  allTags?: any[] | null
): number[] {
  if (!selectedZonaIds || !Array.isArray(selectedZonaIds)) {
    return [];
  }

  // Normalizar IDs: filtrar null/undefined y convertir a números
  const normalizedIds = selectedZonaIds
    .filter((id): id is number => typeof id === 'number' && !isNaN(id));

  if (normalizedIds.length === 0) {
    return [];
  }

  // Si no hay tags, no podemos validar, retornar vacío para ser seguro
  if (!allTags || !Array.isArray(allTags)) {
    console.warn('[validateZonasAgainstCatalog] No hay tags disponibles para validar zonas');
    return [];
  }

  // Crear un mapa de tags de zona por ID
  const zonaTagsById = new Map<number, any>();
  allTags
    .filter((tag) => tag?.tipo === 'zona')
    .forEach((tag) => {
      if (tag?.id) {
        zonaTagsById.set(tag.id, tag);
      }
    });

  // Obtener todos los slugs válidos del catálogo
  const validSlugs = new Set<string>();
  ZONAS_CATALOG.forEach((group) => {
    group.items.forEach((item) => {
      validSlugs.add(item.slug.toLowerCase().trim());
      // También agregar variantes con guiones y guiones bajos
      validSlugs.add(item.slug.toLowerCase().trim().replace(/_/g, '-'));
      validSlugs.add(item.slug.toLowerCase().trim().replace(/-/g, '_'));
    });
  });

  // Función para normalizar slugs
  const normalizeSlug = (slug?: string | null) =>
    String(slug ?? '')
      .trim()
      .toLowerCase();

  // Validar cada ID: debe existir en tags y su slug debe estar en el catálogo
  const validIds = normalizedIds.filter((id) => {
    const tag = zonaTagsById.get(id);
    if (!tag) {
      console.warn(`[validateZonasAgainstCatalog] Tag con ID ${id} no encontrado`);
      return false;
    }

    const tagSlug = normalizeSlug(tag.slug || tag.nombre);
    if (!tagSlug) {
      console.warn(`[validateZonasAgainstCatalog] Tag con ID ${id} no tiene slug ni nombre`);
      return false;
    }

    // Verificar si el slug está en el catálogo (con variantes)
    const isValid = validSlugs.has(tagSlug) ||
                    validSlugs.has(tagSlug.replace(/_/g, '-')) ||
                    validSlugs.has(tagSlug.replace(/-/g, '_'));

    if (!isValid) {
      console.warn(
        `[validateZonasAgainstCatalog] Zona con ID ${id} (slug: "${tagSlug}") no está en el catálogo`
      );
    }

    return isValid;
  });

  return validIds;
}

/**
 * Hook helper para validar zonas antes de guardar
 */
export function useValidatedZonas(
  selectedZonaIds: (number | null | undefined)[] | null | undefined,
  allTags?: any[] | null
): number[] {
  return validateZonasAgainstCatalog(selectedZonaIds, allTags);
}

