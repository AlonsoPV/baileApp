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

interface ScheduleItem {
  tipo: 'clase' | 'show' | 'otro';
  titulo: string;
  inicio: string; // HH:mm
  fin: string; // HH:mm
  nivel?: string;
}

interface ScheduleEditorProps {
  value: ScheduleItem[];
  onChange: (value: ScheduleItem[]) => void;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function ScheduleEditor({
  value = [],
  onChange,
  label = "Cronograma",
  style,
  className
}: ScheduleEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<ScheduleItem>({
    tipo: 'clase',
    titulo: '',
    inicio: '',
    fin: '',
    nivel: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.titulo.trim() && newItem.inicio && newItem.fin) {
      const newSchedule = [...value, { ...newItem, titulo: newItem.titulo.trim() }];
      onChange(newSchedule);
      setNewItem({
        tipo: 'clase',
        titulo: '',
        inicio: '',
        fin: '',
        nivel: ''
      });
      setIsAdding(false);
    }
  };

  const updateItem = (index: number, field: keyof ScheduleItem, value: string) => {
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
      case 'clase': return '📚';
      case 'show': return '🎭';
      case 'otro': return '📋';
      default: return '📋';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'clase': return colors.blue;
      case 'show': return colors.coral;
      case 'otro': return colors.orange;
      default: return colors.light;
    }
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
          ➕ Agregar Actividad
        </motion.button>
      </div>

      {/* Lista de actividades existentes */}
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
                      onChange={(e) => updateItem(index, 'tipo', e.target.value as ScheduleItem['tipo'])}
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
                      <option value="clase">📚 Clase</option>
                      <option value="show">🎭 Show</option>
                      <option value="otro">📋 Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                      Nivel (opcional)
                    </label>
                    <input
                      type="text"
                      value={item.nivel || ''}
                      onChange={(e) => updateItem(index, 'nivel', e.target.value)}
                      placeholder="Ej: Principiante, Intermedio"
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
                  value={item.titulo}
                  onChange={(e) => updateItem(index, 'titulo', e.target.value)}
                  placeholder="Título de la actividad"
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                      Inicio
                    </label>
                    <input
                      type="time"
                      value={item.inicio}
                      onChange={(e) => updateItem(index, 'inicio', e.target.value)}
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
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                      Fin
                    </label>
                    <input
                      type="time"
                      value={item.fin}
                      onChange={(e) => updateItem(index, 'fin', e.target.value)}
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
                    {item.nivel && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: `${colors.light}33`,
                        color: colors.light,
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}>
                        {item.nivel}
                      </span>
                    )}
                  </div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.light,
                    marginBottom: '4px',
                  }}>
                    {item.titulo}
                  </h4>
                  <p style={{
                    fontSize: '0.9rem',
                    color: colors.light,
                    opacity: 0.8,
                  }}>
                    🕐 {item.inicio} - {item.fin}
                  </p>
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

      {/* Formulario para agregar nueva actividad */}
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
            ➕ Nueva Actividad
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                  Tipo
                </label>
                <select
                  value={newItem.tipo}
                  onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value as ScheduleItem['tipo'] })}
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
                  <option value="clase">📚 Clase</option>
                  <option value="show">🎭 Show</option>
                  <option value="otro">📋 Otro</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                  Nivel (opcional)
                </label>
                <input
                  type="text"
                  value={newItem.nivel}
                  onChange={(e) => setNewItem({ ...newItem, nivel: e.target.value })}
                  placeholder="Ej: Principiante, Intermedio"
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
              value={newItem.titulo}
              onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
              placeholder="Título de la actividad"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                  Inicio
                </label>
                <input
                  type="time"
                  value={newItem.inicio}
                  onChange={(e) => setNewItem({ ...newItem, inicio: e.target.value })}
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
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: colors.light }}>
                  Fin
                </label>
                <input
                  type="time"
                  value={newItem.fin}
                  onChange={(e) => setNewItem({ ...newItem, fin: e.target.value })}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                disabled={!newItem.titulo.trim() || !newItem.inicio || !newItem.fin}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newItem.titulo.trim() && newItem.inicio && newItem.fin
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.light}33`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: newItem.titulo.trim() && newItem.inicio && newItem.fin ? 'pointer' : 'not-allowed',
                }}
              >
                ✅ Agregar Actividad
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({
                    tipo: 'clase',
                    titulo: '',
                    inicio: '',
                    fin: '',
                    nivel: ''
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
          <p>No hay actividades programadas aún</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Haz clic en "Agregar Actividad" para comenzar
          </p>
        </div>
      )}
    </div>
  );
}
