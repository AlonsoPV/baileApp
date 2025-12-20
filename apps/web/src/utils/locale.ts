/**
 * Obtiene el locale apropiado para formatear fechas según el idioma
 * @param lang - Idioma actual ('es' o 'en')
 * @returns Locale para formatear fechas ('es-ES' o 'en-US')
 */
export function getLocale(lang: string): 'es-ES' | 'en-US' {
  // Si el idioma empieza con "en", usar "en-US"
  if (lang && lang.startsWith('en')) {
    return 'en-US';
  }
  // Por defecto, usar "es-ES"
  return 'es-ES';
}

/**
 * Obtiene el locale desde i18n actual
 * Útil cuando no tienes acceso directo al idioma
 * Usa importación dinámica para evitar dependencias circulares
 */
export function getLocaleFromI18n(): 'es-ES' | 'en-US' {
  try {
    // Importación dinámica para evitar dependencias circulares
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const i18n = require('../i18n').default;
    const lang = i18n.language || 'es';
    return getLocale(lang);
  } catch {
    // Fallback si i18n no está disponible
    return 'es-ES';
  }
}

