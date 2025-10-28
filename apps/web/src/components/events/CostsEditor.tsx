import React, { useState } from "react";
import { motion } from "framer-motion";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type CostType = 'paquetes' | 'clases sueltas' | 'coreografia' | 'entrenamiento' | 'otro';

interface CostItem {
  tipo: CostType;
  nombre: string;           // clave de referencia para enlazar desde clases
  precio?: number | null;   // null/undefined => Gratis
  regla?: string;
}

interface CostsEditorProps {
  value: CostItem[];
  onChange: (value: CostItem[]) => void;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function CostsEditor({
  value = [],
  onChange,
  label = "Costos y Promociones",
  style,
  className
}: CostsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<CostItem>({
    tipo: 'paquetes',
    nombre: '',
    precio: null,
    regla: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.nombre.trim()) {
      const next = [...value, { ...newItem, nombre: newItem.nombre.trim() }];
      onChange(next);
      setNewItem({ tipo: 'paquetes', nombre: '', precio: null, regla: '' });
      setIsAdding(false);
    }
  };

  // ⚠️ Fix: evitar sombrear prop `value`
  const updateItem = (index: number, field: keyof CostItem, val: string | number | null | undefined) => {
    const updated = [...value];
    // normalización de precio
    if (field === 'precio') {
      const num = val === '' || val === undefined ? null : Number(val);
      (updated[index] as any)[field] = Number.isFinite(num as number) ? num : null;
    } else {
      (updated[index] as any)[field] = val;
    }
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => setEditingIndex(index);
  const finishEdit = () => setEditingIndex(null);

  const getTipoIcon = (tipo: CostType) => {
    switch (tipo) {
      case 'paquetes': return '🧾';
      case 'clases sueltas': return '🎫';
      case 'coreografia': return '🎬';
      case 'entrenamiento': return '🏋️';
      case 'otro': return '💡';
    }
  };

  const getTipoColor = (tipo: CostType) => {
    switch (tipo) {
      case 'paquetes': return colors.yellow;
      case 'clases sueltas': return colors.blue;
      case 'coreografia': return colors.orange;
      case 'entrenamiento': return colors.coral;
      case 'otro': return colors.light;
    }
  };

  const formatPrice = (precio?: number | null) => {
    if (precio === undefined || precio === null) return 'Gratis';
    return `$${precio.toLocaleString()}`;
  };

  return (
    <div style={{ ...style }} className={className}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <label style={{ fontSize:'1.1rem', fontWeight:600, color:colors.light }}>{label}</label>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          style={{
            padding:'8px 16px', borderRadius:20, border:'none',
            background:`linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color:colors.light, fontSize:'0.9rem', fontWeight:600, cursor:'pointer'
          }}
        >
          ➕ Agregar Costo
        </motion.button>
      </div>

      {/* Lista */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
        {value.map((item, index) => (
          <div key={index} style={{
            padding:16, background:`${colors.dark}66`, borderRadius:12, border:`1px solid ${colors.light}22`
          }}>
            {editingIndex === index ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:'0.9rem', color:colors.light }}>
                      Tipo
                    </label>
                    <select
                      value={item.tipo}
                      onChange={(e) => updateItem(index, 'tipo', e.target.value as CostType)}
                      style={{
                        width:'100%', padding:'8px 12px', borderRadius:8,
                        background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                        color:colors.light, fontSize:'0.9rem'
                      }}
                    >
                      <option value="paquetes">🧾 Paquetes</option>
                      <option value="clases sueltas">🎫 Clases sueltas</option>
                      <option value="coreografia">🎬 Coreografía</option>
                      <option value="entrenamiento">🏋️ Entrenamiento</option>
                      <option value="otro">💡 Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:'0.9rem', color:colors.light }}>
                      Precio (opcional)
                    </label>
                    <input
                      type="number" min="0" step="1"
                      value={item.precio ?? ''}
                      onChange={(e) => updateItem(index, 'precio', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="Dejar vacío para Gratis"
                      style={{
                        width:'100%', padding:'8px 12px', borderRadius:8,
                        background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                        color:colors.light, fontSize:'0.9rem'
                      }}
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={item.nombre}
                  onChange={(e) => updateItem(index, 'nombre', e.target.value)}
                  placeholder="Nombre del costo/promoción (p. ej. Paquete 4 clases)"
                  style={{
                    width:'100%', padding:'8px 12px', borderRadius:8,
                    background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                    color:colors.light, fontSize:'0.9rem'
                  }}
                />

                <input
                  type="text"
                  value={item.regla || ''}
                  onChange={(e) => updateItem(index, 'regla', e.target.value)}
                  placeholder="Regla o condición (opcional)"
                  style={{
                    width:'100%', padding:'8px 12px', borderRadius:8,
                    background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                    color:colors.light, fontSize:'0.9rem'
                  }}
                />

                <div style={{ display:'flex', gap:8 }}>
                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={finishEdit}
                    style={{
                      padding:'6px 12px', borderRadius:6, border:'none',
                      background:colors.blue, color:colors.light, fontSize:'0.8rem', cursor:'pointer'
                    }}
                  >
                    ✅ Guardar
                  </motion.button>
                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={() => setEditingIndex(null)}
                    style={{
                      padding:'6px 12px', borderRadius:6, border:'none',
                      background:colors.coral, color:colors.light, fontSize:'0.8rem', cursor:'pointer'
                    }}
                  >
                    ❌ Cancelar
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:'1.2rem' }}>{getTipoIcon(item.tipo)}</span>
                    <span style={{
                      padding:'4px 8px', borderRadius:12,
                      background:`${getTipoColor(item.tipo)}33`, color:getTipoColor(item.tipo),
                      fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize'
                    }}>
                      {item.tipo}
                    </span>
                    <span style={{
                      padding:'4px 8px', borderRadius:12,
                      background:`${colors.light}33`, color:colors.light,
                      fontSize:'0.8rem', fontWeight:600
                    }}>
                      {formatPrice(item.precio)}
                    </span>
                  </div>
                  <h4 style={{ fontSize:'1rem', fontWeight:600, color:colors.light, marginBottom:4 }}>
                    {item.nombre}
                  </h4>
                  {item.regla && (
                    <p style={{ fontSize:'0.9rem', color:colors.light, opacity:0.8 }}>
                      📋 {item.regla}
                    </p>
                  )}
                </div>
                <div style={{ display:'flex', gap:4, marginLeft:12 }}>
                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={() => startEdit(index)}
                    style={{
                      padding:6, borderRadius:6, border:'none',
                      background:colors.blue, color:colors.light, fontSize:'0.8rem', cursor:'pointer'
                    }}
                  >
                    ✏️
                  </motion.button>
                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={() => removeItem(index)}
                    style={{
                      padding:6, borderRadius:6, border:'none',
                      background:colors.coral, color:colors.light, fontSize:'0.8rem', cursor:'pointer'
                    }}
                  >
                    🗑️
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alta */}
      {isAdding && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ padding:16, background:`${colors.dark}66`, borderRadius:12, border:`1px solid ${colors.blue}33` }}
        >
          <h4 style={{ fontSize:'1rem', fontWeight:600, color:colors.light, marginBottom:12 }}>
            ➕ Nuevo Costo/Promoción
          </h4>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', marginBottom:4, fontSize:'0.9rem', color:colors.light }}>Tipo</label>
                <select
                  value={newItem.tipo}
                  onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value as CostType })}
                  style={{
                    width:'100%', padding:'8px 12px', borderRadius:8,
                    background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                    color:colors.light, fontSize:'0.9rem'
                  }}
                >
                  <option value="paquetes">🧾 Paquetes</option>
                  <option value="clases sueltas">🎫 Clases sueltas</option>
                  <option value="coreografia">🎬 Coreografía</option>
                  <option value="entrenamiento">🏋️ Entrenamiento</option>
                  <option value="otro">💡 Otro</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:4, fontSize:'0.9rem', color:colors.light }}>Precio (opcional)</label>
                <input
                  type="number" min="0" step="1"
                  value={newItem.precio ?? ''}
                  onChange={(e) => setNewItem({ ...newItem, precio: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Dejar vacío para Gratis"
                  style={{
                    width:'100%', padding:'8px 12px', borderRadius:8,
                    background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                    color:colors.light, fontSize:'0.9rem'
                  }}
                />
              </div>
            </div>

            <input
              type="text"
              value={newItem.nombre}
              onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
              placeholder="Nombre del costo/promoción"
              style={{
                width:'100%', padding:'12px', borderRadius:8,
                background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                color:colors.light, fontSize:'1rem'
              }}
            />

            <input
              type="text"
              value={newItem.regla || ''}
              onChange={(e) => setNewItem({ ...newItem, regla: e.target.value })}
              placeholder="Regla o condición (opcional)"
              style={{
                width:'100%', padding:'12px', borderRadius:8,
                background:`${colors.dark}cc`, border:`1px solid ${colors.light}33`,
                color:colors.light, fontSize:'1rem'
              }}
            />

            <div style={{ display:'flex', gap:8 }}>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={addItem}
                disabled={!newItem.nombre.trim()}
                style={{
                  padding:'10px 20px', borderRadius:8, border:'none',
                  background: newItem.nombre.trim()
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.light}33`,
                  color:colors.light, fontSize:'0.9rem', fontWeight:600,
                  cursor: newItem.nombre.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                ✅ Agregar Costo
              </motion.button>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({ tipo:'paquetes', nombre:'', precio: null, regla:'' });
                }}
                style={{
                  padding:'10px 20px', borderRadius:8, border:`1px solid ${colors.light}33`,
                  background:'transparent', color:colors.light, fontSize:'0.9rem', fontWeight:600, cursor:'pointer'
                }}
              >
                ❌ Cancelar
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {value.length === 0 && !isAdding && (
        <div style={{ textAlign:'center', padding:24, background:`${colors.dark}33`, borderRadius:12, color:colors.light, opacity:0.6 }}>
          <p>No hay costos definidos aún</p>
          <p style={{ fontSize:'0.9rem', marginTop:4 }}>Haz clic en "Agregar Costo" para comenzar</p>
        </div>
      )}
    </div>
  );
}
