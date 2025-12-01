import React from 'react';

type BasicInfo = { nombre_publico: string; bio: string };

export default function BasicInfoForm({ value, onChange }: { value: BasicInfo; onChange: (patch: Partial<BasicInfo>) => void }) {
  return (
    <div style={{ padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <input
          placeholder="Nombre público"
          value={value.nombre_publico}
          onChange={(e)=>onChange({ nombre_publico: e.target.value })}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.06)', color: '#fff'
          }}
        />
        <textarea
          placeholder="Biografía"
          rows={3}
          value={value.bio || ''}
          onChange={(e)=>onChange({ bio: e.target.value })}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.06)', color: '#fff'
          }}
        />
      </div>
    </div>
  );
}


