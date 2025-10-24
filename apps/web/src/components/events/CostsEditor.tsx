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

interface CostItem {
  tipo: 'preventa' | 'taquilla' | 'promo';
  nombre: string;
  precio?: number;
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
    tipo: 'preventa',
    nombre: '',
    precio: undefined,
    regla: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.nombre.trim()) {
      const newCost = [...value, { ...newItem, nombre: newItem.nombre.trim() }];
      onChange(newCost);
      setNewItem({
        tipo: 'preventa',
        nombre: '',
        precio: undefined,
        regla: ''
      });
      setIsAdding(false);
    }
  };

  const updateItem = (index: number, field: keyof CostItem, value: string | number) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
  };

  const finishEdit = () => {
    setEditingIndex(null);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'preventa': return '🎫';
      case 'taquilla': return '💰';
      case 'promo': return '🎁';
      default: return '💰';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'preventa': return colors.blue;
      case 'taquilla': return colors.coral;
      case 'promo': return colors.orange;
      default: return colors.light;
    }
  };

  const formatPrice = (precio?: number) => {
    if (precio === undefined || precio === null) return 'Gratis';
    return `$${precio.toLocaleString()}`;
  };

  return (
    <div style={{ ...style }} className={className}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <label style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: colors.light,
        }}>
          {label}
        </label>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ➕ Agregar Costo
        </motion.button>
      </div>

      {/* Lista de costos existentes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {value.map((item, index) => (
          <div key={index} style={{
            padding: '16px',
            background: `${colors.dark}66`,
            borderRadius: '12px',
            border: `1px solid ${colors.light}22`,
          }}>
            {editingIndex === index ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                      Tipo
                    </label>
                    <select
                      value={item.tipo}
                      onChange={(e) => updateItem(index, 'tipo', e.target.value as CostItem['tipo'])}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: `${colors.dark}cc`,
                        border: `1px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '0.9rem',
                      }}
                    >
                      <option value="preventa">🎫 Preventa</option>
                      <option value="taquilla">💰 Taquilla</option>
                      <option value="promo">🎁 Promoción</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                      Precio (opcional)
                    </label>
                    <input
                      type="number"
                      value={item.precio || ''}
                      onChange={(e) => updateItem(index, 'precio', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0 para gratis"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: `${colors.dark}cc`,
                        border: `1px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={item.nombre}
                  onChange={(e) => updateItem(index, 'nombre', e.target.value)}
                  placeholder="Nombre del costo/promoción"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: `${colors.dark}cc`,
                    border: `1px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '0.9rem',
                  }}
                />
                <input
                  type="text"
                  value={item.regla || ''}
                  onChange={(e) => updateItem(index, 'regla', e.target.value)}
                  placeholder="Regla o condición (opcional)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: `${colors.dark}cc`,
                    border: `1px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '0.9rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={finishEdit}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: colors.blue,
                      color: colors.light,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✅ Guardar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingIndex(null)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: colors.coral,
                      color: colors.light,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ❌ Cancelar
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getTipoIcon(item.tipo)}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: `${getTipoColor(item.tipo)}33`,
                      color: getTipoColor(item.tipo),
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}>
                      {item.tipo}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: `${colors.light}33`,
                      color: colors.light,
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}>
                      {formatPrice(item.precio)}
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.light,
                    marginBottom: '4px',
                  }}>
                    {item.nombre}
                  </h4>
                  {item.regla && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: colors.light,
                      opacity: 0.8,
                    }}>
                      📋 {item.regla}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(index)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      background: colors.blue,
                      color: colors.light,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeItem(index)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      background: colors.coral,
                      color: colors.light,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
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

      {/* Formulario para agregar nuevo costo */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            background: `${colors.dark}66`,
            borderRadius: '12px',
            border: `1px solid ${colors.blue}33`,
          }}
        >
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: colors.light,
            marginBottom: '12px',
          }}>
            ➕ Nuevo Costo/Promoción
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                  Tipo
                </label>
                <select
                  value={newItem.tipo}
                  onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value as CostItem['tipo'] })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: `${colors.dark}cc`,
                    border: `1px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="preventa">🎫 Preventa</option>
                  <option value="taquilla">💰 Taquilla</option>
                  <option value="promo">🎁 Promoción</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                  Precio (opcional)
                </label>
                <input
                  type="number"
                  value={newItem.precio || ''}
                  onChange={(e) => setNewItem({ ...newItem, precio: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0 para gratis"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: `${colors.dark}cc`,
                    border: `1px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '0.9rem',
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
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
            <input
              type="text"
              value={newItem.regla}
              onChange={(e) => setNewItem({ ...newItem, regla: e.target.value })}
              placeholder="Regla o condición (opcional)"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                disabled={!newItem.nombre.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newItem.nombre.trim()
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.light}33`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: newItem.nombre.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                ✅ Agregar Costo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({
                    tipo: 'preventa',
                    nombre: '',
                    precio: undefined,
                    regla: ''
                  });
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.light}33`,
                  background: 'transparent',
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ❌ Cancelar
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {value.length === 0 && !isAdding && (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          background: `${colors.dark}33`,
          borderRadius: '12px',
          color: colors.light,
          opacity: 0.6,
        }}>
          <p>No hay costos definidos aún</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Haz clic en "Agregar Costo" para comenzar
          </p>
        </div>
      )}
    </div>
  );
}
