import React from 'react';

export default function ProfileShell({
  header,
  hero,
  actions,
  children,
}: {
  header: React.ReactNode;
  hero?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {header}
      {hero}
      {actions}
      <div>{children}</div>
    </div>
  );
}


