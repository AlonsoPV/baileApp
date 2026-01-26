import React from 'react';

export default function ProfileHero({
  bannerUrl,
  chips,
  bio,
}: {
  bannerUrl?: string;
  chips?: { ritmos?: string[]; zonas?: string[] };
  bio?: string;
}) {
  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.14)'
    }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'rgba(0,0,0,0.2)' }}>
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Banner"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>
      <div style={{ padding: 16 }}>
        {(chips?.ritmos?.length || chips?.zonas?.length) ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {(chips?.ritmos || []).map((r, i) => (
              <span key={`r-${i}`} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)' }}>🎵 {r}</span>
            ))}
            {(chips?.zonas || []).map((z, i) => (
              <span key={`z-${i}`} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)' }}>📍 {z}</span>
            ))}
          </div>
        ) : null}
        {bio && <p style={{ margin: 0, opacity: 0.9 }}>{bio}</p>}
      </div>
    </div>
  );
}


