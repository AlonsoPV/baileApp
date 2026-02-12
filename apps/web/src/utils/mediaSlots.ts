export const COVER_SLOT = "cover" as const;
export const PHOTO_SLOTS = ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10"] as const;
export const VIDEO_SLOTS = ["v1","v2","v3"] as const;
export type CoverSlot = typeof COVER_SLOT;
export type PhotoSlot = typeof PHOTO_SLOTS[number];
export type VideoSlot = typeof VIDEO_SLOTS[number];
export type MediaSlot = CoverSlot | PhotoSlot | VideoSlot;

export type MediaItem = {
  slot: string;
  kind: "photo"|"video";
  url: string;
  thumb?: string;
  title?: string;
};

/** Normaliza media: si viene como string JSON desde la API, lo parsea a array. */
export function normalizeMediaArray(raw: unknown): MediaItem[] {
  if (Array.isArray(raw)) {
    return raw.map((m: any) => ({
      slot: m?.slot ?? '',
      kind: (m?.kind ?? (m?.type === 'video' ? 'video' : 'photo')) as 'photo' | 'video',
      url: typeof m?.url === 'string' ? m.url : '',
      thumb: typeof m?.thumb === 'string' ? m.thumb : undefined,
      title: typeof m?.title === 'string' ? m.title : undefined,
    })).filter((m: MediaItem) => m.slot && m.url);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return normalizeMediaArray(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export function getMediaBySlot(list: MediaItem[] = [], slot: string) {
  return list.find(m => m.slot === slot);
}

export function upsertMediaSlot(list: MediaItem[], item: MediaItem) {
  const i = list.findIndex(x => x.slot === item.slot);
  const next = [...list];
  if (i >= 0) next[i] = item; else next.push(item);
  return next;
}

export function removeMediaSlot(list: MediaItem[], slot: string) {
  return list.filter(x => x.slot !== slot);
}

