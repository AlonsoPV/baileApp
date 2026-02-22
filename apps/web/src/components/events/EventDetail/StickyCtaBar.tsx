import React from "react";
import { Share2 } from "lucide-react";
import RequireLogin from "../../auth/RequireLogin";
import RSVPButtons from "../../rsvp/RSVPButtons";
import type { RSVPStatus } from "../../../hooks/useRSVP";

export interface StickyCtaBarProps {
  userStatus: RSVPStatus | null;
  onStatusChange: (s: RSVPStatus | null) => void;
  isUpdating: boolean;
  /** No mostrado en la UI (métricas siguen en backend/otras secciones) */
  interestedCount?: number;
  onShare: () => void;
  /** Botón icono-only para añadir al calendario (44x44, tooltip accesible) */
  calendarButton?: React.ReactNode;
}

export function StickyCtaBar({
  userStatus,
  onStatusChange,
  isUpdating,
  onShare,
  calendarButton,
}: StickyCtaBarProps) {
  return (
    <div className="eds-sticky-cta" role="complementary" aria-label="Acciones rápidas">
      <RequireLogin>
        <div className="eds-sticky-cta__center">
          <RSVPButtons
            currentStatus={userStatus}
            onStatusChange={onStatusChange}
            disabled={isUpdating}
            singleButton
            style={{ maxWidth: "none" }}
          />
          {calendarButton && (
            <div className="eds-sticky-cta__calendar-wrap" title="Añadir al calendario">
              {calendarButton}
            </div>
          )}
        </div>
      </RequireLogin>
      <button
        type="button"
        className="eds-sticky-cta__icon"
        onClick={onShare}
        aria-label="Compartir"
      >
        <Share2 size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
