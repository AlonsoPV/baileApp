import React from 'react';
import { PhotoManagementSection } from '../../../../components/profile/PhotoManagementSection';
import { VideoManagementSection } from '../../../../components/profile/VideoManagementSection';

export default function GalleryManager({
  media,
  onAdd,
  onRemove,
}: {
  media: any[];
  onAdd: (file: File, slot: string) => void;
  onRemove: (slot: string) => void;
}) {
  return (
    <div style={{ padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)' }}>
      <PhotoManagementSection
        media={media}
        uploading={{}}
        uploadFile={onAdd}
        removeFile={onRemove}
        title="📷 Fotos del Maestro"
        description="Sube tus fotos de clases, presentaciones o retratos"
        slots={['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10']}
      />
      <div style={{ height: 16 }} />
      <VideoManagementSection
        media={media}
        uploading={{}}
        uploadFile={onAdd}
        removeFile={onRemove}
        title="🎥 Videos del Maestro"
        description="Comparte videos de clases, sociales o demos"
        slots={['v1','v2','v3']}
      />
    </div>
  );
}


