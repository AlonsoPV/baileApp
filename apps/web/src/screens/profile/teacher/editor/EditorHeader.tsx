import React from 'react';

export default function EditorHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h1>
        {subtitle ? (
          <div style={{ opacity: 0.8, fontSize: 14 }}>{subtitle}</div>
        ) : null}
      </div>
      <div style={{ width: 100 }} />
    </div>
  );
}


