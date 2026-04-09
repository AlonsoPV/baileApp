import React from "react";
import "./ExploreCardsShared.css";
import { Plus, Loader2 } from "lucide-react";

export function LoadMoreCard({
  onClick,
  loading,
  title = "Cargar más",
  subtitle = "Ver más sociales",
}: {
  onClick: () => void;
  loading: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="load-more-card"
      aria-label={title}
    >
      <div className="load-more-card__content" style={{ opacity: loading ? 0.9 : 1 }}>
        <div className="load-more-card__icon" aria-hidden>
          {loading ? <Loader2 size={20} className="load-more-card__spinner" /> : <Plus size={20} />}
        </div>
        <div className="load-more-card__title">
          {loading ? "Cargando..." : title}
        </div>
        <div className="load-more-card__subtitle">{subtitle}</div>
      </div>
    </button>
  );
}

