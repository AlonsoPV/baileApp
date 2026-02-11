import React from "react";
import { Smartphone } from "lucide-react";
import { landingContent } from "@/config/content";
import { WHATSAPP_URL } from "@/config/links";
import { track, LANDING_EVENTS } from "@/lib/track";

const { footer } = landingContent;

export function Footer({
  onDownloadClick,
  onB2BClick,
}: {
  onDownloadClick: () => void;
  onB2BClick: () => void;
}) {
  const handleDownload = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "footer" });
    onDownloadClick();
  };

  return (
    <footer
      className="landing-section landing-footer border-t border-[color:var(--lb-glass-border)]"
      style={{ background: "var(--lb-bg)" }}
      role="contentinfo"
    >
      <div className="landing-container">
        <div className="landing-footer__row">
          <nav className="landing-footer__links" aria-label="Enlaces legales y contacto">
            <a href="/aviso-de-privacidad" className="landing-footer__link">
              {footer.privacy}
            </a>
            <a href="/legal" className="landing-footer__link">
              {footer.terms}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-footer__link"
            >
              {footer.contact}
            </a>
          </nav>
          <div className="landing-footer__ctas">
            <button type="button" onClick={handleDownload} className="btn btn-primary landing-footer__btn">
              <Smartphone size={16} strokeWidth={2} aria-hidden />
              {footer.ctaCopy}
            </button>
            <button type="button" onClick={onB2BClick} className="btn btn-ghost landing-footer__btn">
              Soy academia
            </button>
          </div>
        </div>
        <p className="landing-footer__copy">
          {footer.socialLabel} — Donde Bailar MX
        </p>
      </div>
    </footer>
  );
}
