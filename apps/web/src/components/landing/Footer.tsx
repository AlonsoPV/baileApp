import React from "react";
import { Smartphone, ExternalLink } from "lucide-react";
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
      className="landing-section landing-footer"
      role="contentinfo"
    >
      <div className="landing-footer__bar" aria-hidden />
      <div className="landing-container">
        <div className="landing-footer__content">
          <div className="landing-footer__brand">
            <h3 className="landing-footer__brand-title">Donde Bailar MX</h3>
            <p className="landing-footer__brand-tagline">
              La plataforma donde la comunidad del baile se encuentra.
            </p>
          </div>
          
          <nav className="landing-footer__nav" aria-label="Enlaces legales y contacto">
            <div className="landing-footer__nav-group">
              <span className="landing-footer__nav-label">Legal</span>
              <a href="/aviso-de-privacidad" className="landing-footer__link">
                {footer.privacy}
              </a>
              <a href="/legal" className="landing-footer__link">
                {footer.terms}
              </a>
            </div>
            <div className="landing-footer__nav-group">
              <span className="landing-footer__nav-label">Contacto</span>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-footer__link landing-footer__link--external"
              >
                {footer.contact}
                <ExternalLink size={14} strokeWidth={2} aria-hidden />
              </a>
            </div>
          </nav>

          <div className="landing-footer__ctas">
            <button 
              type="button" 
              onClick={handleDownload} 
              className="btn btn-primary landing-footer__btn landing-footer__btn--primary"
            >
              <Smartphone size={18} strokeWidth={2} aria-hidden />
              {footer.ctaCopy}
            </button>
            <button 
              type="button" 
              onClick={onB2BClick} 
              className="btn btn-ghost landing-footer__btn landing-footer__btn--secondary"
            >
              Soy academia o maestro
            </button>
          </div>
        </div>
        
        <div className="landing-footer__bottom">
          <p className="landing-footer__copy">
            © {new Date().getFullYear()} Donde Bailar MX. Todos los derechos reservados.
          </p>
          <p className="landing-footer__social">
            {footer.socialLabel} —{" "}
            <a 
              href="https://instagram.com/dondebailarmx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="landing-footer__social-link"
            >
              Instagram
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
