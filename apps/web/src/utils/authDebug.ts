/**
 * Helper para logs estructurados de autenticación con flag BAILEAPP_AUTH_DEBUG (Web)
 */

/**
 * Verifica si el flag de debug está activo
 */
export function shouldAuthDebug(): boolean {
  // En desarrollo siempre activo
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Verificar flag en window o process.env
  const env = (window as any).BAILEAPP_AUTH_DEBUG ?? (process as any)?.env?.BAILEAPP_AUTH_DEBUG;
  if (typeof env === "boolean") return env;
  const s = String(env ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/**
 * Log estructurado con prefijo [WEB]
 */
export function logWeb(message: string, data?: any): void {
  if (!shouldAuthDebug()) return;
  if (data) {
    console.log(`[WEB] ${message}`, data);
  } else {
    console.log(`[WEB] ${message}`);
  }
}

/**
 * Helper para enmascarar valores sensibles en logs
 */
export function mask(value: string | null | undefined): string {
  const t = String(value ?? "").trim();
  if (!t) return "(empty)";
  if (t.length <= 10) return `${t.slice(0, 2)}...${t.slice(-2)}`;
  return `${t.slice(0, 6)}...${t.slice(-6)}`;
}
