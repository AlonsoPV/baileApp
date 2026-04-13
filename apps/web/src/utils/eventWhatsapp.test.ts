import { describe, expect, it } from "vitest";

import {
  buildEventWhatsappPayload,
  buildEventWhatsappUrl,
  getEventWhatsapp,
  mergeWhatsappIntoUpdatePatch,
  normalizeWhatsappPhoneForLink,
  readWhatsappPhone,
} from "./eventWhatsapp";

describe("eventWhatsapp", () => {
  it("prioritizes the whatsapp stored on the event date", () => {
    const resolved = getEventWhatsapp(
      { telefono_contacto: " 55 1111 2222 ", mensaje_contacto: "Hola fecha" },
      { whatsapp_number: "55 9999 0000" },
      { whatsapp_number: "55 8888 7777" },
    );

    expect(resolved).toMatchObject({
      phone: "55 1111 2222",
      message: "Hola fecha",
      source: "event_date",
      ownPhone: "55 1111 2222",
    });
  });

  it("falls back to organizer whatsapp without turning it into own event data", () => {
    const resolved = getEventWhatsapp(
      { telefono_contacto: "   ", mensaje_contacto: "   " },
      null,
      { whatsapp_number: "+52 55 3333 4444", whatsapp_message_template: "Hola org" },
    );

    expect(resolved).toMatchObject({
      phone: "+52 55 3333 4444",
      message: "Hola org",
      source: "organizer",
      ownPhone: null,
      ownMessage: null,
    });
  });

  it("builds save payload from only the event form fields", () => {
    expect(
      buildEventWhatsappPayload({
        telefono_contacto: " 55 1234 5678 ",
        mensaje_contacto: " Hola! ",
      }),
    ).toEqual({
      telefono_contacto: "55 1234 5678",
      mensaje_contacto: "Hola!",
    });
  });

  it("normalizes digits only for the outbound whatsapp link", () => {
    expect(normalizeWhatsappPhoneForLink("+52 55 1234 5678")).toBe("525512345678");
    expect(buildEventWhatsappUrl("+52 55 1234 5678", "Hola", "Social")).toContain(
      "phone=525512345678",
    );
  });

  it("exports readWhatsappPhone for organizer hints", () => {
    expect(readWhatsappPhone({ whatsapp_number: " 55 0000 " })).toBe("55 0000");
  });

  it("mergeWhatsappIntoUpdatePatch omits fields when not touched", () => {
    const patch: Record<string, unknown> = { nombre: "X" };
    mergeWhatsappIntoUpdatePatch(
      patch,
      { telefono_contacto: "55 1111", mensaje_contacto: "Hola" },
      { phone: false, message: false },
    );
    expect(patch.telefono_contacto).toBeUndefined();
    expect(patch.mensaje_contacto).toBeUndefined();
  });

  it("mergeWhatsappIntoUpdatePatch includes fields when touched", () => {
    const patch: Record<string, unknown> = {};
    mergeWhatsappIntoUpdatePatch(
      patch,
      { telefono_contacto: " 55 2222 ", mensaje_contacto: " Msg " },
      { phone: true, message: true },
    );
    expect(patch).toMatchObject({
      telefono_contacto: "55 2222",
      mensaje_contacto: "Msg",
    });
  });
});
