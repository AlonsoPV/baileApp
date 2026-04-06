import React, { useMemo } from "react";
import { renderOrganizerFaqAnswerToHtml } from "../../utils/organizerFaqRichText";

type Props = {
  markdown: string;
  className?: string;
};

/**
 * Renderiza respuesta FAQ con markdown → HTML sanitizado (público y vista previa en editor).
 */
export default function OrganizerFaqAnswerRich({ markdown, className }: Props) {
  const html = useMemo(() => renderOrganizerFaqAnswerToHtml(markdown), [markdown]);

  if (!html) return null;

  return (
    <>
      <style>{`
        .organizer-faq-answer-rich { font-size: inherit; line-height: 1.65; }
        .organizer-faq-answer-rich p { margin: 0 0 0.65em 0; }
        .organizer-faq-answer-rich p:last-child { margin-bottom: 0; }
        .organizer-faq-answer-rich ul,
        .organizer-faq-answer-rich ol { margin: 0.4em 0 0.65em 0; padding-left: 1.35em; }
        .organizer-faq-answer-rich li { margin: 0.25em 0; }
        .organizer-faq-answer-rich a { color: #7dd3fc; text-decoration: underline; text-underline-offset: 2px; }
        .organizer-faq-answer-rich a:hover { color: #bae6fd; }
        .organizer-faq-answer-rich code { font-size: 0.92em; padding: 0.1em 0.35em; border-radius: 6px; background: rgba(0,0,0,0.35); }
      `}</style>
      <div
        className={`organizer-faq-answer-rich ${className || ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
