import React from 'react';
import { useOrganizerLocations } from '../../hooks/useOrganizerLocations';

type Props = {
  organizerId?: number;
  onPick: (loc: {
    id?: number;
    nombre?: string;
    direccion?: string;
    ciudad?: string | null;
    referencias?: string;
    zona_id?: number | null;
    zona_ids?: number[] | null;
  }) => void;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
};

const colors = {
  line: 'rgba(255,255,255,0.12)',
  panel: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  mut: 'rgba(255,255,255,0.75)'
};

export default function OrganizerLocationPicker({ organizerId, onPick, title = 'Buscar ubicación', className, style }: Props) {
  const { data = [], isLoading } = useOrganizerLocations(organizerId);
  const [term, setTerm] = React.useState('');

  const list = React.useMemo(() => {
    if (!term.trim()) return data;
    const q = term.trim().toLowerCase();
    return data.filter((u: any) =>
      (u?.nombre || '').toLowerCase().includes(q) ||
      (u?.direccion || '').toLowerCase().includes(q) ||
      (u?.referencias || '').toLowerCase().includes(q)
    );
  }, [data, term]);

  if (!organizerId) return null;

  return (
    <div className={className} style={{ ...style, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, color: colors.text }}>{title}</div>
        {isLoading && <div style={{ fontSize: 12, color: colors.mut }}>Cargando...</div>}
      </div>
      <div style={{ border: `1px solid ${colors.line}`, borderRadius: 10, background: colors.panel, padding: 6 }}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nombre, dirección o referencias"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: colors.text,
            fontSize: 14,
            padding: '8px 10px'
          }}
        />
      </div>

      {list.length > 0 ? (
        <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
          {list.map((u: any) => (
            <button
              key={u.id}
              type="button"
              onClick={() =>
                onPick({
                  id: u.id,
                  nombre: u.nombre,
                  direccion: u.direccion,
                  ciudad: u.ciudad,
                  referencias: u.referencias,
                  zona_id: typeof u.zona_id === 'number' ? u.zona_id : null,
                  zona_ids: u.zona_ids,
                })
              }
              style={{
                textAlign: 'left',
                border: `1px solid ${colors.line}`,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                color: colors.text,
                padding: '10px 12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{u?.nombre || 'Ubicación'}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{u?.direccion}</div>
              {u?.referencias && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Ref: {u.referencias}</div>}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: colors.mut }}>
          {term.trim() ? 'Sin resultados' : 'No hay ubicaciones guardadas todavía'}
        </div>
      )}
    </div>
  );
}


