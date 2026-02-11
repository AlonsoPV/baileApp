import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, Bookmark, Users } from "lucide-react";
import { landingContent } from "@/config/content";

const RETENTION_ICONS = [CalendarDays, Bookmark, Users];
const RETENTION_ACCENTS = ["landing-retention__card--1", "landing-retention__card--2", "landing-retention__card--3"];

export function Retention() {
  const { overline, headline, subline, points } = landingContent.retention;

  return (
    <motion.section
      className="landing-section landing-retention"
      aria-labelledby="retention-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <p className="landing-retention__overline">{overline}</p>
        <h2 id="retention-heading" className="landing-retention__title">
          {headline}
        </h2>
        {subline && (
          <p className="landing-retention__subline">{subline}</p>
        )}
        <div className="landing-retention__grid">
          {points.map((point, i) => {
            const Icon = RETENTION_ICONS[i] ?? Users;
            const cardClass = RETENTION_ACCENTS[i] ?? RETENTION_ACCENTS[0];
            return (
              <div key={i} className={`landing-retention__card ${cardClass}`}>
                <span className="landing-retention__card-icon" aria-hidden>
                  <Icon size={24} strokeWidth={2} />
                </span>
                <div className="landing-retention__card-body">
                  <strong className="landing-retention__card-label">
                    {point.label}
                  </strong>
                  <p className="landing-retention__card-text">{point.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
