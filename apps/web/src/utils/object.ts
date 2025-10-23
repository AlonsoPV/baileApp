/**
 * Utilidades para manipulación de objetos
 * Incluye funciones para limpiar objetos vacíos y merge profundo
 */

/**
 * Verifica si un valor es un objeto vacío
 */
export function isEmptyObject(o: any): boolean {
  return o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length === 0;
}

/**
 * Elimina valores vacíos de forma recursiva
 * - Strings vacíos
 * - Objetos vacíos
 * - undefined
 */
export function pruneEmptyDeep<T>(obj: T): T {
  // Si es array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(pruneEmptyDeep).filter(v => v !== undefined) as any;
  }
  
  // Si es objeto, procesar cada propiedad
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const k of Object.keys(obj as any)) {
      const v = pruneEmptyDeep((obj as any)[k]);
      
      // Skip undefined
      if (v === undefined) continue;
      
      // Skip strings vacíos
      if (typeof v === "string" && v.trim() === "") continue;
      
      // Skip objetos vacíos
      if (isEmptyObject(v)) continue;
      
      out[k] = v;
    }
    return out;
  }
  
  return obj;
}

/**
 * Fusiona dos objetos de forma profunda
 * El source pisa al target, pero respeta subclaves que no están en source
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  // Si alguno es array, retorna el source
  if (Array.isArray(target) || Array.isArray(source)) {
    return source as T;
  }
  
  // Clonar target
  const out: any = { ...(target as any) };
  
  // Procesar cada key de source
  for (const k of Object.keys(source || {})) {
    const sv: any = (source as any)[k];
    const tv: any = (target as any)[k];
    
    // Si ambos son objetos, merge recursivo
    if (
      sv && typeof sv === "object" && !Array.isArray(sv) &&
      tv && typeof tv === "object" && !Array.isArray(tv)
    ) {
      out[k] = deepMerge(tv, sv);
    } else {
      out[k] = sv;
    }
  }
  
  return out;
}

/**
 * Compara dos objetos de forma superficial
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => a[key] === b[key]);
}

/**
 * Obtiene un valor anidado de un objeto usando una ruta
 * Ejemplo: get(obj, 'user.profile.name')
 */
export function get(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Establece un valor anidado en un objeto usando una ruta
 * Ejemplo: set(obj, 'user.profile.name', 'John')
 */
export function set(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  
  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return obj;
}
