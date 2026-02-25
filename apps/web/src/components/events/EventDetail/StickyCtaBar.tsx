import React from "react";
import { Share2, Loader2 } from "lucide-react";
import RequireLogin from "../../auth/RequireLogin";
import RSVPButtons from "../../rsvp/RSVPButtons";
import type { RSVPStatus } from "../../../hooks/useRSVP";

/** State machine for sticky CTA: calendar only when active, buttons disabled when loading */
export type StickyRsvpState = "idle" | "active" | "loading" | "error";

export interface StickyCtaBarProps {
  userStatus: RSVPStatus | null;
  onStatusChange: (s: RSVPStatus | null) => void;
  isUpdating: boolean;
  /** Derived: idle | active (interesado/going) | loading | error. Calendar shown only when "active". */
  rsvpState: StickyRsvpState;
  /** No mostrado en la UI (métricas siguen en backend/otras secciones) */
  interestedCount?: number;
  onShare: () => void;
  /** Botón icono-only para añadir al calendario (44x44). Solo se muestra si rsvpState === "active". */
  calendarButton?: React.ReactNode;
}

export function StickyCtaBar({
  userStatus,
  onStatusChange,
  isUpdating,
  rsvpState,
  onShare,
  calendarButton,
}: StickyCtaBarProps) {
  const isDisabled = rsvpState === "loading";
  const showCalendar = rsvpState === "active" && calendarButton;

  return (
    <div className="eds-sticky-cta" role="complementary" aria-label="Acciones rápidas">
      <RequireLogin>
        <div className="eds-sticky-cta__center">
          <RSVPButtons
            currentStatus={userStatus}
            onStatusChange={onStatusChange}
            disabled={isDisabled}
            singleButton
            singleButtonActiveLabelKey="going_check"
            style={{ maxWidth: "none" }}
          />
          {isDisabled && (
            <span className="eds-sticky-cta__spinner" aria-hidden>
              <Loader2 size={20} strokeWidth={2} className="eds-sticky-cta__spinner-icon" />
            </span>
          )}
          {showCalendar && (
            <div
              className="eds-sticky-cta__calendar-wrap"
              title="Añadir al calendario"
              role="group"
              aria-label="Añadir a calendario"
            >
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
