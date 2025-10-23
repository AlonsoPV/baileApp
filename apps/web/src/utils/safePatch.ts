/**
 * Utilidades para construcción de patches seguros
 * Evita pérdida de datos al editar cualquier entidad
 */

/**
 * Limpia vacíos y undefined en profundidad
 */
export function pruneEmptyDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    const arr = obj.map(pruneEmptyDeep).filter(v => v !== undefined);
    return arr as any;
  }
  
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const k of Object.keys(obj as any)) {
      const v = pruneEmptyDeep((obj as any)[k]);
      if (v === undefined) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
      out[k] = v;
    }
    return out;
  }
  
  return obj;
}

/**
 * Merge profundo de objetos
 * Arrays se reemplazan completos (no se fusionan)
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  if (source === undefined || source === null) return target;
  if (Array.isArray(target) || Array.isArray(source)) return source as T;
  
  const out: any = { ...(target as any) };
  for (const k of Object.keys(source)) {
    const s = (source as any)[k];
    const t = (target as any)[k];
    
    if (s && typeof s === "object" && !Array.isArray(s) && 
        t && typeof t === "object" && !Array.isArray(t)) {
      out[k] = deepMerge(t, s);
    } else {
      out[k] = s;
    }
  }
  return out;
}

/**
 * Construye un patch seguro para cualquier entidad
 * - Fusiona objetos (JSON) sobre prev
 * - Arrays solo si se pasan (respeta "vaciar" si está permitido)
 * - Borra undefined y strings vacíos
 * - Solo envía lo que cambió
 */
export function buildSafePatch<T extends Record<string, any>>(
  prev: Partial<T>,
  next: Partial<T>,
  opts?: { allowEmptyArrays?: (keyof T)[] }
): Partial<T> {
  const merged: any = { ...(prev || {}) };

  // 1) Fusionar objetos (json) y asignar escalares/arrays
  for (const k of Object.keys(next || {})) {
    const nv = (next as any)[k];
    const pv = (prev as any)?.[k];
    
    if (nv === undefined) continue;

    // Merge profundo para objetos
    if (nv && typeof nv === "object" && !Array.isArray(nv) && 
        pv && typeof pv === "object" && !Array.isArray(pv)) {
      merged[k] = deepMerge(pv, nv);
    } else {
      merged[k] = nv;
    }
  }

  // 2) Remover vacíos no intencionados
  const cleaned = pruneEmptyDeep(merged);

  // 3) Convertir en diff: solo enviar lo que cambió
  const patch: any = {};
  const keys = new Set([...Object.keys(cleaned || {}), ...Object.keys(prev || {})]);
  
  for (const k of keys) {
    const a = (prev as any)?.[k];
    const b = (cleaned as any)?.[k];
    const equal = JSON.stringify(a) === JSON.stringify(b);
    
    if (!equal) {
      // Control arrays vacíos
      if (Array.isArray(b) && b.length === 0) {
        const allowed = (opts?.allowEmptyArrays || []) as string[];
        if (!allowed.includes(k)) continue; // No mandar vacío accidental
      }
      patch[k] = b;
    }
  }

  return patch;
}

/**
 * Verifica si dos valores son iguales (comparación profunda)
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}
