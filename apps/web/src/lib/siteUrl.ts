const DEFAULT_SITE_URL = "https://dondebailar.com.mx";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readViteEnv(): Record<string, unknown> | undefined {
  try {
    return (import.meta as unknown as { env?: Record<string, unknown> }).env;
  } catch {
    return undefined;
  }
}

function readProcessEnv(): Record<string, string | undefined> | undefined {
  try {
    return typeof process !== "undefined" ? process.env : undefined;
  } catch {
    return undefined;
  }
}

export function resolveSiteUrl(
  env?: Record<string, string | undefined> | undefined,
): string {
  const viteEnv = readViteEnv();
  const processEnv = readProcessEnv();
  const raw =
    env?.VITE_SITE_URL ||
    env?.SITE_URL ||
    (typeof viteEnv?.VITE_SITE_URL === "string" ? viteEnv.VITE_SITE_URL : undefined) ||
    processEnv?.VITE_SITE_URL ||
    processEnv?.SITE_URL ||
    processEnv?.VERCEL_PROJECT_PRODUCTION_URL ||
    (processEnv?.VERCEL_URL ? `https://${processEnv.VERCEL_URL}` : undefined) ||
    DEFAULT_SITE_URL;

  return trimTrailingSlash(String(raw || DEFAULT_SITE_URL));
}

export const SITE_URL = resolveSiteUrl();
