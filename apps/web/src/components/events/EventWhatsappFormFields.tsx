import React from "react";

export type EventWhatsappFormFieldsPreset = "drawer" | "orgEditor" | "dcf";

type Props = {
  telefono: string;
  mensaje: string;
  onTelefonoChange: (v: string) => void;
  onMensajeChange: (v: string) => void;
  onPhoneTouched?: () => void;
  onMessageTouched?: () => void;
  /** True when `events_date.telefono_contacto` is saved in DB (not organizer fallback). */
  hasOwnSavedPhone: boolean;
  /** Shown only when there is no saved event phone — clarifies fallback; never the input value. */
  organizerPhoneHint: string | null;
  preset: EventWhatsappFormFieldsPreset;
  /** For optional mensaje autofill on focus */
  eventNombre?: string;
  onMensajeFocusTemplate?: (nombre: string) => void;
};

const hintBoxStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 6,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(30,136,229,0.12)",
  border: "1px solid rgba(30,136,229,0.35)",
  fontSize: 13,
  lineHeight: 1.45,
  color: "rgba(255,255,255,0.92)",
};

export function EventWhatsappFormFields({
  telefono,
  mensaje,
  onTelefonoChange,
  onMensajeChange,
  onPhoneTouched,
  onMessageTouched,
  hasOwnSavedPhone,
  organizerPhoneHint,
  preset,
  eventNombre,
  onMensajeFocusTemplate,
}: Props) {
  const phoneLabel = hasOwnSavedPhone ? "WhatsApp del evento" : "WhatsApp del evento (opcional)";
  const footerPrimary = hasOwnSavedPhone
    ? "Este evento tiene su propio contacto. Este número se guarda solo para esta fecha."
    : "Este número se guardará solo para esta fecha.";

  const inputBase =
    preset === "drawer"
      ? {
          width: "100%" as const,
          marginTop: 6,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.25)",
          color: "#fff",
        }
      : undefined;

  const gridCol = preset === "drawer" ? "1fr 1fr" : undefined;

  const phoneInput =
    preset === "dcf" ? (
      <input
        type="tel"
        value={telefono}
        onChange={(e) => {
          onPhoneTouched?.();
          onTelefonoChange(e.target.value);
        }}
        className="dcf__input"
        placeholder="+52…"
        autoComplete="tel"
      />
    ) : (
      <input
        type="tel"
        value={telefono}
        onChange={(e) => {
          onPhoneTouched?.();
          onTelefonoChange(e.target.value);
        }}
        placeholder={preset === "orgEditor" ? "Ej: 55 1234 5678" : "+52…"}
        className={preset === "orgEditor" ? "org-editor-input" : undefined}
        style={preset === "drawer" ? inputBase : preset === "orgEditor" ? { width: "100%" } : undefined}
        autoComplete="tel"
      />
    );

  const msgInput =
    preset === "dcf" ? (
      <textarea
        value={mensaje}
        onChange={(e) => {
          onMessageTouched?.();
          onMensajeChange(e.target.value);
        }}
        onFocus={() => {
          if (!mensaje && onMensajeFocusTemplate) {
            onMessageTouched?.();
            onMensajeFocusTemplate(eventNombre || "este evento");
          }
        }}
        rows={2}
        className="dcf__textarea"
        placeholder="Hola! Me interesa…"
      />
    ) : (
      <textarea
        value={mensaje}
        onChange={(e) => {
          onMessageTouched?.();
          onMensajeChange(e.target.value);
        }}
        onFocus={() => {
          if (!mensaje && onMensajeFocusTemplate) {
            onMessageTouched?.();
            onMensajeFocusTemplate(eventNombre || "este evento");
          }
        }}
        rows={2}
        placeholder='Ej.: "Hola! Vengo de Donde Bailar MX…"'
        className={preset === "orgEditor" ? "org-editor-textarea" : undefined}
        style={
          preset === "drawer"
            ? {
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                minHeight: 68,
                resize: "vertical" as const,
              }
            : preset === "orgEditor"
              ? { width: "100%", minHeight: 68, resize: "vertical" as const }
              : undefined
        }
      />
    );

  const helperClass = preset === "dcf" ? "dcf__helper" : undefined;
  const labelClass = preset === "dcf" ? "dcf__label" : "org-editor-field";

  const fallbackBoxStyle: React.CSSProperties =
    preset === "dcf"
      ? {
          marginTop: 8,
          marginBottom: 6,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(30,136,229,0.08)",
          border: "1px solid rgba(30,136,229,0.28)",
          fontSize: 14,
          lineHeight: 1.45,
          color: "#0f172a",
        }
      : preset === "drawer"
        ? hintBoxStyle
        : { ...hintBoxStyle, marginTop: 8 };

  const fallbackHints = !hasOwnSavedPhone && (
    <div style={fallbackBoxStyle}>
      <div style={{ fontWeight: preset === "dcf" ? 600 : 700, marginBottom: 4 }}>
        Este evento está usando el WhatsApp del organizador.
      </div>
      <div style={{ opacity: 0.95 }}>Si quieres uno distinto, escríbelo aquí.</div>
      {organizerPhoneHint ? (
        <div style={{ marginTop: 8, fontSize: preset === "dcf" ? 13 : 12, opacity: 0.88 }}>
          Contacto del organizador (referencia): {organizerPhoneHint}
        </div>
      ) : null}
    </div>
  );

  if (preset === "dcf") {
    return (
      <>
        <div className="dcf__field">
          <label className="dcf__label">{phoneLabel}</label>
          {phoneInput}
          {fallbackHints}
          <p className={helperClass}>{footerPrimary}</p>
        </div>
        <div className="dcf__field">
          <label className="dcf__label">Mensaje de saludo para WhatsApp</label>
          {msgInput}
          <p className={helperClass}>
            {hasOwnSavedPhone
              ? "Solo para esta fecha. Si lo dejas vacío al guardar (tras editarlo), se limpia el mensaje guardado en la fecha."
              : "Si lo dejas vacío, no copiamos automáticamente el mensaje del organizador al guardar en esta fecha."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={gridCol ? { display: "grid", gridTemplateColumns: gridCol, gap: 10 } : undefined}>
        <div style={preset === "orgEditor" ? undefined : {}}>
          <label
            className={labelClass}
            style={
              preset === "drawer"
                ? { fontSize: 13, fontWeight: 700, opacity: 0.95, display: "block" }
                : { display: "block", marginBottom: 8, fontWeight: 600 }
            }
          >
            {phoneLabel}
          </label>
          {phoneInput}
          {fallbackHints}
          <span
            style={{
              display: "block",
              marginTop: 6,
              fontSize: preset === "drawer" ? 12 : 14,
              opacity: 0.72,
            }}
          >
            {footerPrimary}
          </span>
        </div>
        <div style={preset === "orgEditor" ? { gridColumn: "1 / -1" } : undefined}>
          <label
            className={labelClass}
            style={
              preset === "drawer"
                ? { fontSize: 13, fontWeight: 700, opacity: 0.95, display: "block" }
                : { display: "block", marginBottom: 8, fontWeight: 600 }
            }
          >
            Mensaje WhatsApp
          </label>
          {msgInput}
          <span
            style={{
              display: "block",
              marginTop: 6,
              fontSize: preset === "drawer" ? 12 : 14,
              opacity: 0.72,
            }}
          >
            {hasOwnSavedPhone
              ? "Solo esta fecha. El fallback del organizador no se guarda aquí si no editas estos campos."
              : "Si no editas número ni mensaje y guardas, no copiamos el WhatsApp del organizador a esta fecha."}
          </span>
        </div>
      </div>
    </>
  );
}
