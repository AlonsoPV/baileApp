import React from "react";

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
}

export default function BankAccountEditor({ value, onChange }: BankAccountEditorProps) {
  const handleChange = (field: keyof BankAccountData, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '16px',
      padding: '1.5rem',
      background: 'rgba(255,255,255,0.05)',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        marginBottom: '1rem',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🏦 Datos de Cuenta Bancaria
      </h3>
      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '1.25rem',
        lineHeight: 1.5
      }}>
        Ingresa la información de tu cuenta bancaria para recibir pagos. Esta información es privada y solo tú puedes verla.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        {/* Banco */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.9)'
          }}>
            Banco *
          </label>
          <input
            type="text"
            value={value.banco || ''}
            onChange={(e) => handleChange('banco', e.target.value)}
            placeholder="Ej: BBVA, Banamex, Santander..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          />
        </div>

        {/* Nombre del titular */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.9)'
          }}>
            Nombre del Titular *
          </label>
          <input
            type="text"
            value={value.nombre || ''}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre completo del titular"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          />
        </div>

        {/* Concepto */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.9)'
          }}>
            Concepto de Pago
          </label>
          <input
            type="text"
            value={value.concepto || ''}
            onChange={(e) => handleChange('concepto', e.target.value)}
            placeholder="Ej: Clases de baile, Evento..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          />
        </div>

        {/* CLABE */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.9)'
          }}>
            CLABE Interbancaria *
          </label>
          <input
            type="text"
            value={value.clabe || ''}
            onChange={(e) => {
              // Solo permitir números y máximo 18 caracteres
              const numericValue = e.target.value.replace(/\D/g, '').slice(0, 18);
              handleChange('clabe', numericValue);
            }}
            placeholder="18 dígitos"
            maxLength={18}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          />
          {value.clabe && value.clabe.length !== 18 && (
            <small style={{
              display: 'block',
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              La CLABE debe tener 18 dígitos
            </small>
          )}
        </div>

        {/* Número de cuenta */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.9)'
          }}>
            Número de Cuenta *
          </label>
          <input
            type="text"
            value={value.cuenta || ''}
            onChange={(e) => {
              // Solo permitir números
              const numericValue = e.target.value.replace(/\D/g, '');
              handleChange('cuenta', numericValue);
            }}
            placeholder="Número de cuenta"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          />
        </div>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'rgba(255,193,7,0.1)',
        border: '1px solid rgba(255,193,7,0.3)',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 1.5
      }}>
        <strong>🔒 Privacidad:</strong> Esta información es completamente privada y solo tú puedes verla. Se utilizará únicamente para procesar pagos cuando sea necesario.
      </div>
    </div>
  );
}

