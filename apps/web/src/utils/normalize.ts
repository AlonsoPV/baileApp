/**
 * Utilidades para normalizar entradas de formularios
 * Convierte valores vacíos a null, limpia strings, etc.
 */

/**
 * Normaliza inputs de redes sociales
 * - Trim de strings
 * - Convierte strings vacíos a null
 * - Limpia números de WhatsApp
 */
export function normalizeSocialInput(s: any) {
  const out: any = { ...s };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'string') {
      out[k] = out[k].trim();
      if (out[k] === '') out[k] = null;
    }
  }
  if (out.whatsapp && typeof out.whatsapp === 'string') {
    out.whatsapp = out.whatsapp.replace(/\D+/g, '');
  }
  return out;
}

/**
 * Asegura que un valor sea un array de números
 * Útil para ritmos, zonas, estilos, etc.
 */
export function ensureArrayIds(v: any): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x: any) => Number(x)).filter(Boolean);
}

/**
 * Convierte strings vacíos a null en un objeto
 * Útil para limpiar formularios antes de enviar
 */
export function coerceEmptyToNulls(obj: any) {
  const o: any = {};
  for (const k of Object.keys(obj || {})) {
    const v = obj[k];
    o[k] = (typeof v === 'string' && v.trim() === '') ? null : v;
  }
  return o;
}

/**
 * Normaliza un objeto de preguntas personalizadas
 * Convierte strings vacíos a null
 */
export function normalizeQuestions(obj: any) {
  const o: any = {};
  for (const k of Object.keys(obj || {})) {
    const v = obj[k];
    if (typeof v === 'string') {
      o[k] = v.trim() === '' ? null : v.trim();
    } else {
      o[k] = v;
    }
  }
  return o;
}

/**
 * Normaliza un objeto de cronograma
 * Mantiene la estructura pero limpia strings vacíos
 */
export function normalizeCronograma(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const o: any = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') {
      o[k] = v.trim() === '' ? null : v.trim();
    } else if (typeof v === 'object' && v !== null) {
      o[k] = normalizeCronograma(v);
    } else {
      o[k] = v;
    }
  }
  return o;
}

/**
 * Normaliza un objeto de costos
 * Mantiene la estructura pero limpia strings vacíos
 */
export function normalizeCostos(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const o: any = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') {
      o[k] = v.trim() === '' ? null : v.trim();
    } else if (typeof v === 'object' && v !== null) {
      o[k] = normalizeCostos(v);
    } else {
      o[k] = v;
    }
  }
  return o;
}
