import React from "react";
import { motion } from "framer-motion";
import { landingContent } from "@/config/content";
import { Quote } from "lucide-react";

export function SocialProof() {
  const {
    sectionTitle,
    testimonials,
    metrics,
    alliesTitle,
    alliesPlaceholder,
  } = landingContent.socialProof;

  return (
    <motion.section
      className="landing-section landing-social-proof border-t border-[color:var(--lb-glass-border)]"
      style={{ background: "var(--lb-bg2)" }}
      aria-label="Prueba social y confianza"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <h2 className="landing-social-proof__title">{sectionTitle}</h2>

        <div className="landing-social-proof__testimonials">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="landing-social-proof__card">
              <Quote
                className="landing-social-proof__quote-icon"
                style={{ color: "var(--lb-accent)" }}
                aria-hidden
              />
              <p className="landing-social-proof__quote">&ldquo;{t.quote}&rdquo;</p>
              <footer className="landing-social-proof__author">
                <cite className="not-italic font-semibold">{t.author}</cite>
                <span className="landing-muted">{t.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="landing-social-proof__metrics">
          {metrics.map((m, i) => (
            <div key={i} className="landing-social-proof__metric">
              <p className="landing-social-proof__metric-value">{m.value}</p>
              <p className="landing-social-proof__metric-label">{m.label}</p>
              {m.placeholder && (
                <p className="sr-only">Métrica de ejemplo (placeholder)</p>
              )}
            </div>
          ))}
        </div>

        <div className="landing-social-proof__allies">
          <h3 className="landing-social-proof__allies-title">{alliesTitle}</h3>
          <p
            className="landing-social-proof__allies-placeholder landing-muted"
            aria-label="Placeholder de logos de academias aliadas"
          >
            {alliesPlaceholder}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
