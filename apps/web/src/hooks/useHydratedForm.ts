import React from "react";
import { useDrafts } from "../state/drafts";
import { deepMerge } from "../utils/safePatch";

// Draft vacío = objeto sin claves útiles o con strings vacíos
function isMeaningfulDraft(v: any) {
  if (!v || typeof v !== "object") return false;
  const json = JSON.stringify(v);
  // sin contenido o solo defaults vacíos
  return json !== "{}" && !/^\s*$/.test(json);
}

type Options<T> = {
  draftKey: string;             // ej: draft:user:profile:<userId>
  serverData?: (T & { updated_at?: string }) | null;
  defaults: T;                  // Forma por defecto del formulario
  preferDraft?: boolean;        // true: si hay draft, usa draft primero
};

/**
 * Hook para formularios con hidratación única y persistencia de borradores
 * 
 * Características:
 * - Hidrata UNA SOLA VEZ desde draft o server
 * - Persiste cada cambio en localStorage
 * - No pierde datos al cambiar de pestaña/rol
 * - Merge inteligente con datos del servidor
 * 
 * Ejemplo de uso:
 * ```typescript
 * const { form, setField, setAll, hydrated } = useHydratedForm({
 *   draftKey: "draft:user:profile",
 *   serverData: profile,
 *   defaults: { display_name: "", bio: "", ritmos: [] },
 *   preferDraft: true
 * });
 * 
 * // Cambiar un campo
 * setField("display_name", "Nuevo Nombre");
 * 
 * // Cambiar todo el formulario
 * setAll({ ...form, bio: "Nueva bio" });
 * ```
 */
export function useHydratedForm<T extends Record<string, any>>({
  draftKey,
  serverData,
  defaults,
  preferDraft = true,
}: Options<T>) {
  const { getDraft, setDraft } = useDrafts();
  const draftRec = getDraft(draftKey);
  const draftVal = draftRec?.value as T | undefined;

  const [form, setForm] = React.useState<T>(defaults);
  const [hydrated, setHydrated] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  // mantén un sello del server para detectar cambios reales
  const serverStamp = serverData?.updated_at || JSON.stringify(serverData ?? {});
  const serverStampRef = React.useRef<string | null>(null);

  // Hidratación inicial: prioridad => draft significativo > server > defaults
  React.useEffect(() => {
    if (hydrated) return;
    if (preferDraft && isMeaningfulDraft(draftVal)) {
      setForm(draftVal as T);
      setHydrated(true);
      return;
    }
    if (serverData) {
      setForm(deepMerge(defaults, serverData as any));
      setHydrated(true);
      serverStampRef.current = serverStamp;
      return;
    }
    // sin server todavía
    setForm(defaults);
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, draftKey, !!serverData]);

  // Si cambia el server y el usuario NO está editando, rehidrata desde server
  React.useEffect(() => {
    if (!hydrated) return;
    if (!serverData) return;

    const prevStamp = serverStampRef.current;
    if (prevStamp === serverStamp) return; // no cambió

    if (!dirty) {
      setForm((cur) => deepMerge(cur, serverData as any));
      setDraft(draftKey, deepMerge(defaults, serverData as any));
      serverStampRef.current = serverStamp;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverStamp, hydrated, dirty, draftKey]);

  /**
   * Actualiza un campo específico y persiste en draft
   */
  const setField = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setForm((cur) => {
        const next = { ...cur, [key]: value };
        setDraft(draftKey, next);
        return next;
      });
      if (!dirty) setDirty(true);
    },
    [draftKey, dirty, setDraft]
  );

  const setAll = React.useCallback((next: T) => {
    setForm(() => {
      setDraft(draftKey, next);
      return next;
    });
    if (!dirty) setDirty(true);
  }, [draftKey, dirty, setDraft]);

  /**
   * Actualiza un campo anidado (ej: respuestas.redes.instagram)
   */
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
        
        setDraft(draftKey, current);
        return current;
      });
      if (!dirty) setDirty(true);
    },
    [draftKey, dirty, setDraft]
  );

  // Permite sincronizar tras guardar
  const setFromServer = React.useCallback((server: T & { updated_at?: string }) => {
    const merged = deepMerge(defaults, server as any);
    setForm(merged);
    setDraft(draftKey, merged);
    serverStampRef.current = server.updated_at || JSON.stringify(server);
    setDirty(false);
  }, [draftKey, defaults, setDraft]);

  return { 
    form, 
    setField, 
    setAll, 
    setNested,
    setFromServer,
    hydrated,
    dirty
  };
}
