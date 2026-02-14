import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Instagram,
  Mail,
  FileText,
  HelpCircle,
  Download,
  Building2,
} from "lucide-react";
import { landingContent } from "@/config/content";
import { WHATSAPP_URL } from "@/config/links";
import { track, LANDING_EVENTS } from "@/lib/track";

const { footer } = landingContent;

const INSTAGRAM_URL = "https://instagram.com/dondebailarmx";

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
      className="landing-footer db-footer"
      role="contentinfo"
      aria-label="Footer Donde Bailar MX"
    >
      <div className="landing-footer__topline db-footer__topline" aria-hidden />

      <div className="landing-footer__wrap db-footer__wrap">
        {/* Brand */}
        <section className="landing-footer__brand brand" aria-label="Marca">
          <div className="brand__name">
            <div className="brand__mark" aria-hidden>
              <MapPin size={18} strokeWidth={2} />
            </div>
            <span>Donde Bailar MX</span>
          </div>
          <p className="brand__tagline">
            {footer.tagline}
          </p>
          <div className="brand__social social" aria-label="Redes sociales">
            <a
              className="pillLink"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={16} strokeWidth={2} aria-hidden />
              Instagram
            </a>
            <a
              className="pillLink"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contacto"
            >
              <Mail size={16} strokeWidth={2} aria-hidden />
              {footer.contact}
            </a>
          </div>
        </section>

        {/* Links columns */}
        <nav className="landing-footer__cols cols" aria-label="Enlaces">
          <div className="col">
            <div className="col__title">
              <FileText size={14} strokeWidth={2} aria-hidden />
              {footer.legalTitle}
            </div>
            <div className="col__links">
              <Link className="link" to="/aviso-de-privacidad">
                <span>{footer.privacy}</span>
                <span className="link__meta">Política</span>
              </Link>
              <Link className="link" to="/legal">
                <span>{footer.terms}</span>
                <span className="link__meta">Uso</span>
              </Link>
            </div>
          </div>
          <div className="col">
            <div className="col__title">
              <HelpCircle size={14} strokeWidth={2} aria-hidden />
              {footer.supportTitle}
            </div>
            <div className="col__links">
              <Link className="link" to="/soporte">
                <span>{footer.helpCenter}</span>
                <span className="link__meta">FAQ</span>
              </Link>
              <a
                className="link"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{footer.contact}</span>
                <span className="link__meta">↗</span>
              </a>
            </div>
          </div>
        </nav>

        {/* CTA */}
        <aside className="landing-footer__cta cta" aria-label="Acciones">
          <div className="cta__card">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleDownload}
            >
              <Download size={18} strokeWidth={2} aria-hidden />
              {footer.ctaCopy}
            </button>
            <Link
              to="/soporte"
              className="btn btn--ghost"
            >
              <Building2 size={18} strokeWidth={2} aria-hidden />
              Contáctanos
            </Link>
            <div className="cta__micro">
              <span className="chip">Pro</span>
              <span>{footer.ctaPro}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="landing-footer__bottom db-footer__bottom">
        <div className="db-footer__bottomWrap">
          <div>
            © {new Date().getFullYear()} Donde Bailar MX. Todos los derechos
            reservados.
          </div>
          <div>
            {footer.socialLabel} —{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="db-footer__bottomLink"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
