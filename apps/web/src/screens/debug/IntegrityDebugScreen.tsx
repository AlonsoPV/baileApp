import React from "react";
import { env } from "../../lib/env";
import { useUserProfile } from "../../hooks/useUserProfile";
import { guardedPatch } from "../../utils/safeUpdate";

export default function IntegrityDebugScreen() {
  const { profile } = useUserProfile();
  const [draft, setDraft] = React.useState<any>({});

  const patch = guardedPatch(profile || {}, draft, {
    allowEmptyArrays: ["ritmos", "zonas"],
    blockEmptyStrings: ["display_name"],
  });

  return (
    <div style={{
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '1.5rem',
      color: 'white',
      background: '#121212',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
        🔍 Data Integrity Debug
      </h1>
      <div style={{
        fontSize: '0.875rem',
        color: 'rgb(212, 212, 212)',
        marginBottom: '1rem'
      }}>
        REF: <strong>{env.supabase.url}</strong> • URL: {env.supabase.url}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <section style={{
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.75rem',
          background: 'rgba(23, 23, 23, 0.6)'
        }}>
          <h2 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            Perfil actual
          </h2>
          <pre style={{
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '300px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.5rem',
            borderRadius: '0.5rem'
          }}>
            {JSON.stringify(profile, null, 2)}
          </pre>
        </section>

        <section style={{
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.75rem',
          background: 'rgba(23, 23, 23, 0.6)'
        }}>
          <h2 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            Draft (lo que intentarías guardar)
          </h2>
          <textarea
            style={{
              width: '100%',
              height: '10rem',
              background: 'rgb(38, 38, 38)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              fontSize: '0.75rem',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
            placeholder='{"display_name":"Nuevo nombre"}'
            onChange={(e) => {
              try {
                setDraft(JSON.parse(e.target.value || "{}"));
              } catch (err) {
                console.warn('[IntegrityDebug] Invalid JSON:', err);
              }
            }}
          />
        </section>
      </div>

      <section style={{
        borderRadius: '0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0.75rem',
        background: 'rgba(23, 23, 23, 0.6)'
      }}>
        <h2 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
          Patch calculado (enviado al RPC)
        </h2>
        <pre style={{
          fontSize: '0.75rem',
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          {JSON.stringify(patch, null, 2)}
        </pre>
        
        {Object.keys(patch).length === 0 && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(255, 214, 102, 0.1)',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: 'rgb(255, 214, 102)'
          }}>
            ℹ️ No hay cambios para enviar (el patch está vacío)
          </div>
        )}
      </section>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(30, 136, 229, 0.1)',
        borderRadius: '0.75rem',
        border: '1px solid rgba(30, 136, 229, 0.3)',
        fontSize: '0.875rem'
      }}>
        <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
          💡 Cómo usar esta pantalla:
        </h3>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li>El <strong>Perfil actual</strong> muestra tus datos en la base de datos</li>
          <li>Escribe JSON en <strong>Draft</strong> para simular cambios</li>
          <li>El <strong>Patch calculado</strong> muestra solo los campos que cambiarían</li>
          <li>Campos vacíos o sin cambios NO se envían (evita pérdida de datos)</li>
        </ul>
      </div>
    </div>
  );
}

