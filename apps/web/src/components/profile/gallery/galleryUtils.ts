import { toDirectPublicStorageUrl } from "../../../utils/imageOptimization";
import type { OrganizerGalleryItem } from "./galleryTypes";

export const ORGANIZER_PHOTO_SLOTS = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
] as const;

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOrganizerMedia(raw: unknown): OrganizerGalleryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      const slot = toText(item?.slot);
      const url = toText(item?.url || item?.path);
      const kind: "photo" | "video" =
        item?.kind === "video" || item?.type === "video" ? "video" : "photo";
      if (!slot || !url) return null;
      return {
        id: toText(item?.id) || `${slot}-${url}`,
        slot,
        url,
        kind,
        created_at: toText(item?.created_at) || undefined,
        title: toText(item?.title) || undefined,
      } satisfies OrganizerGalleryItem;
    })
    .filter(Boolean) as OrganizerGalleryItem[];
}

export function isPhotoSlot(slot: string): slot is (typeof ORGANIZER_PHOTO_SLOTS)[number] {
  return (ORGANIZER_PHOTO_SLOTS as readonly string[]).includes(slot);
}

export function normalizePhotoUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  return toDirectPublicStorageUrl(trimmed) || trimmed;
}

export function getOrganizerPhotos(rawMedia: unknown): OrganizerGalleryItem[] {
  const media = normalizeOrganizerMedia(rawMedia);
  const bySlot = new Map<string, OrganizerGalleryItem>();
  for (const item of media) {
    if (item.kind !== "photo") continue;
    if (!isPhotoSlot(item.slot)) continue;
    bySlot.set(item.slot, item);
  }
  return ORGANIZER_PHOTO_SLOTS.map((slot) => bySlot.get(slot)).filter(
    (item): item is OrganizerGalleryItem => Boolean(item)
  );
}

export function getAvailablePhotoSlots(media: unknown): string[] {
  const used = new Set(getOrganizerPhotos(media).map((item) => item.slot));
  return ORGANIZER_PHOTO_SLOTS.filter((slot) => !used.has(slot));
}

export function swapPhotoSlots(rawMedia: unknown, slotA: string, slotB: string): any[] {
  if (!Array.isArray(rawMedia) || slotA === slotB) return Array.isArray(rawMedia) ? [...rawMedia] : [];
  return rawMedia.map((entry: any) => {
    if (entry?.slot === slotA) return { ...entry, slot: slotB };
    if (entry?.slot === slotB) return { ...entry, slot: slotA };
    return entry;
  });
}
