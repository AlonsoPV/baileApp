import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarRange, Globe } from "lucide-react";
import { landingContent } from "@/config/content";
import { track, LANDING_EVENTS } from "@/lib/track";

const { midCta } = landingContent;

export function MidCTA() {
  return (
    <motion.section
      className="landing-section landing-mid-cta"
      style={{ background: "var(--lb-bg)" }}
      aria-label="Llamado a la acción"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <div className="landing-mid-cta__card">
          <h2 className="landing-mid-cta__title">{midCta.title}</h2>
          <p className="landing-mid-cta__microcopy">{midCta.microcopy}</p>
          <div className="landing-mid-cta__buttons">
            <Link
              to="/explore/list?type=sociales"
              className="btn btn-primary landing-mid-cta__btn landing-mid-cta__link"
              onClick={() => track(LANDING_EVENTS.CTA_EXPLORE, { location: "mid", target: "fechas" })}
            >
              <CalendarRange size={20} strokeWidth={2} aria-hidden />
              {midCta.ctaPrimary}
            </Link>
            <Link
              to="/explore"
              className="btn btn-ghost landing-mid-cta__btn landing-mid-cta__link"
              onClick={() => track(LANDING_EVENTS.CTA_EXPLORE, { location: "mid", target: "explore_home" })}
            >
              <Globe size={20} strokeWidth={2} aria-hidden />
              {midCta.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
