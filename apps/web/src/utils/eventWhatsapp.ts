type WhatsappLikeRecord = {
  telefono_contacto?: unknown;
  mensaje_contacto?: unknown;
  whatsapp_number?: unknown;
  whatsapp_message_template?: unknown;
  redes_sociales?: {
    whatsapp?: unknown;
  } | null;
} | null | undefined;

export type EventWhatsappSource = "event_date" | "event_parent" | "organizer" | "none";

export type ResolvedEventWhatsapp = {
  phone: string | null;
  message: string | null;
  source: EventWhatsappSource;
  ownPhone: string | null;
  ownMessage: string | null;
};

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readWhatsappPhone(record: WhatsappLikeRecord): string | null {
  return (
    normalizeOptionalText(record?.telefono_contacto) ??
    normalizeOptionalText(record?.whatsapp_number) ??
    normalizeOptionalText(record?.redes_sociales?.whatsapp) ??
    null
  );
}

function readWhatsappMessage(record: WhatsappLikeRecord): string | null {
  return (
    normalizeOptionalText(record?.mensaje_contacto) ??
    normalizeOptionalText(record?.whatsapp_message_template) ??
    null
  );
}

export function normalizeWhatsappPhoneForStorage(value: unknown): string | null {
  return normalizeOptionalText(value);
}

export function normalizeWhatsappPhoneForLink(value: unknown): string | null {
  const text = normalizeOptionalText(value);
  if (!text) return null;
  const digits = text.replace(/\D+/g, "");
  return digits.length > 0 ? digits : null;
}

export function buildEventWhatsappPayload(input: {
  telefono_contacto?: unknown;
  mensaje_contacto?: unknown;
}) {
  return {
    telefono_contacto: normalizeWhatsappPhoneForStorage(input?.telefono_contacto),
    mensaje_contacto: normalizeOptionalText(input?.mensaje_contacto),
  };
}

/** Dev-only traces to validate form lifecycle (init / reset / save). */
export function whatsappFormDebugLog(
  tag: "[WHATSAPP_FORM_INIT]" | "[WHATSAPP_FORM_RESET]" | "[WHATSAPP_SAVE_PAYLOAD]",
  data?: unknown,
) {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.log(tag, data ?? "");
}

/**
 * For PATCH updates: only include WhatsApp columns the user explicitly edited,
 * so we never persist the organizer fallback as if it were saved on `events_date`.
 */
export function mergeWhatsappIntoUpdatePatch(
  patch: Record<string, unknown>,
  form: { telefono_contacto?: unknown; mensaje_contacto?: unknown },
  touched: { phone: boolean; message: boolean },
) {
  const w = buildEventWhatsappPayload(form);
  const mergedKeys: string[] = [];
  if (touched.phone) {
    patch.telefono_contacto = w.telefono_contacto;
    mergedKeys.push("telefono_contacto");
  }
  if (touched.message) {
    patch.mensaje_contacto = w.mensaje_contacto;
    mergedKeys.push("mensaje_contacto");
  }
  whatsappFormDebugLog("[WHATSAPP_SAVE_PAYLOAD]", {
    touched,
    mergedKeys,
    telefono_contacto: touched.phone ? w.telefono_contacto : undefined,
    mensaje_contacto: touched.message ? w.mensaje_contacto : undefined,
  });
}

/** Phone stored on the date row (not inherited at runtime). */
export function eventDateHasOwnWhatsappPhone(eventDate?: WhatsappLikeRecord): boolean {
  return !!normalizeOptionalText(eventDate?.telefono_contacto);
}

/** Organizer number for hint text only (never a substitute for saved event data). */
export function getOrganizerWhatsappHintPhone(organizer?: WhatsappLikeRecord): string | null {
  return readWhatsappPhone(organizer);
}

export function getEventWhatsapp(
  eventDate?: WhatsappLikeRecord,
  eventParent?: WhatsappLikeRecord,
  organizer?: WhatsappLikeRecord,
): ResolvedEventWhatsapp {
  const ownPhone = readWhatsappPhone(eventDate);
  const ownMessage = readWhatsappMessage(eventDate);
  if (ownPhone) {
    return {
      phone: ownPhone,
      message: ownMessage,
      source: "event_date",
      ownPhone,
      ownMessage,
    };
  }

  const parentPhone = readWhatsappPhone(eventParent);
  if (parentPhone) {
    return {
      phone: parentPhone,
      message: readWhatsappMessage(eventParent),
      source: "event_parent",
      ownPhone,
      ownMessage,
    };
  }

  const organizerPhone = readWhatsappPhone(organizer);
  if (organizerPhone) {
    return {
      phone: organizerPhone,
      message: readWhatsappMessage(organizer),
      source: "organizer",
      ownPhone,
      ownMessage,
    };
  }

  return {
    phone: null,
    message: null,
    source: "none",
    ownPhone,
    ownMessage,
  };
}

export function buildEventWhatsappUrl(
  phone?: string | null,
  message?: string | null,
  eventName?: string | null,
) {
  const cleanedPhone = normalizeWhatsappPhoneForLink(phone);
  if (!cleanedPhone) return undefined;

  const trimmed = normalizeOptionalText(message);

  let baseMessage = "";
  if (trimmed) {
    baseMessage = trimmed;
  } else if (typeof eventName === "string" && eventName.trim()) {
    baseMessage = `I'm interested in the event: ${eventName.trim()}`;
  } else {
    baseMessage = "I'm interested in this event";
  }

  const lowered = baseMessage.toLowerCase();
  const hasPrefix =
    lowered.includes("hi, i'm from donde bailar mx") ||
    lowered.includes("hola vengo de donde bailar mx");

  const finalMessage = hasPrefix ? baseMessage : `Hi, I'm from Donde Bailar MX, ${baseMessage}`;
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(finalMessage)}`;
}
