import React from 'react';

export default function ProfileGallery({ items = [] as Array<{ type: 'image' | 'video'; url: string }> }) {
  if (!items.length) return null;
  return (
    <div style={{
      padding: 16,
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.14)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
            {it.type === 'image' ? (
              <img src={it.url} alt={`media-${i}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            ) : (
              <video src={it.url} controls style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


