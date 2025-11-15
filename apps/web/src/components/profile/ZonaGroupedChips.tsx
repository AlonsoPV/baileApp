import React from "react";
import { Chip } from "./Chip";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";

type TagLike = { id: number; nombre?: string; slug?: string; tipo?: string };

type Mode = "display" | "edit";

export interface ZonaGroupedChipsProps {
  selectedIds?: Array<number | null | undefined> | null;
  allTags?: TagLike[] | null;
  mode?: Mode;
  onToggle?: (id: number) => void;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  autoExpandSelectedParents?: boolean;
  size?: "default" | "compact";
}

function normalizeSelected(selected?: Array<number | null | undefined> | null) {
  return (selected || []).filter((id): id is number => typeof id === "number");
}

const ZonaGroupedChips: React.FC<ZonaGroupedChipsProps> = ({
  selectedIds,
  allTags,
  mode = "display",
  onToggle,
  icon = "📍",
  className,
  style,
  autoExpandSelectedParents = true,
  size = "default",
}) => {
  const normalizedSelected = React.useMemo(
    () => normalizeSelected(selectedIds),
    [selectedIds]
  );
  const selectedSet = React.useMemo(
    () => new Set(normalizedSelected),
    [normalizedSelected]
  );

  const { groups } = useZonaCatalogGroups(allTags);

  const relevantGroups = React.useMemo(() => {
    if (mode === "display") {
      return groups
        .map((group) => {
          const items = group.items.filter((item) => selectedSet.has(item.id));
          return items.length ? { ...group, items } : null;
        })
        .filter(Boolean) as typeof groups;
    }
    return groups;
  }, [groups, mode, selectedSet]);

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      relevantGroups.forEach((group) => {
        const hasSelected = group.items.some((item) => selectedSet.has(item.id));
        if (autoExpandSelectedParents && hasSelected) {
          next[group.id] = true;
        } else if (next[group.id] === undefined) {
          next[group.id] = false;
        }
      });
      return next;
    });
  }, [relevantGroups, selectedSet, autoExpandSelectedParents]);

  if (mode === "display" && relevantGroups.length === 0) {
    return null;
  }

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? false),
    }));
  };

  const handleChipClick = (id: number) => {
    if (mode === "edit" && onToggle) {
      onToggle(id);
    }
  };

  const metrics =
    size === "compact"
      ? {
          wrapperGap: "0.5rem",
          parentFont: "0.78rem",
          parentPadding: "0.45rem 0.9rem",
          childGap: "0.35rem",
          childPadding: "0.35rem 0.75rem",
          childFont: "0.72rem",
        }
      : {
          wrapperGap: "0.75rem",
          parentFont: "0.9rem",
          parentPadding: "0.65rem 1.1rem",
          childGap: "0.5rem",
          childPadding: "0.45rem 0.9rem",
          childFont: "0.82rem",
        };

  return (
    <div className={className} style={style}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: metrics.wrapperGap,
          alignItems: "flex-start",
        }}
      >
        {relevantGroups.map((group) => {
          const hasSelected = group.items.some((item) =>
            selectedSet.has(item.id)
          );
          const isExpanded = expanded[group.id] ?? false;
          const showChildren = isExpanded;
          return (
            <div
              key={group.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                alignItems: "flex-start",
                minWidth: "fit-content",
              }}
            >
              <Chip
                label={`${group.label} ${isExpanded ? "▾" : "▸"}`}
                icon={icon}
                variant="custom"
                active={hasSelected || isExpanded}
                onClick={() => toggleGroup(group.id)}
                style={{
                  fontSize: metrics.parentFont,
                  alignSelf: "flex-start",
                  width: "fit-content",
                  minWidth: "auto",
                  justifyContent: "center",
                  padding: metrics.parentPadding,
                  background:
                    hasSelected || isExpanded
                      ? "rgba(76,173,255,0.18)"
                      : "rgba(255,255,255,0.05)",
                  border:
                    hasSelected || isExpanded
                      ? "1px solid rgba(76,173,255,0.6)"
                      : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 999,
                }}
              />

              {showChildren && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: metrics.childGap,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    paddingTop: "0.4rem",
                    width: "100%",
                  }}
                >
                  {group.items.map((item) => {
                    const isActive = selectedSet.has(item.id);
                    return (
                      <Chip
                        key={item.id}
                        label={item.label}
                        icon={icon}
                        variant="zona"
                        active={isActive}
                        onClick={
                          mode === "edit" ? () => handleChipClick(item.id) : undefined
                        }
                        style={{
                          fontSize: metrics.childFont,
                          padding: metrics.childPadding,
                          background: isActive
                            ? "rgba(76,173,255,0.18)"
                            : "rgba(255,255,255,0.06)",
                          border: isActive
                            ? "1px solid rgba(76,173,255,0.6)"
                            : "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 999,
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZonaGroupedChips;

