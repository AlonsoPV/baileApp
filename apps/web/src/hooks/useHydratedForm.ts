import React from "react";
import { useDrafts } from "../state/drafts";
import { deepMerge } from "../utils/safePatch";

type Options<T> = {
  draftKey: string;             // Clave única del borrador
  serverData?: T | null;        // Datos actuales del servidor
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

  const draft = getDraft(draftKey)?.value as T | undefined;

  const [hydrated, setHydrated] = React.useState(false);
  const [form, setForm] = React.useState<T>(defaults);

  // Hidratación única: 1) borrador si existe y preferDraft; 2) serverData; 3) defaults
  React.useEffect(() => {
    if (hydrated) return;

    let base = { ...defaults };
    
    if (preferDraft && draft) {
      // Preferir draft si existe
      base = deepMerge(base, draft);
      console.log(`[useHydratedForm] Hydrated from draft: ${draftKey}`, draft);
    } else if (serverData) {
      // Usar datos del servidor
      base = deepMerge(base, serverData as any);
      console.log(`[useHydratedForm] Hydrated from server: ${draftKey}`, serverData);
    } else {
      console.log(`[useHydratedForm] Hydrated from defaults: ${draftKey}`);
    }

    setForm(base);
    setHydrated(true);
  }, [hydrated, draftKey, serverData]); // eslint-disable-line react-hooks/exhaustive-deps

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
    },
    [draftKey, setDraft]
  );

  /**
   * Reemplaza todo el formulario y persiste en draft
   */
  const setAll = React.useCallback((next: T) => {
    setForm(() => {
      setDraft(draftKey, next);
      return next;
    });
  }, [draftKey, setDraft]);

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
    },
    [draftKey, setDraft]
  );

  return { 
    form, 
    setField, 
    setAll, 
    setNested,
    hydrated 
  };
}
