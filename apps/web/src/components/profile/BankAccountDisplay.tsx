import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { type BankAccountData } from "./BankAccountEditor";
import { colors, typography, spacing, borderRadius } from "../../theme/colors";

interface BankAccountDisplayProps {
  data: BankAccountData | null | undefined;
}

export default function BankAccountDisplay({ data }: BankAccountDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Verificar si hay datos para mostrar (con validación más robusta)
  const hasData = React.useMemo(() => {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Verificar si al menos un campo tiene contenido válido
    const hasValidField = (
      (data.banco && String(data.banco).trim()) || 
      (data.nombre && String(data.nombre).trim()) || 
      (data.concepto && String(data.concepto).trim()) || 
      (data.clabe && String(data.clabe).trim()) || 
      (data.cuenta && String(data.cuenta).trim())
    );
    
    return !!hasValidField;
  }, [data]);

  if (!hasData) {
    return null;
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const FieldRow = ({ label, value, fieldName }: { label: string; value?: string; fieldName: string }) => {
    // Validar que el valor existe y no está vacío
    if (!value || !String(value).trim()) return null;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[3],
        borderRadius: borderRadius.md,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: spacing[1]
          }}>
            {label}
          </div>
          <div style={{
            fontSize: typography.fontSize.base,
            fontWeight: 500,
            color: colors.light,
            fontFamily: fieldName === 'clabe' || fieldName === 'cuenta' ? 'monospace' : 'inherit',
            letterSpacing: fieldName === 'clabe' || fieldName === 'cuenta' ? '0.05em' : 'normal',
            wordBreak: 'break-word'
          }}>
            {value}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => copyToClipboard(value, fieldName)}
          aria-label={`Copiar ${label}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: borderRadius.md,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: copiedField === fieldName 
              ? 'rgba(76, 175, 80, 0.2)' 
              : 'rgba(255, 255, 255, 0.08)',
            color: copiedField === fieldName ? '#4CAF50' : 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          {copiedField === fieldName ? (
            <span style={{ fontSize: '1.2rem' }}>✓</span>
          ) : (
            <span style={{ fontSize: '1rem' }}>📋</span>
          )}
        </motion.button>
      </div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card"
      style={{
        marginBottom: spacing[8],
        padding: spacing[8],
        borderRadius: borderRadius['2xl']
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[4],
        marginBottom: spacing[6]
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: colors.gradients.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: typography.fontSize['2xl'],
          boxShadow: colors.shadows.glow
        }}>
          🏦
        </div>
        <div>
          <h3 className="section-title" style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: colors.light
          }}>
            Datos de Cuenta Bancaria
          </h3>
          <p style={{
            fontSize: typography.fontSize.sm,
            opacity: 0.8,
            margin: 0,
            color: colors.light
          }}>
            Información bancaria para recibir pagos
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gap: spacing[3]
      }}>
        <FieldRow label="Banco" value={data.banco} fieldName="banco" />
        <FieldRow label="Nombre del Titular" value={data.nombre} fieldName="nombre" />
        <FieldRow label="Concepto de Pago" value={data.concepto} fieldName="concepto" />
        <FieldRow label="CLABE Interbancaria" value={data.clabe} fieldName="clabe" />
        <FieldRow label="Número de Cuenta" value={data.cuenta} fieldName="cuenta" />
      </div>

      <div style={{
        marginTop: spacing[4],
        padding: spacing[3],
        borderRadius: borderRadius.md,
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        fontSize: typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 1.5
      }}>
        <strong>💡 Tip:</strong> Haz clic en el icono 📋 junto a cada campo para copiar la información al portapapeles.
      </div>
    </motion.section>
  );
}

