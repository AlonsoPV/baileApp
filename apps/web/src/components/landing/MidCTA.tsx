import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Building2 } from "lucide-react";
import { landingContent } from "@/config/content";
import { track, LANDING_EVENTS } from "@/lib/track";

export function MidCTA({
  onOpenDownload,
  onOpenB2B,
}: {
  onOpenDownload: () => void;
  onOpenB2B: () => void;
}) {
  const handleDownload = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "mid" });
    onOpenDownload();
  };
  const handleB2B = () => {
    track(LANDING_EVENTS.CTA_B2B, { location: "mid" });
    onOpenB2B();
  };

  return (
    <motion.section
      className="landing-section landing-mid-cta"
      style={{ background: "var(--lb-bg2)" }}
      aria-label="Llamado a la acción"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <div className="landing-mid-cta__card">
          <h2 className="landing-mid-cta__title">Listo para encontrar dónde bailar en CDMX</h2>
          <p className="landing-mid-cta__microcopy">
            {landingContent.hero.ctaMicrocopy}
          </p>
          <div className="landing-mid-cta__buttons">
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary landing-mid-cta__btn"
            >
              <Smartphone size={20} strokeWidth={2} aria-hidden />
              {landingContent.hero.ctaPrimary}
            </button>
            <button
              type="button"
              onClick={handleB2B}
              className="btn btn-ghost landing-mid-cta__btn"
            >
              <Building2 size={20} strokeWidth={2} aria-hidden />
              {landingContent.hero.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
