import React from "react";
import { motion } from "framer-motion";
import { Compass, Users, Target, BarChart3, LucideIcon } from "lucide-react";
import { landingContent } from "@/config/content";

const ICON_MAP: Record<string, LucideIcon> = {
  Compass,
  Users,
  Target,
  BarChart3,
};

const ACCENT_CLASSES = [
  "landing-business-case__card--1",
  "landing-business-case__card--2",
  "landing-business-case__card--3",
  "landing-business-case__card--4",
];

export function BusinessCase() {
  const { overline, headline, subline, items } = landingContent.businessCase;

  return (
    <motion.section
      className="landing-section landing-business-case"
      style={{ background: "var(--lb-bg)" }}
      aria-labelledby="business-case-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <p className="landing-business-case__overline">{overline}</p>
        <h2 id="business-case-heading" className="landing-business-case__title">
          {headline}
        </h2>
        <p className="landing-business-case__subline">{subline}</p>
        <ul className="landing-business-case__list">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? Compass;
            const cardClass = ACCENT_CLASSES[i] ?? ACCENT_CLASSES[0];
            return (
              <li
                key={i}
                className={`landing-business-case__card ${cardClass}`}
              >
                <span className="landing-business-case__card-icon" aria-hidden>
                  <Icon size={24} strokeWidth={2} />
                </span>
                <div className="landing-business-case__card-body">
                  <h3 className="landing-business-case__card-title">
                    {item.title}
                  </h3>
                  <p className="landing-business-case__card-desc">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
