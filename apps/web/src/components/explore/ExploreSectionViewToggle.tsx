import React from "react";
import { List, Images, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExploreSectionViewMode } from "@/utils/exploreSectionViewModeStorage";
/** Contenedor `.explore-fechas-list` + estilos de fila si la primera fila no monta un componente que ya lo importe (p. ej. CTA). */
import "@/components/explore/EventListRow.css";

type Props = {
  value: ExploreSectionViewMode;
  onChange: (mode: ExploreSectionViewMode) => void;
  /** aria-label del grupo (en `likeFechas` se usa `explore_fechas_view_group` si no se pasa). */
  groupLabel?: string;
  /**
   * Mismo orden que Sociales en Explore:
   * LayoutGrid → carousel, Images → cartelera, List → lista.
   * Si es false: solo cartelera + lista.
   */
  likeFechas?: boolean;
};

const segment = (pressed: boolean, withLeftBorder: boolean) =>
  ({
    border: "none",
    borderLeft: withLeftBorder ? "1px solid rgba(255,255,255,0.12)" : undefined,
    background: pressed ? "rgba(255,255,255,0.14)" : "transparent",
    color: "#fff",
    padding: "8px 14px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
  }) as React.CSSProperties;

const wrap = (children: React.ReactNode, label: string) => (
  <div
    className="explore-fechas-view-toggle-row"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      marginTop: -4,
      marginBottom: 14,
      paddingLeft: 2,
      paddingRight: 2,
    }}
  >
    <div
      role="group"
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);

/** Tres iconos (sociales) o dos (cartelera / lista): solo iconos, visibles a la vez. */
export function ExploreSectionViewToggle({ value, onChange, groupLabel, likeFechas }: Props) {
  const { t } = useTranslation();

  if (likeFechas) {
    const label = groupLabel || t("explore_fechas_view_group") || "Vista de sociales";
    return wrap(
      <>
        <button
          type="button"
          aria-pressed={value === "carousel"}
          onClick={() => onChange("carousel")}
          title={t("explore_fechas_view_cards") || "Tarjetas"}
          aria-label={t("explore_fechas_view_cards") || "Vista en tarjetas"}
          style={segment(value === "carousel", false)}
        >
          <LayoutGrid size={18} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={value === "cartelera"}
          onClick={() => onChange("cartelera")}
          title={t("explore_fechas_view_cartelera") || "Cartelera"}
          aria-label={t("explore_fechas_view_cartelera") || "Vista cartelera"}
          style={segment(value === "cartelera", true)}
        >
          <Images size={18} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={value === "list"}
          onClick={() => onChange("list")}
          title={t("explore_fechas_view_list") || "Lista"}
          aria-label={t("explore_fechas_view_list") || "Vista en lista"}
          style={segment(value === "list", true)}
        >
          <List size={18} aria-hidden />
        </button>
      </>,
      label
    );
  }

  const label = groupLabel || t("explore_section_view_picker") || "Vista";
  return wrap(
    <>
      <button
        type="button"
        aria-pressed={value === "cartelera"}
        onClick={() => onChange("cartelera")}
        title={t("explore_fechas_view_cartelera") || "Cartelera"}
        aria-label={t("explore_fechas_view_cartelera") || "Vista cartelera"}
        style={segment(value === "cartelera", false)}
      >
        <Images size={18} aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        title={t("explore_fechas_view_list") || "Lista"}
        aria-label={t("explore_fechas_view_list") || "Vista en lista"}
        style={segment(value === "list", true)}
      >
        <List size={18} aria-hidden />
      </button>
    </>,
    label
  );
}
