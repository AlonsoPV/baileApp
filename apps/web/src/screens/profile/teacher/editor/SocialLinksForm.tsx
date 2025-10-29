import React from 'react';
import SocialMediaSection from '../../../../components/profile/SocialMediaSection';

export default function SocialLinksForm({
  value,
  onChange,
}: {
  value: any;
  onChange: (redes: any) => void;
}) {
  return (
    <div style={{ padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)' }}>
      <SocialMediaSection
        availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp']}
        respuestas={{ redes: value || {} }}
        redes_sociales={value || {}}
        onChange={(v:any)=>onChange(v)}
        title="Redes Sociales"
      />
    </div>
  );
}


