import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { OrganizerFaqItem } from "../../types/organizerFaq";
import { colors, spacing, borderRadius, typography } from "../../theme/colors";
import OrganizerFaqAnswerRich from "./OrganizerFaqAnswerRich";

type Props = {
  items: OrganizerFaqItem[];
  /** Si true, solo una respuesta abierta a la vez (recomendado en móvil). */
  singleOpen?: boolean;
  title?: string;
  subtitle?: string;
};

/**
 * FAQ pública para perfil de organizador: acordeón ligero, mobile-first; respuestas con markdown sanitizado.
 */
export default function OrganizerPublicFaqSection({
  items,
  singleOpen = true,
  title,
  subtitle,
}: Props) {
  const { t } = useTranslation("common");
  const heading = title ?? t("organizer_faq.title");
  const sub = subtitle ?? t("organizer_faq.public_subtitle");

  const list = useMemo(() => (items || []).filter((x) => x.q?.trim() && x.a?.trim()), [items]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set());

  if (!list.length) return null;

  const isOpen = (id: string) => (singleOpen ? openId === id : openSet.has(id));

  const toggle = (id: string) => {
    if (singleOpen) {
      setOpenId((prev) => (prev === id ? null : id));
    } else {
      setOpenSet((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card"
      data-test-id="organizer-public-faq"
      style={{
        marginBottom: spacing[8],
        padding: spacing[8],
        borderRadius: borderRadius["2xl"],
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: spacing[4], marginBottom: spacing[6] }}>
        <div
          style={{
            width: 56,
            height: 56,
            minWidth: 56,
            borderRadius: "50%",
            background: colors.gradients.secondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.fontSize["2xl"],
            boxShadow: `0 8px 24px ${colors.secondary[500]}40`,
          }}
        >
          ❓
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            {heading}
          </h3>
          <p style={{ fontSize: typography.fontSize.sm, opacity: 0.85, margin: "0.25rem 0 0 0", color: colors.light }}>
            {sub}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((item) => {
          const open = isOpen(item.id);
          return (
            <div
              key={item.id}
              style={{
                borderRadius: borderRadius.xl,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 18px",
                  minHeight: 52,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
                id={`faq-trigger-${item.id}`}
              >
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", width: 22 }}>{open ? "▾" : "▸"}</span>
                <span
                  style={{
                    flex: 1,
                    fontWeight: 800,
                    fontSize: "1.02rem",
                    lineHeight: 1.35,
                    color: colors.gray[50],
                  }}
                >
                  {item.q}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        padding: "0 18px 18px 52px",
                        fontSize: typography.fontSize.base,
                        color: "rgba(255,255,255,0.88)",
                      }}
                      data-test-id="organizer-public-faq-answer"
                    >
                      <OrganizerFaqAnswerRich markdown={item.a} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
