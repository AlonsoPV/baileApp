import React from "react";
import { Share2 } from "lucide-react";
import RequireLogin from "../../auth/RequireLogin";
import RSVPButtons from "../../rsvp/RSVPButtons";
import type { RSVPStatus } from "../../../hooks/useRSVP";

export interface StickyCtaBarProps {
  userStatus: RSVPStatus | null;
  onStatusChange: (s: RSVPStatus | null) => void;
  isUpdating: boolean;
  interestedCount?: number;
  onShare: () => void;
}

export function StickyCtaBar({
  userStatus,
  onStatusChange,
  isUpdating,
  interestedCount,
  onShare,
}: StickyCtaBarProps) {
  return (
    <div className="eds-sticky-cta" role="complementary" aria-label="Acciones rápidas">
      <RequireLogin>
        <div className="eds-sticky-cta__center">
          <RSVPButtons
            currentStatus={userStatus}
            onStatusChange={onStatusChange}
            disabled={isUpdating}
            interestedCount={interestedCount}
            style={{ maxWidth: "none" }}
          />
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
