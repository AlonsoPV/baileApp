import React, { useState, useEffect } from 'react';
import { BrandProduct } from '../../types/brand';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';

export default function ProductsEditor({
  value, onChange
}: { value: BrandProduct[]; onChange:(v:BrandProduct[])=>void }) {
  const [items, setItems] = useState<BrandProduct[]>(value || []);

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  const update = (next:BrandProduct[]) => { 
    setItems(next); 
    onChange(next); 
  };

  const add = () => {
    const newId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    update([...(items||[]), { 
      id: newId, 
      titulo:'', 
      precio: null, 
      moneda:'MXN', 
      url_externa:'', 
      imagen_url:'' 
    }]);
  };

  const remove = (id?:string) => update((items||[]).filter(i=>i.id!==id));
  
  const patch = (id?:string, p:Partial<BrandProduct>={}) =>
    update((items||[]).map(i=> i.id===id ? { ...i, ...p } : i));

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
          🛍️ Productos
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

      {(items||[]).map((p)=>(
        <div key={p.id} style={{
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
            placeholder="Título del producto"
            value={p.titulo||''} 
            onChange={e=>patch(p.id,{titulo:e.target.value})}
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
            placeholder="Precio"
            type="number" 
            inputMode="decimal"
            value={p.precio ?? ''} 
            onChange={e=>patch(p.id,{precio: e.target.value===''? null : Number(e.target.value)})}
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
            value={p.moneda||'MXN'} 
            onChange={e=>patch(p.id,{moneda:e.target.value})}
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
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
            placeholder="URL de compra"
            value={p.url_externa||''} 
            onChange={e=>patch(p.id,{url_externa:e.target.value})}
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
            placeholder="Imagen (URL)"
            value={p.imagen_url||''} 
            onChange={e=>patch(p.id,{imagen_url:e.target.value})}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={()=>remove(p.id)}
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
          Aún no has agregado productos.
        </div>
      )}
    </div>
  );
}
