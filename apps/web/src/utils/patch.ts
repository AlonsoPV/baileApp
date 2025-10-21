export function pickDefined<T extends object>(obj: Partial<T>): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}
