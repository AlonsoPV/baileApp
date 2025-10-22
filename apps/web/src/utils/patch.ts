export function pickDefined<T extends object>(obj: Partial<T>): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export function diffPatch<T extends Record<string, any>>(prev: Partial<T>, next: Partial<T>): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(next)) {
    const a = (prev as any)[k];
    const b = (next as any)[k];
    
    // Comparación profunda para arrays y objetos
    const equal =
      Array.isArray(a) && Array.isArray(b)
        ? a.length === b.length && a.every((v, i) => v === b[i])
        : JSON.stringify(a) === JSON.stringify(b);
    
    if (!equal) (out as any)[k] = b;
  }
  return out;
}

export function cleanUndefined<T extends Record<string, any>>(obj: Partial<T>): Partial<T> {
  const o: Partial<T> = {};
  Object.keys(obj).forEach(k => {
    const v = (obj as any)[k];
    if (v !== undefined) (o as any)[k] = v;
  });
  return o;
}
