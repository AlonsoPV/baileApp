import React from 'react';
import { avatarFromName } from '@/lib/avatar';

export default function Avatar({
  src,
  name = '',
  size = 64,
  rounded = true,
  style
}: { src?: string; name?: string; size?: number; rounded?: boolean; style?: React.CSSProperties }) {
  const [imgSrc, setImgSrc] = React.useState<string | undefined>(src);
  const initials = (name || 'U').trim().charAt(0).toUpperCase();
  const fallbackUrl = avatarFromName(name, size);

  return imgSrc ? (
    <img
      src={imgSrc}
      alt={name || 'avatar'}
      width={size}
      height={size}
      onError={() => setImgSrc(undefined)}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '50%' : 8,
        objectFit: 'cover',
        display: 'block',
        ...style
      }}
    />
  ) : (
    <div
      aria-label="avatar-fallback"
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '50%' : 8,
        background: 'linear-gradient(135deg,#1E293B,#0B1220)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        ...style
      }}
      title={name}
    >
      {initials}
    </div>
  );
}


