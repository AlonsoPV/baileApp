import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Instagram, Mail, Download } from "lucide-react";
import { landingContent } from "@/config/content";
import { WHATSAPP_URL } from "@/config/links";
import { track, LANDING_EVENTS } from "@/lib/track";

const { footer } = landingContent;

const INSTAGRAM_URL = "https://www.instagram.com/dondebailar_2026/";

export function Footer({
  onDownloadClick,
  onB2BClick: _onB2BClick,
}: {
  onDownloadClick: () => void;
  onB2BClick: () => void;
}) {
  const handleDownload = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "footer" });
    onDownloadClick();
  };

  return (
    <footer className="landing-footer" role="contentinfo" aria-label="Pie de página Donde Bailar MX">
      {/* Separación superior: línea acento + transición suave respecto al body */}
      <div className="landing-footer__edge" aria-hidden />

      <div className="landing-footer__main landing-container">
        <section className="landing-footer__brand" aria-labelledby="footer-brand-heading">
          <div className="landing-footer__identity">
            <div className="landing-footer__mark" aria-hidden>
              <MapPin size={20} strokeWidth={2} />
            </div>
            <h2 id="footer-brand-heading" className="landing-footer__title">
              Donde Bailar MX
            </h2>
          </div>
          <p className="landing-footer__tagline">{footer.tagline}</p>
          <div className="landing-footer__social" aria-label="Redes y contacto">
            <a
              className="landing-footer__iconBtn"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram — Donde Bailar MX"
            >
              <Instagram size={18} strokeWidth={2} aria-hidden />
            </a>
            <a
              className="landing-footer__iconBtn"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${footer.contact} por WhatsApp`}
            >
              <Mail size={18} strokeWidth={2} aria-hidden />
            </a>
          </div>
        </section>

        <nav className="landing-footer__nav" aria-label="Legal y soporte">
          <div className="landing-footer__navGroup">
            <p className="landing-footer__navLabel">{footer.legalTitle}</p>
            <ul className="landing-footer__navList">
              <li>
                <Link className="landing-footer__navLink" to="/aviso-de-privacidad">
                  {footer.privacy}
                </Link>
              </li>
            </ul>
          </div>
          <div className="landing-footer__navGroup">
            <p className="landing-footer__navLabel">{footer.supportTitle}</p>
            <ul className="landing-footer__navList">
              <li>
                <Link className="landing-footer__navLink" to="/soporte">
                  {footer.helpCenter}
                </Link>
              </li>
              <li>
                <a
                  className="landing-footer__navLink"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {footer.contact}
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <aside className="landing-footer__cta" aria-label="Descargar app">
          <button
            type="button"
            className="landing-footer__ctaPrimary"
            onClick={handleDownload}
          >
            <Download size={18} strokeWidth={2} aria-hidden />
            {footer.ctaCopy}
          </button>
          <p className="landing-footer__ctaHint">{footer.ctaPro}</p>
          <Link to="/soporte" className="landing-footer__ctaSecondary">
            Contáctanos
          </Link>
        </aside>

        <div className="landing-footer__meta" aria-label="Copyright y redes">
          <span className="landing-footer__copy">
            © {new Date().getFullYear()} Donde Bailar MX. Todos los derechos reservados.
          </span>
          <span className="landing-footer__follow">
            {footer.socialLabel}:{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-footer__inlineLink"
            >
              Instagram
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
