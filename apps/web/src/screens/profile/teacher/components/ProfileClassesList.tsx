import React from 'react';
import ClasesLive from '../../../../components/events/ClasesLive';

type ClaseItem = {
  id: string;
  titulo: string;
  fecha?: string | null;
  inicio?: string | null;
  fin?: string | null;
  nivel?: string | null;
  ubicacion?: string | null;
  costo?: { label: string; precio?: number | null; tipo?: string } | undefined;
  flyer_url?: string | null;
};

export default function ProfileClassesList({ items = [], ubicacionPreview }: { items?: ClaseItem[]; ubicacionPreview?: { nombre?: string; direccion?: string; ciudad?: string; referencias?: string } }) {
  // Adaptar a props de ClasesLive
  const cronograma = items.map((c) => ({
    titulo: c.titulo,
    inicio: c.inicio || undefined,
    fin: c.fin || undefined,
    nivel: c.nivel || undefined,
    referenciaCosto: c.titulo?.toLowerCase(),
  }));
  const costos = items
    .filter((c) => c.costo)
    .map((c) => ({ nombre: c.titulo?.toLowerCase(), tipo: c.costo?.tipo, precio: c.costo?.precio, regla: c.costo?.label }));

  return (
    <ClasesLive cronograma={cronograma as any} costos={costos as any} ubicacion={ubicacionPreview} showCalendarButton={true} />
  );
}


