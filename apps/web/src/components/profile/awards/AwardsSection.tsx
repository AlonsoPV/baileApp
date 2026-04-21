import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Award, MapPin, Trophy } from "lucide-react";
import type { AwardItem } from "../../../types/awards";
import { sortAwardsForDisplay } from "../../../types/awards";
import "./AwardsSection.css";

export type AwardsSectionProps = {
  awards: AwardItem[];
  /** Si no hay premios: no renderizar nada (por defecto) o mostrar empty state */
  emptyMode?: "hide" | "show_empty";
  /** Cuántas cards mostrar antes de "Ver más" */
  maxVisible?: number;
  className?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
};

function AwardCard({ item }: { item: AwardItem }) {
  const { t } = useTranslation("common");
  const highlighted = !!item.isHighlighted;
  const hasImage = !!(item.imageUrl && item.imageUrl.trim());

  return (
    <article
      className={`awards-card${highlighted ? " awards-card--highlight" : ""}`}
      aria-label={item.title}
    >
      {highlighted && (
        <span className="awards-card__badge">{t("awards.featured_badge")}</span>
      )}
      <div className="awards-card__media">
        {hasImage ? (
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="awards-card__placeholder" aria-hidden>
            <Trophy size={44} strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="awards-card__body">
        <div className="awards-card__meta-line">
          {item.year ? (
            <span className="awards-card__chip awards-card__chip--muted">{item.year}</span>
          ) : null}
          {item.category ? (
            <span className="awards-card__chip">{item.category}</span>
          ) : null}
          {item.achievementType ? (
            <span className="awards-card__chip">{item.achievementType}</span>
          ) : null}
        </div>
        <h3 className="awards-card__heading">{item.title || t("awards.untitled")}</h3>
        {item.organization ? (
          <p className="awards-card__org">{item.organization}</p>
        ) : null}
        {item.location ? (
          <div className="awards-card__meta-line" style={{ margin: 0, fontWeight: 500 }}>
            <MapPin size={14} aria-hidden style={{ opacity: 0.75, flexShrink: 0 }} />
            <span>{item.location}</span>
          </div>
        ) : null}
        {item.description ? (
          <p className="awards-card__desc">{item.description}</p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Sección pública de premios y logros — cards premium, responsive.
 */
export function AwardsSection({
  awards,
  emptyMode = "hide",
  maxVisible = 6,
  className = "",
  sectionTitle,
  sectionSubtitle,
}: AwardsSectionProps) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const meaningful = awards.filter((a) => {
      if (!a?.id) return false;
      const t = (a.title || "").trim();
      const o = (a.organization || "").trim();
      const d = (a.description || "").trim();
      const img = (a.imageUrl || "").trim();
      return !!(t || o || d || img);
    });
    return sortAwardsForDisplay(meaningful);
  }, [awards]);

  if (sorted.length === 0) {
    if (emptyMode === "hide") return null;
    return (
      <section className={`awards-section ${className}`.trim()} aria-labelledby="awards-empty-heading">
        <div className="awards-section__head">
          <div className="awards-section__title-row">
            <div className="awards-section__icon-wrap">
              <Award size={26} strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <h2 id="awards-empty-heading" className="awards-section__title">
                {sectionTitle ?? t("awards.section_title")}
              </h2>
              <p className="awards-section__subtitle">
                {sectionSubtitle ?? t("awards.section_subtitle")}
              </p>
            </div>
          </div>
        </div>
        <div className="awards-section__empty">
          <div className="awards-section__empty-icon" aria-hidden>
            🏅
          </div>
          {t("awards.public_empty")}
        </div>
      </section>
    );
  }

  const showToggle = sorted.length > maxVisible && !expanded;
  const visible = expanded ? sorted : sorted.slice(0, maxVisible);
  const remaining = Math.max(0, sorted.length - maxVisible);

  return (
    <section
      className={`awards-section ${className}`.trim()}
      aria-labelledby="awards-section-title"
    >
      <header className="awards-section__head">
        <div className="awards-section__title-row">
          <div className="awards-section__icon-wrap">
            <Award size={26} strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h2 id="awards-section-title" className="awards-section__title">
              {sectionTitle ?? t("awards.section_title")}
            </h2>
            <p className="awards-section__subtitle">
              {sectionSubtitle ?? t("awards.section_subtitle")}
            </p>
          </div>
        </div>
      </header>

      <div className="awards-section__grid">
        {visible.map((item) => (
          <AwardCard key={item.id} item={item} />
        ))}
      </div>

      {showToggle && (
        <div className="awards-section__footer">
          <button
            type="button"
            className="awards-section__more-btn"
            onClick={() => setExpanded(true)}
          >
            {t("awards.show_more", { count: remaining })}
          </button>
        </div>
      )}
      {expanded && sorted.length > maxVisible && (
        <div className="awards-section__footer">
          <button
            type="button"
            className="awards-section__more-btn"
            onClick={() => setExpanded(false)}
          >
            {t("awards.show_less")}
          </button>
        </div>
      )}
    </section>
  );
}

export default AwardsSection;
