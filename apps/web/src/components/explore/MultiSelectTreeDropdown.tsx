/**
 * Dropdown jerárquico con multi-selección (padres expandibles, hijos con checkbox).
 * Usado para Ritmos y Zonas en Explore.
 */
import React, { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import type { TreeGroup } from "@/filters/exploreFilterGroups";

const PANEL_STYLE: React.CSSProperties = {
  position: "absolute",
  zIndex: 9999,
  minWidth: 280,
  maxHeight: "min(420px, calc(100vh - 120px))",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: "#101119",
  border: "1px solid #262a36",
  borderRadius: 12,
  padding: "0.75rem 0",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  color: "#f5f5ff",
  fontSize: 14,
};

export type MultiSelectTreeDropdownProps = {
  label: string;
  groups: TreeGroup[];
  selectedIds: number[];
  onChange: (nextIds: number[]) => void;
  placeholder?: string;
  search?: boolean;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Botón trigger (para posicionar el panel debajo). */
  triggerRef?: React.RefObject<HTMLElement | null>;
};

export function MultiSelectTreeDropdown({
  label,
  groups,
  selectedIds,
  onChange,
  placeholder = "Seleccionar…",
  search = true,
  anchorEl,
  open,
  onClose,
  triggerRef,
}: MultiSelectTreeDropdownProps) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => new Set(groups.map((g) => g.id)));
  const [draftIds, setDraftIds] = useState<number[]>(selectedIds);
  const [searchQuery, setSearchQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Sincronizar draft al abrir o al cambiar selectedIds desde fuera
  useEffect(() => {
    if (open) {
      setDraftIds([...selectedIds]);
      setSearchQuery("");
    }
  }, [open, selectedIds]);

  const toggleParent = useCallback((parentId: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  }, []);

  const toggleChild = useCallback((id: number) => {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllInParent = useCallback((group: TreeGroup) => {
    const childIds = group.children.map((c) => c.id);
    setDraftIds((prev) => {
      const allSelected = childIds.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !childIds.includes(id));
      return [...new Set([...prev, ...childIds])];
    });
  }, []);

  const handleClear = useCallback(() => {
    setDraftIds([]);
  }, []);

  const handleApply = useCallback(() => {
    onChange(draftIds);
    onClose();
  }, [draftIds, onChange, onClose]);

  // Click outside + ESC
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorEl?.contains(target) ||
        triggerRef?.current?.contains(target)
      )
        return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open, onClose, anchorEl, triggerRef]);

  // Posicionar panel debajo del ancla
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>(PANEL_STYLE);
  useEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setPanelStyle({
      ...PANEL_STYLE,
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, [open, anchorEl]);

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        children: g.children.filter(
          (c) => c.label.toLowerCase().includes(q) || String(c.id).includes(q),
        ),
      }))
      .filter((g) => g.children.length > 0);
  }, [groups, searchQuery]);

  if (!open) return null;

  const body = (
    <div
      ref={panelRef}
      style={panelStyle}
      className="multi-select-tree-dropdown"
      role="dialog"
      aria-label={label}
    >
      {search && (
        <div style={{ padding: "0 0.75rem 0.5rem", flex: "0 0 auto" }}>
          <input
            type="search"
            placeholder="Buscar…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #343947",
              background: "#181b26",
              color: "#f5f5ff",
              fontSize: 13,
            }}
          />
        </div>
      )}
      <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {filteredGroups.length === 0 ? (
          <div style={{ padding: "1rem 0.75rem", color: "rgba(255,255,255,0.6)" }}>
            Sin opciones
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedParents.has(group.id);
            const childIds = group.children.map((c) => c.id);
            const selectedInGroup = childIds.filter((id) => draftIds.includes(id));
            const allSelected = childIds.length > 0 && selectedInGroup.length === childIds.length;

            return (
              <div key={group.id} style={{ marginBottom: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0.75rem",
                    cursor: "pointer",
                    background: isExpanded ? "rgba(255,255,255,0.06)" : "transparent",
                    borderRadius: 6,
                  }}
                  onClick={() => toggleParent(group.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleParent(group.id);
                    }
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                      ▶
                    </span>
                    <span style={{ fontWeight: 600 }}>{group.label}</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                      ({selectedInGroup.length}/{group.children.length})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAllInParent(group);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: 11,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "transparent",
                      color: "rgba(255,255,255,0.9)",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    {allSelected ? "Quitar" : "Todos"}
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ paddingLeft: 20, paddingRight: 8 }}>
                    {group.children.map((child) => (
                      <label
                        key={child.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 0",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={draftIds.includes(child.id)}
                          onChange={() => toggleChild(child.id)}
                        />
                        <span>{child.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "0.5rem 0.75rem 0",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          marginTop: 6,
        }}
      >
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "rgba(255,255,255,0.9)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: "6px 14px",
            fontSize: 13,
            border: "none",
            background: "linear-gradient(135deg, #FF6A1A, #E94E1B)",
            color: "#fff",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(body, document.body)
    : null;
}
