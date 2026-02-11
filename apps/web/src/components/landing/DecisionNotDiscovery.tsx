import React from "react";
import { motion } from "framer-motion";
import { Database, GitCompare, CalendarCheck, ArrowRight } from "lucide-react";
import { landingContent } from "@/config/content";

const POINT_ICONS = [Database, GitCompare, CalendarCheck];

export function DecisionNotDiscovery() {
  const { overline, headline, subline, points, closing } =
    landingContent.decisionNotDiscovery;

  return (
    <motion.section
      className="landing-section landing-decision"
      aria-labelledby="decision-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-decision__accent" aria-hidden />
      <div className="landing-container landing-decision__wrap">
        <header className="landing-decision__header">
          <p className="landing-decision__overline">{overline}</p>
          <h2 id="decision-heading" className="landing-decision__title">
            {headline}
          </h2>
          {subline && (
            <p className="landing-decision__subline">{subline}</p>
          )}
          <div className="landing-decision__closing-wrapper">
            <p className="landing-decision__closing">{closing}</p>
            <ArrowRight size={18} strokeWidth={2} className="landing-decision__closing-icon" aria-hidden />
          </div>
        </header>
        <ul className="landing-decision__list">
          {points.map((point, i) => {
            const Icon = POINT_ICONS[i] ?? Database;
            return (
              <li key={i} className="landing-decision__card">
                <div className="landing-decision__card-header">
                  <span className="landing-decision__card-icon" aria-hidden>
                    <Icon size={24} strokeWidth={2} />
                  </span>
                  <span className="landing-decision__card-number" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="landing-decision__card-body">
                  <strong className="landing-decision__card-label">
                    {point.label}
                  </strong>
                  <p className="landing-decision__card-text">{point.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
