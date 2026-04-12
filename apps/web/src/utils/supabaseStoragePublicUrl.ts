import { supabase } from "@/lib/supabase";
import { withStableCacheBust } from "./cacheBuster";
import { toDirectPublicStorageUrl } from "./imageOptimization";

type BuildStoragePublicUrlOptions = {
  bucket?: string;
  version?: string | number | null;
};

export function buildSupabaseStoragePublicUrl(
  path: string,
  options?: BuildStoragePublicUrlOptions
): string {
  const bucket = options?.bucket || "media";
  const baseUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return withStableCacheBust(baseUrl, options?.version ?? null) ?? baseUrl;
}

/**
 * Resolves a Supabase Storage reference to a public URL.
 *
 * Supports:
 * - Full URLs (http/https), data: URIs, and absolute paths ("/...") → returned as-is
 * - "bucket/path" → uses that bucket
 * - "avatars/..." (or any "folder/...") without bucket → assumes default bucket ("media")
 * - "filename.ext" without slashes → assumes default bucket ("media")
 *
 * This avoids bugs where "avatars/..." was misread as bucket="avatars" and produced truncated/broken URLs.
 */
export function resolveSupabaseStoragePublicUrl(
  maybePath?: string | null,
  options?: { defaultBucket?: string }
): string | undefined {
  if (!maybePath) return undefined;
  const v = String(maybePath).trim();
  if (!v) return undefined;

  // Already a URL / absolute path → normalizar bucket erróneo AVATARS (debe ser media/avatars)
  if (/^https?:\/\//i.test(v) || v.startsWith("data:") || v.startsWith("/")) {
    if (v.includes("/storage/v1/object/public/AVATARS/")) {
      return v.replace("/storage/v1/object/public/AVATARS/", "/storage/v1/object/public/media/avatars/");
    }
    return v;
  }

  const defaultBucket = options?.defaultBucket || "media";
  const knownBuckets = new Set([defaultBucket, "media"]);

  let bucket = defaultBucket;
  let path = v;

  const slash = v.indexOf("/");
  if (slash > 0) {
    const first = v.slice(0, slash);
    const rest = v.slice(slash + 1);
    if (knownBuckets.has(first)) {
      bucket = first;
      path = rest;
    } else {
      // Treat entire string as a path inside default bucket (e.g. "avatars/...")
      bucket = defaultBucket;
      // Normalizar bucket erróneo en path: AVATARS/xxx → avatars/xxx
      path = first.toLowerCase() === "avatars" ? `avatars/${rest}` : v;
    }
  }

  try {
    return buildSupabaseStoragePublicUrl(path, { bucket });
  } catch {
    return v;
  }
}

export function resolveVersionedSupabaseStoragePublicUrl(
  maybePath?: string | null,
  version?: string | number | null,
  options?: { defaultBucket?: string }
): string | undefined {
  const resolved = resolveSupabaseStoragePublicUrl(maybePath, options);
  return withStableCacheBust(resolved, version ?? null) ?? resolved;
}

export function resolveVersionedSupabaseStorageDirectUrl(
  maybePath?: string | null,
  version?: string | number | null,
  options?: { defaultBucket?: string }
): string | undefined {
  const resolved = resolveVersionedSupabaseStoragePublicUrl(maybePath, version, options);
  return toDirectPublicStorageUrl(resolved) ?? resolved;
}

