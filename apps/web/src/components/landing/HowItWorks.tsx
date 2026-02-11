import React from "react";
import { motion } from "framer-motion";
import { Download, Filter, Music } from "lucide-react";
import { landingContent } from "@/config/content";

const icons = [Download, Filter, Music];

export function HowItWorks() {
  const { title, steps } = landingContent.howItWorks;

  return (
    <motion.section
      className="landing-section border-y border-[color:var(--lb-glass-border)]"
      style={{ background: "var(--lb-bg)" }}
      aria-labelledby="how-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container max-w-4xl mx-auto">
        <h2 id="how-heading" className="landing-h2 text-center mb-8 sm:mb-10">
          {title}
        </h2>
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <div
                key={s.step}
                className="flex flex-col items-center text-center"
              >
                <div className="benefit-icon-wrap w-14 h-14 mb-3">
                  <Icon className="w-7 h-7" aria-hidden />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--lb-accent)" }}
                >
                  Paso {s.step}
                </span>
                <h3 className="font-bold text-base mt-2">{s.title}</h3>
                <p className="landing-muted text-sm mt-1 max-w-[220px] mx-auto leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
