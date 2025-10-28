import React, { useState, useEffect } from 'react';
import { AcademyLocation } from '../../types/academy';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { useTags } from '../../hooks/useTags';

export default function UbicacionesEditor({
  value, onChange
}: { value: AcademyLocation[]; onChange:(v:AcademyLocation[])=>void }) {
  const [items, setItems] = useState<AcademyLocation[]>(value || []);
  const { zonas } = useTags('zona');

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  const update = (next:AcademyLocation[]) => { 
    setItems(next); 
    onChange(next); 
  };

  const add = () => {
    const newId = `ubicacion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    update([...(items||[]), { 
      sede: '', 
      direccion: '', 
      ciudad: '', 
      zona_id: null,
      referencias: ''
    }]);
  };

  const remove = (index: number) => update((items||[]).filter((_, i) => i !== index));
  
  const patch = (index: number, p: Partial<AcademyLocation>) =>
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
          📍 Ubicaciones
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing[3],
          padding: spacing[3],
          borderRadius: borderRadius.xl,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          marginBottom: spacing[3]
        }}>
          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Nombre de la sede"
            value={item.sede || ''} 
            onChange={e=>patch(index, {sede: e.target.value})}
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
            placeholder="Dirección"
            value={item.direccion || ''} 
            onChange={e=>patch(index, {direccion: e.target.value})}
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
            placeholder="Ciudad"
            value={item.ciudad || ''} 
            onChange={e=>patch(index, {ciudad: e.target.value})}
          />
          
          <select
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            value={item.zona_id || ''}
            onChange={e=>patch(index, { zona_id: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Seleccionar zona</option>
            {(zonas || []).map((z:any) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>

          <textarea
            style={{
              gridColumn: '1 / -1',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm,
              minHeight: 64
            }}
            placeholder="Notas / referencias"
            value={item.referencias || ''}
            onChange={e=>patch(index, { referencias: e.target.value })}
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
          Aún no has agregado ubicaciones.
        </div>
      )}
    </div>
  );
}
