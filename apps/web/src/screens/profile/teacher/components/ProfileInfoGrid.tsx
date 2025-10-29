import React from 'react';

export default function ProfileInfoGrid({
  ubicacion,
  ritmos,
}: {
  ubicacion?: string | null;
  ritmos?: number[] | string[];
}) {
  return (
    <div style={{
      display: 'grid',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.14)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
    }}>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Ubicación</div>
        <div style={{ opacity: 0.9 }}>{ubicacion || '—'}</div>
      </div>
      {ritmos && (ritmos as any[]).length > 0 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Ritmos</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(ritmos as any[]).map((r, i) => (
              <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)' }}>{String(r)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


