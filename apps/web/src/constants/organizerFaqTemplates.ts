/** IDs de plantillas i18n (`organizer_faq.templates.<id>.*`). */
export const ORGANIZER_FAQ_TEMPLATE_IDS = [
  "costs",
  "schedule",
  "location",
  "levels",
  "payment",
  "atmosphere",
  "requirements",
] as const;

export type OrganizerFaqTemplateId = (typeof ORGANIZER_FAQ_TEMPLATE_IDS)[number];
