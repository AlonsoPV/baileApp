import React from "react";
import { useEventSchedules } from "../hooks/useEventSchedules";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventScheduleEditorProps {
  eventDateId: number;
}

export default function EventScheduleEditor({ eventDateId }: EventScheduleEditorProps) {
  const { data: schedules, upsert, remove } = useEventSchedules(eventDateId);
  const [draft, setDraft] = React.useState({ 
    tipo: "clase" as const, 
    titulo: "", 
    hora_inicio: "", 
    hora_fin: "" 
  });

  const handleAdd = () => {
    if (!draft.titulo || !draft.hora_inicio) return;
    
    upsert.mutate({
      ...draft,
      event_date_id: eventDateId
    });
    
    setDraft({ 
      tipo: "clase", 
      titulo: "", 
      hora_inicio: "", 
      hora_fin: "" 
    });
  };

  return (
    <div style={{
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.05)',
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '24px'
    }}>
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: '600',
        marginBottom: '16px',
        color: colors.light
      }}>
        📅 Cronograma del Evento
      </h3>
      
      {/* Lista de actividades existentes */}
      <div style={{ marginBottom: '16px' }}>
        {schedules?.map((s) => (
          <div key={s.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>
              <div style={{ fontWeight: '600', color: colors.light }}>
                {s.titulo}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, color: colors.light }}>
                {s.hora_inicio} {s.hora_fin && `– ${s.hora_fin}`} • {s.tipo}
              </div>
              {s.descripcion && (
                <div style={{ fontSize: '0.8rem', opacity: 0.7, color: colors.light, marginTop: '4px' }}>
                  {s.descripcion}
                </div>
              )}
            </div>
            <button 
              onClick={() => remove.mutate(s.id!)}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.coral,
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px'
              }}
              title="Eliminar actividad"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {(!schedules || schedules.length === 0) && (
          <div style={{
            textAlign: 'center',
            opacity: 0.6,
            color: colors.light,
            padding: '20px',
            fontStyle: 'italic'
          }}>
            No hay actividades programadas aún
          </div>
        )}
      </div>

      {/* Formulario para agregar nueva actividad */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={draft.tipo}
            onChange={(e) => setDraft({...draft, tipo: e.target.value as any})}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid rgba(255,255,255,0.2)`,
              color: colors.light,
              fontSize: '0.9rem'
            }}
          >
            <option value="clase">🎓 Clase</option>
            <option value="show">🎭 Show</option>
            <option value="social">💃 Social</option>
            <option value="otro">📋 Otro</option>
          </select>
          
          <input
            placeholder="Título de la actividad"
            value={draft.titulo}
            onChange={(e) => setDraft({...draft, titulo: e.target.value})}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid rgba(255,255,255,0.2)`,
              color: colors.light,
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="time"
            placeholder="Hora inicio"
            value={draft.hora_inicio}
            onChange={(e) => setDraft({...draft, hora_inicio: e.target.value})}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid rgba(255,255,255,0.2)`,
              color: colors.light,
              fontSize: '0.9rem'
            }}
          />
          
          <input
            type="time"
            placeholder="Hora fin (opcional)"
            value={draft.hora_fin}
            onChange={(e) => setDraft({...draft, hora_fin: e.target.value})}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid rgba(255,255,255,0.2)`,
              color: colors.light,
              fontSize: '0.9rem'
            }}
          />
          
          <button
            onClick={handleAdd}
            disabled={!draft.titulo || !draft.hora_inicio}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: (!draft.titulo || !draft.hora_inicio) 
                ? `${colors.light}33` 
                : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: (!draft.titulo || !draft.hora_inicio) ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            ➕ Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
