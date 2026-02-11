import React from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Filter,
  Clock,
  BellOff,
  Gift,
  MapPin,
  LucideIcon,
} from "lucide-react";
import { landingContent } from "@/config/content";

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarCheck,
  Filter,
  Clock,
  BellOff,
  Gift,
  MapPin,
};

export function BenefitGrid() {
  const { title, subtitle, items } = landingContent.benefits;

  return (
    <motion.section
      className="landing-section"
      style={{ background: "var(--lb-bg2)" }}
      aria-labelledby="benefits-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container max-w-5xl mx-auto">
        <h2 id="benefits-heading" className="landing-h2 text-center mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="landing-p landing-muted text-center mb-10 max-w-lg mx-auto">
            {subtitle}
          </p>
        )}
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Gift;
            return (
              <div key={item.title} className="benefit-card text-left flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="benefit-icon-wrap shrink-0 w-11 h-11">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-1">
                    {item.title}
                  </h3>
                  <p className="landing-p landing-muted text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
