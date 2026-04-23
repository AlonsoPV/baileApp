import React from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Filter,
  BellOff,
  RefreshCw,
  Gift,
  LucideIcon,
} from "lucide-react";
import { landingContent } from "@/config/content";

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarCheck,
  Filter,
  BellOff,
  RefreshCw,
  Gift,
};

export function BenefitGrid() {
  const { title, subtitle, items } = landingContent.benefits;

  return (
    <motion.section
      className="landing-section landing-benefits"
      style={{ background: "var(--lb-bg2)" }}
      aria-labelledby="benefits-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container landing-benefits__inner">
        <p className="landing-benefits__overline" aria-hidden>
          Para bailarines y organizadores
        </p>
        <h2 id="benefits-heading" className="landing-benefits__title">
          {title}
        </h2>
        {subtitle ? (
          <p className="landing-benefits__subtitle">{subtitle}</p>
        ) : null}
        <div className="landing-benefits__grid-2x2">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? Gift;
            return (
              <motion.article
                key={item.title}
                className="landing-benefits__card-h"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <div className="landing-benefits__icon-wrap-h" aria-hidden>
                  <Icon className="landing-benefits__icon-h" size={18} strokeWidth={2} />
                </div>
                <div className="landing-benefits__text">
                  <h3 className="landing-benefits__card-title">{item.title}</h3>
                  <p className="landing-benefits__card-desc">{item.description}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
