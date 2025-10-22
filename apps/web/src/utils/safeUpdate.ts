import { diffPatch, cleanUndefined } from "./patch";

type GuardOpts = {
  allowEmptyArrays?: (keyof any)[]; // keys en las que [] es válido explícitamente
  blockEmptyStrings?: (keyof any)[]; // keys que no deben quedar "" accidentalmente
};

export function guardedPatch<T extends Record<string, any>>(
  prev: Partial<T>,
  next: Partial<T>,
  opts: GuardOpts = {}
): Partial<T> {
  // Primero obtener el diff y limpiar undefined
  const patch: Partial<T> = cleanUndefined(diffPatch(prev, next));
  
  for (const key of Object.keys(patch)) {
    const val = (patch as any)[key];

    // Si llega undefined, bórralo del patch
    if (val === undefined) {
      delete (patch as any)[key];
      continue;
    }

    // Evita vaciar arrays a menos que esté permitido
    if (Array.isArray(val) && val.length === 0) {
      const allowed = (opts.allowEmptyArrays || []) as string[];
      if (!allowed.includes(key)) {
        console.warn(`[guardedPatch] Prevented empty array for key: ${key}`);
        delete (patch as any)[key];
      }
    }

    // Evita strings vacíos si no están permitidos
    if (typeof val === "string" && val.trim() === "") {
      const blocked = (opts.blockEmptyStrings || []) as string[];
      if (blocked.includes(key)) {
        console.warn(`[guardedPatch] Prevented empty string for key: ${key}`);
        delete (patch as any)[key];
      }
    }
  }
  
  return patch;
}

// Reexport para evitar imports cruzados
export { diffPatch, cleanUndefined };

