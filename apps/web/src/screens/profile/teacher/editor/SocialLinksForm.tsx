import React from 'react';

export default function SocialLinksForm({
  value,
  onChange,
}: {
  value: any;
  onChange: (redes: any) => void;
}) {
  const platforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp'] as const;

  return (
    <div style={{ padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ fontWeight: 800, color: '#fff' }}>Redes Sociales</div>
        {platforms.map((p) => (
          <label key={p} style={{ display: 'grid', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, color: '#fff' }}>{p}</div>
            <input
              value={String((value || {})[p] || '')}
              onChange={(e) => onChange({ ...(value || {}), [p]: e.target.value })}
              placeholder={p === 'whatsapp' ? '52XXXXXXXXXX' : `https://${p}.com/... o @handle`}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                outline: 'none',
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}


