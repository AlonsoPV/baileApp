import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

let configured = false;

function ensureMarkedConfigured() {
  if (configured) return;
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  configured = true;
}

/** Convierte markdown ligero a HTML y lo sanitiza (enlaces, listas, énfasis). */
export function renderOrganizerFaqAnswerToHtml(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";

  ensureMarkedConfigured();
  const parsed = marked.parse(text, { async: false });
  const html = typeof parsed === "string" ? parsed : "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "span", "code"],
    ALLOWED_ATTR: ["href", "title", "class", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

/** Hook: enlaces externos seguros (una vez por proceso; idempotente). */
let purifyHooked = false;
function ensureLinkHook() {
  if (purifyHooked) return;
  purifyHooked = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName !== "A") return;
    const el = node as Element;
    const href = el.getAttribute("href") || "";
    if (/^https?:\/\//i.test(href)) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
}

ensureLinkHook();
