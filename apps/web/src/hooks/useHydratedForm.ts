import React from "react";
import { useDrafts } from "../state/drafts";

// merge superficial con objetos; lo profundo lo hace SQL
function deepMerge<T>(a: T, b: any): T {
  if (Array.isArray(a) || Array.isArray(b)) return (b ?? a) as T;
  const out: any = { ...(a as any) };
  for (const k of Object.keys(b || {})) {
    const nv = (b as any)[k], pv = (a as any)[k];
    out[k] =
      nv && typeof nv === "object" && !Array.isArray(nv) &&
      pv && typeof pv === "object" && !Array.isArray(pv)
        ? deepMerge(pv, nv)
        : nv;
  }
  return out;
}

function isMeaningfulDraft(v: any) {
  return v && typeof v === "object" && JSON.stringify(v) !== "{}";
}

type Opt<T> = {
  draftKey: string;
  serverData?: (T & { updated_at?: string }) | null;
  defaults: T;
  preferDraft?: boolean;
};

export function useHydratedForm<T extends Record<string, any>>({
  draftKey,
  serverData,
  defaults,
  preferDraft = true,
}: Opt<T>) {
  const { getDraft, setDraft } = useDrafts();
  const draftRec = getDraft(draftKey);
  const draftVal = draftRec?.value as T | undefined;

  const [form, setForm] = React.useState<T>(defaults);
  const [hydrated, setHydrated] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const srvStamp = serverData?.updated_at || JSON.stringify(serverData ?? {});
  const srvRef = React.useRef<string | null>(null);

  // Hidratación inicial: NO escribir en draft durante render
  React.useEffect(() => {
    if (hydrated) return;

    if (preferDraft && isMeaningfulDraft(draftVal)) {
      setForm(draftVal as T);
      setHydrated(true);
      return;
    }

    if (serverData) {
      const base = deepMerge(defaults, serverData as any);
      setForm(base);
      setHydrated(true);
      srvRef.current = srvStamp;
      // si quieres persistir el draft inicial, hazlo en otro efecto (ver abajo)
      return;
    }

    setForm(defaults);
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, draftKey, !!serverData]);

  // Persistir el form *ya hidratado* al draft (post-render)
  React.useEffect(() => {
    if (!hydrated) return;
    // sólo persistimos cuando el usuario ya interactuó o cuando vino del server
    // evita escrituras redundantes que disparen la advertencia
    setDraft(draftKey, form);
    // Nota: si te preocupa el spam de escrituras, puedes debouncer aquí.
  }, [hydrated, form, draftKey, setDraft]);

  // Si cambia el server y el usuario NO está editando, resincroniza
  React.useEffect(() => {
    if (!hydrated || !serverData) return;
    if (srvRef.current === srvStamp) return;
    if (!dirty) {
      setForm((cur) => deepMerge(cur, serverData as any));
      srvRef.current = srvStamp;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srvStamp, hydrated, dirty, draftKey]);

  const setField = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setForm((cur) => ({ ...cur, [key]: value }));
      if (!dirty) setDirty(true);
    },
    [dirty]
  );

  const setAll = React.useCallback((next: T) => {
    setForm(next);
    if (!dirty) setDirty(true);
  }, [dirty]);

  const setNested = React.useCallback(
    (path: string, value: any) => {
      setForm((cur) => {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        
        let current: any = { ...cur };
        let pointer: any = current;
        
        // Navegar hasta el penúltimo nivel
        for (const key of keys) {
          if (!(key in pointer) || typeof pointer[key] !== 'object') {
            pointer[key] = {};
          } else {
            pointer[key] = { ...pointer[key] };
          }
          pointer = pointer[key];
        }
        
        // Actualizar el valor final
        pointer[lastKey] = value;
        
        return current;
      });
      if (!dirty) setDirty(true);
    },
    [dirty]
  );

  // Llamar después de guardar y refetch (para alinear draft+form con server)
  const setFromServer = React.useCallback((server: T & { updated_at?: string }) => {
    const merged = deepMerge(defaults, server as any);
    setForm(merged);
    srvRef.current = server.updated_at || JSON.stringify(server);
    setDirty(false);
    // Persistimos en el efecto de arriba (no aquí en render)
  }, [defaults]);

  return { form, setField, setAll, setNested, hydrated, dirty, setFromServer };
}
