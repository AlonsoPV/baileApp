import React from 'react';

export default function ProfileHeader({
  nombre,
  avatar,
  tipo = 'teacher',
  redes,
}: {
  nombre: string;
  avatar?: string;
  tipo?: 'teacher';
  redes?: Record<string, any>;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
        {avatar ? (
          <img src={avatar} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.08)' }}>🎓</div>
        )}
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{nombre}</h1>
        <div style={{ opacity: 0.8, fontSize: 14 }}>Perfil de {tipo === 'teacher' ? 'Maestro' : 'Academia'}</div>
      </div>
    </div>
  );
}


