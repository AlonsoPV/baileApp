import React, { useState, useEffect } from 'react';
import { AcademyHorario } from '../../types/academy';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';

const DIAS_SEMANA = [
  { value: 'Lun', label: 'Lunes' },
  { value: 'Mar', label: 'Martes' },
  { value: 'Mie', label: 'Miércoles' },
  { value: 'Jue', label: 'Jueves' },
  { value: 'Vie', label: 'Viernes' },
  { value: 'Sab', label: 'Sábado' },
  { value: 'Dom', label: 'Domingo' }
];

export default function HorariosEditor({
  value, onChange
}: { value: AcademyHorario[]; onChange:(v:AcademyHorario[])=>void }) {
  const [items, setItems] = useState<AcademyHorario[]>(value || []);

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  const update = (next:AcademyHorario[]) => { 
    setItems(next); 
    onChange(next); 
  };

  const add = () => {
    update([...(items||[]), { 
      dia: 'Lun', 
      desde: '', 
      hasta: '', 
      ritmo_id: null 
    }]);
  };

  const remove = (index: number) => update((items||[]).filter((_, i) => i !== index));
  
  const patch = (index: number, p: Partial<AcademyHorario>) =>
    update((items||[]).map((item, i) => i === index ? { ...item, ...p } : item));

  return (
    <div style={{ marginTop: spacing[6] }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[4]
      }}>
        <h3 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.light
        }}>
          ⏰ Horarios de Clases
        </h3>
        <button 
          type="button" 
          onClick={add}
          style={{
            padding: `${spacing[2]} ${spacing[3]}`,
            borderRadius: borderRadius.lg,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: colors.light,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Agregar
        </button>
      </div>

      {(items||[]).map((item, index)=>(
        <div key={index} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: spacing[3],
          padding: spacing[3],
          borderRadius: borderRadius.xl,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          marginBottom: spacing[3]
        }}>
          <select
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            value={item.dia} 
            onChange={e=>patch(index, {dia: e.target.value})}
          >
            {DIAS_SEMANA.map(dia => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </select>
          
          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Desde (HH:MM)"
            type="time"
            value={item.desde || ''} 
            onChange={e=>patch(index, {desde: e.target.value})}
          />
          
          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Hasta (HH:MM)"
            type="time"
            value={item.hasta || ''} 
            onChange={e=>patch(index, {hasta: e.target.value})}
          />
          
          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Ritmo ID (opcional)"
            type="number"
            value={item.ritmo_id || ''} 
            onChange={e=>patch(index, {ritmo_id: e.target.value ? Number(e.target.value) : null})}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={()=>remove(index)}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.lg,
                background: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                color: colors.light,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      {(items||[]).length===0 && (
        <div style={{
          fontSize: typography.fontSize.sm,
          opacity: 0.7,
          color: colors.light,
          textAlign: 'center',
          padding: spacing[4]
        }}>
          Aún no has agregado horarios de clases.
        </div>
      )}
    </div>
  );
}
