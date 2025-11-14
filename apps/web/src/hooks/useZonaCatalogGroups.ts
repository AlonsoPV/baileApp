import { useMemo } from 'react';
import { ZONAS_CATALOG } from '@/lib/zonasCatalog';

export interface ZonaGroupInfo {
  id: string;
  label: string;
  items: { id: number; label: string }[];
}

const normalizeSlug = (slug?: string | null) =>
  String(slug ?? '')
    .trim()
    .toLowerCase();

export function useZonaCatalogGroups(allTags?: any[] | null) {
  return useMemo(() => {
    if (!allTags || !Array.isArray(allTags)) {
      return { groups: [] as ZonaGroupInfo[] };
    }

    const zonaTags = allTags.filter((tag) => tag?.tipo === 'zona');
    const slugMap = new Map<string, any>();

    zonaTags.forEach((tag) => {
      const base = normalizeSlug(tag?.slug || tag?.nombre);
      if (!base) return;
      slugMap.set(base, tag);
      slugMap.set(base.replace(/_/g, '-'), tag);
      slugMap.set(base.replace(/-/g, '_'), tag);
    });

    const groups: ZonaGroupInfo[] = [];
    const usedIds = new Set<number>();

    ZONAS_CATALOG.forEach((group) => {
      const items = group.items
        .map((item) => {
          const matchedTag = slugMap.get(normalizeSlug(item.slug));
          if (!matchedTag) return null;
          usedIds.add(matchedTag.id);
          return { id: matchedTag.id, label: item.label };
        })
        .filter(Boolean) as { id: number; label: string }[];

      if (items.length) {
        groups.push({
          id: group.id,
          label: group.label,
          items,
        });
      }
    });

    const others = zonaTags
      .filter((tag) => !usedIds.has(tag.id))
      .map((tag) => ({ id: tag.id, label: tag.nombre }));

    if (others.length) {
      groups.push({
        id: 'other-zones',
        label: 'Otras zonas',
        items: others,
      });
    }

    return { groups };
  }, [allTags]);
}


