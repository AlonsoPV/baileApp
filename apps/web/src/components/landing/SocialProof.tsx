import React from "react";
import { motion } from "framer-motion";
import { landingContent } from "@/config/content";

export function SocialProof() {
  const { testimonials, metrics } = landingContent.socialProof;
  const featured = testimonials[0];

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
        {metrics.length > 0 && (
          <div className="sp-metrics-bar" role="list">
            {metrics.map((m) => (
              <div key={m.label} className="sp-metrics-bar__item" role="listitem">
                <span className="sp-metrics-bar__value">{m.value}</span>
                <span className="sp-metrics-bar__label">{m.label}</span>
              </div>
            ))}
          </div>
        )}

        {featured && (
          <blockquote className="sp-featured-quote">
            <div className="sp-featured-quote__bar" aria-hidden />
            <div className="sp-featured-quote__body">
              <p className="sp-featured-quote__text">&ldquo;{featured.quote}&rdquo;</p>
              <footer className="sp-featured-quote__footer">
                <strong className="sp-featured-quote__author">{featured.author}</strong>
                <span className="sp-featured-quote__role">{featured.role}</span>
              </footer>
            </div>
          </blockquote>
        )}
      </div>
    </motion.section>
  );
}
