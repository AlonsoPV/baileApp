// path: src/hooks/useHydratedForm.ts
import React from "react";
import { useDrafts } from "../state/drafts";

type DraftRecord<T> = {
  value: T;
  serverStamp?: string | null;
};

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(a: T, b: any): T {
  if (Array.isArray(a) || Array.isArray(b)) return (b ?? a) as T;
  if (!isPlainObject(a) || !isPlainObject(b)) return (b ?? a) as T;

  const out: any = { ...(a as any) };
  for (const k of Object.keys(b || {})) {
    const nv = (b as any)[k];
    const pv = (a as any)[k];
    out[k] = isPlainObject(nv) && isPlainObject(pv) ? deepMerge(pv, nv) : nv;
  }
  return out;
}

function isMeaningfulDraft(v: any) {
  return isPlainObject(v) && JSON.stringify(v) !== "{}";
}

/**
 * Protege arrays tipo "NOT NULL" (ej. ritmos_seleccionados) contra null.
 * Ajusta esta lista si tienes más campos array NOT NULL.
 */
function sanitizeNotNullArrays<T extends Record<string, any>>(obj: T): T {
  const out: any = { ...obj };
  if (out.ritmos_seleccionados === null) out.ritmos_seleccionados = [];
  if (out.ritmos === null) out.ritmos = [];
  if (out.zonas === null) out.zonas = [];
  return out as T;
}

type Opt<T> = {
  draftKey: string;
  serverData?: (T & { updated_at?: string }) | null;
  defaults: T;
  preferDraft?: boolean;
  draftDebounceMs?: number;
};

export function useHydratedForm<T extends Record<string, any>>({
  draftKey,
  serverData,
  defaults,
  preferDraft = true,
  draftDebounceMs = 400,
}: Opt<T>) {
  const { getDraft, setDraft } = useDrafts();

  const serverStamp = serverData?.updated_at ?? null;

  const draftRaw = getDraft(draftKey) as { value?: any } | undefined;
  const draftRec = (draftRaw?.value ?? null) as DraftRecord<T> | null;
  const draftVal = draftRec?.value as T | undefined;
  const draftStamp = draftRec?.serverStamp ?? null;

  const [form, setForm] = React.useState<T>(sanitizeNotNullArrays(defaults));
  const [hydrated, setHydrated] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const srvRef = React.useRef<string | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  // Hidratación inicial robusta
  React.useEffect(() => {
    if (hydrated) return;

    const canUseDraft =
      preferDraft &&
      isMeaningfulDraft(draftVal) &&
      (!serverStamp || draftStamp === serverStamp);

    if (canUseDraft) {
      setForm(sanitizeNotNullArrays(draftVal as T));
      setHydrated(true);
      srvRef.current = serverStamp;
      return;
    }

    if (serverData) {
      const base = deepMerge(sanitizeNotNullArrays(defaults), serverData as any);
      setForm(sanitizeNotNullArrays(base));
      setHydrated(true);
      srvRef.current = serverStamp;
      return;
    }

    setForm(sanitizeNotNullArrays(defaults));
    setHydrated(true);
    srvRef.current = serverStamp;
  }, [
    hydrated,
    preferDraft,
    draftKey,
    draftVal,
    draftStamp,
    serverData,
    serverStamp,
    defaults,
  ]);

  // Persistir draft con debounce (evita spam/races)
  React.useEffect(() => {
    if (!hydrated) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const rec: DraftRecord<T> = {
        value: sanitizeNotNullArrays(form),
        serverStamp: srvRef.current ?? serverStamp,
      };
      setDraft(draftKey, rec);
    }, draftDebounceMs);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [hydrated, form, draftKey, setDraft, draftDebounceMs, serverStamp]);

  // Resync: si cambia el server y el usuario NO está editando, reemplazar por server+defaults
  React.useEffect(() => {
    if (!hydrated || !serverData) return;
    if (srvRef.current === serverStamp) return;
    if (dirty) return;

    const next = deepMerge(sanitizeNotNullArrays(defaults), serverData as any);
    setForm(sanitizeNotNullArrays(next));
    srvRef.current = serverStamp;
  }, [hydrated, serverData, serverStamp, dirty, defaults]);

  const setField = React.useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((cur) => sanitizeNotNullArrays({ ...cur, [key]: value } as T));
    setDirty(true);
  }, []);

  const setAll = React.useCallback((next: T) => {
    setForm(sanitizeNotNullArrays(next));
    setDirty(true);
  }, []);

  const setNested = React.useCallback((path: string, value: any) => {
    setForm((cur) => {
      const keys = path.split(".");
      const lastKey = keys.pop()!;
      const root: any = Array.isArray(cur) ? [...(cur as any)] : { ...cur };

      let pointer: any = root;
      for (const key of keys) {
        const pv = pointer[key];
        if (pv == null) pointer[key] = {};
        else if (Array.isArray(pv)) pointer[key] = [...pv];
        else if (isPlainObject(pv)) pointer[key] = { ...pv };
        else pointer[key] = {};
        pointer = pointer[key];
      }
      pointer[lastKey] = value;
      return sanitizeNotNullArrays(root as T);
    });
    setDirty(true);
  }, []);

  const setFromServer = React.useCallback(
    (server: T & { updated_at?: string }) => {
      const merged = deepMerge(sanitizeNotNullArrays(defaults), server as any);
      setForm(sanitizeNotNullArrays(merged));
      srvRef.current = server.updated_at ?? null;
      setDirty(false);
    },
    [defaults]
  );

  return { form, setField, setAll, setNested, hydrated, dirty, setFromServer };
}