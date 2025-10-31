import React from "react";
import RitmosChips from "../RitmosChips";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";

type Tag = { id: number; nombre: string };

type RitmosSelectorEditorProps = {
  selected: string[];
  ritmoTags: Tag[];
  setField: (key: string, value: any) => void;
  allowedIds?: string[];
};

export default function RitmosSelectorEditor({ selected, ritmoTags, setField, allowedIds }: RitmosSelectorEditorProps) {
  const onChangeCatalog = (ids: string[]) => {
    // Guardar selección de catálogo directamente
    setField('ritmos_seleccionados' as any, ids as any);
    // Intentar mapear también a ids de tags si existen (no bloqueante)
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(group => group.items.forEach(item => labelByCatalogId.set(item.id, item.label)));
      const nameToTagId = new Map<string, number>(ritmoTags.map((t: any) => [t.nombre, t.id]));
      const mappedTagIds = ids
        .map(cid => labelByCatalogId.get(cid))
        .filter(Boolean)
        .map((label: any) => nameToTagId.get(label as string))
        .filter((n): n is number => typeof n === 'number');
      setField('ritmos' as any, mappedTagIds as any);
    } catch {}
  };

  return (
    <RitmosChips selected={selected} onChange={onChangeCatalog} allowedIds={allowedIds} />
  );
}


