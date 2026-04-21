import React from "react";
import "./BankAccountEditor.css";

export type BankAccountData = {
  banco?: string;
  nombre?: string;
  concepto?: string;
  clabe?: string;
  cuenta?: string;
};

interface BankAccountEditorProps {
  value: BankAccountData;
  onChange: (data: BankAccountData) => void;
  /** Sin caja ni título interno: para cuando la tarjeta y el h2 ya están en el padre (p. ej. Academia). */
  embedded?: boolean;
}

export default function BankAccountEditor({
  value,
  onChange,
  embedded = false,
}: BankAccountEditorProps) {
  const handleChange = (field: keyof BankAccountData, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const rootClass = embedded
    ? "bank-account-editor bank-account-editor--embedded"
    : "bank-account-editor";

  return (
    <div className={rootClass}>
      {!embedded && (
        <>
          <h3 className="bank-account-editor__title">🏦 Datos de cuenta bancaria</h3>
          <p className="bank-account-editor__intro">
            Ingresa la información para recibir pagos. Es privada: solo tú puedes verla en el editor.
          </p>
        </>
      )}

      <div className="bank-account-editor__group">
        <span className="bank-account-editor__group-label">Titular y banco</span>
        <div className="bank-account-editor__grid">
          <div className="bank-account-editor__field">
            <label className="bank-account-editor__label" htmlFor="bank-account-banco">
              Banco <span className="bank-account-editor__label-hint">(requerido)</span>
            </label>
            <input
              id="bank-account-banco"
              type="text"
              className="bank-account-editor__input"
              value={value.banco || ""}
              onChange={(e) => handleChange("banco", e.target.value)}
              placeholder="Ej. BBVA, Santander, Banorte…"
              autoComplete="off"
            />
          </div>
          <div className="bank-account-editor__field">
            <label className="bank-account-editor__label" htmlFor="bank-account-nombre">
              Nombre del titular <span className="bank-account-editor__label-hint">(requerido)</span>
            </label>
            <input
              id="bank-account-nombre"
              type="text"
              className="bank-account-editor__input"
              value={value.nombre || ""}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Como aparece en la cuenta"
              autoComplete="name"
            />
          </div>
        </div>
      </div>

      <div className="bank-account-editor__group">
        <span className="bank-account-editor__group-label">Cuenta para depósitos o transferencias</span>
        <div className="bank-account-editor__grid">
          <div className="bank-account-editor__field">
            <label className="bank-account-editor__label" htmlFor="bank-account-clabe">
              CLABE interbancaria <span className="bank-account-editor__label-hint">(18 dígitos)</span>
            </label>
            <input
              id="bank-account-clabe"
              type="text"
              inputMode="numeric"
              className="bank-account-editor__input bank-account-editor__input--mono"
              value={value.clabe || ""}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "").slice(0, 18);
                handleChange("clabe", numericValue);
              }}
              placeholder="18 dígitos"
              maxLength={18}
              autoComplete="off"
            />
            {Boolean(value.clabe) && value.clabe!.length !== 18 && (
              <p className="bank-account-editor__field-hint">La CLABE debe tener 18 dígitos.</p>
            )}
          </div>
          <div className="bank-account-editor__field">
            <label className="bank-account-editor__label" htmlFor="bank-account-cuenta">
              Número de cuenta <span className="bank-account-editor__label-hint">(requerido)</span>
            </label>
            <input
              id="bank-account-cuenta"
              type="text"
              inputMode="numeric"
              className="bank-account-editor__input bank-account-editor__input--mono"
              value={value.cuenta || ""}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");
                handleChange("cuenta", numericValue);
              }}
              placeholder="Solo números"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="bank-account-editor__group">
        <span className="bank-account-editor__group-label">Opcional</span>
        <div className="bank-account-editor__grid">
          <div className="bank-account-editor__field bank-account-editor__field--full">
            <label className="bank-account-editor__label" htmlFor="bank-account-concepto">
              Concepto de pago sugerido
            </label>
            <input
              id="bank-account-concepto"
              type="text"
              className="bank-account-editor__input"
              value={value.concepto || ""}
              onChange={(e) => handleChange("concepto", e.target.value)}
              placeholder="Ej. Mensualidad clase salsa, Inscripción evento…"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="bank-account-editor__privacy">
        <span className="bank-account-editor__privacy-icon" aria-hidden>
          🔒
        </span>
        <span>
          <strong>Privacidad:</strong> no se muestra en tu perfil público. Se usa solo para coordinar pagos cuando
          aplica.
        </span>
      </div>
    </div>
  );
}
