import React from 'react';
import ScheduleEditor from '../../../../components/events/ScheduleEditor';
import CostsEditor from '../../../../components/events/CostsEditor';

export default function ClassesManager({
  cronograma,
  costos,
  onCronogramaChange,
  onCostosChange,
  ritmos,
  locations,
}: {
  cronograma: any[];
  costos: any[];
  onCronogramaChange: (v: any[]) => void;
  onCostosChange: (v: any[]) => void;
  ritmos: Array<{ id: number; nombre: string }>;
  locations: string[];
}) {
  return (
    <div style={{ padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)', display: 'grid', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, marginBottom: 12 }}>🗓️ Clases & Talleres (Cronograma)</h3>
        <ScheduleEditor value={cronograma} onChange={onCronogramaChange} ritmos={ritmos} locations={locations} costos={costos} />
      </div>
      <div>
        <h3 style={{ margin: 0, marginBottom: 12 }}>💰 Costos y Promociones</h3>
        <CostsEditor value={costos} onChange={onCostosChange} />
      </div>
    </div>
  );
}


