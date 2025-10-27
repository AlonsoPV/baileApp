import React from "react";
import { useEventPrices, useCreatePrice, useDeletePrice } from "../hooks/useEventPrices";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventPriceEditorProps {
  eventDateId: number;
}

export default function EventPriceEditor({ eventDateId }: EventPriceEditorProps) {
  const { data: prices } = useEventPrices(eventDateId);
  const createPrice = useCreatePrice();
  const deletePrice = useDeletePrice();
  const [draft, setDraft] = React.useState({ 
    tipo: "preventa" as const, 
    nombre: "", 
    monto: 0 
  });

  const handleAdd = () => {
    if (!draft.nombre || draft.monto <= 0) return;
    // Mapear a payload esperado por el RPC
    createPrice.mutate({
      event_id: eventDateId,
      nombre: draft.nombre,
      precio: draft.monto,
      moneda: 'MXN',
      tipo: draft.tipo,
      activo: true
    });
    
    setDraft({ 
      tipo: "preventa", 
      nombre: "", 
      monto: 0 
    });
  };

  const formatPrice = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
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
        💰 Costos y Promociones
      </h3>
      
      {/* Lista de precios existentes */}
      <div style={{ marginBottom: '16px' }}>
        {prices?.map((p) => (
          <div key={p.id} style={{
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
                {p.nombre}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, color: colors.light }}>
                {formatPrice(p.precio || 0)} • {p.tipo}
                {p.hora_inicio && p.hora_fin && (
                  <span> • {p.hora_inicio} - {p.hora_fin}</span>
                )}
              </div>
              {p.descripcion && (
                <div style={{ fontSize: '0.8rem', opacity: 0.7, color: colors.light, marginTop: '4px' }}>
                  {p.descripcion}
                </div>
              )}
              {p.descuento && p.descuento > 0 && (
                <div style={{ fontSize: '0.8rem', color: colors.yellow, marginTop: '4px' }}>
                  🎯 Descuento: {p.descuento}%
                </div>
              )}
            </div>
            <button 
              onClick={() => deletePrice.mutate(p.id!)}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.coral,
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px'
              }}
              title="Eliminar precio"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {(!prices || prices.length === 0) && (
          <div style={{
            textAlign: 'center',
            opacity: 0.6,
            color: colors.light,
            padding: '20px',
            fontStyle: 'italic'
          }}>
            No hay precios configurados aún
          </div>
        )}
      </div>

      {/* Formulario para agregar nuevo precio */}
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
            <option value="preventa">🎫 Preventa</option>
            <option value="taquilla">🎪 Taquilla</option>
            <option value="promo">🎁 Promoción</option>
          </select>
          
          <input
            placeholder="Nombre del precio (ej: General, VIP, Estudiante)"
            value={draft.nombre}
            onChange={(e) => setDraft({...draft, nombre: e.target.value})}
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
            type="number"
            placeholder="Precio (MXN)"
            value={draft.monto || ''}
            onChange={(e) => setDraft({...draft, monto: Number(e.target.value) || 0})}
            min="0"
            step="0.01"
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
            disabled={!draft.nombre || draft.monto <= 0}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: (!draft.nombre || draft.monto <= 0) 
                ? `${colors.light}33` 
                : `linear-gradient(135deg, ${colors.yellow}, ${colors.orange})`,
              color: colors.light,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: (!draft.nombre || draft.monto <= 0) ? 'not-allowed' : 'pointer',
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
