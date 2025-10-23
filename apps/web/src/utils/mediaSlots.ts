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

