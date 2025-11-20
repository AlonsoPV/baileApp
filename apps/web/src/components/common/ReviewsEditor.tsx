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

export interface ReviewItem {
  author: string;
  location?: string;
  rating: number;
  text: string;
  id?: string | number;
}

interface ReviewsEditorProps {
  value: ReviewItem[];
  onChange: (value: ReviewItem[]) => void;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function ReviewsEditor({
  value = [],
  onChange,
  label = "Reseñas de Alumnos",
  style,
  className
}: ReviewsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<ReviewItem>({ author: '', location: '', rating: 5, text: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.author.trim() && newItem.text.trim()) {
      const newReview = [...value, { 
        ...newItem, 
        author: newItem.author.trim(), 
        text: newItem.text.trim(),
        location: newItem.location?.trim() || undefined
      }];
      onChange(newReview);
      setNewItem({ author: '', location: '', rating: 5, text: '' });
      setIsAdding(false);
    }
  };

  const updateItem = (index: number, field: keyof ReviewItem, val: string | number) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
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
          ➕ Agregar Reseña
        </motion.button>
      </div>

      {/* Lista de reseñas existentes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {value.map((item, index) => (
          <div key={item.id || index} style={{
            padding: '16px',
            background: `${colors.dark}66`,
            borderRadius: '12px',
            border: `1px solid ${colors.light}22`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                {editingIndex === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={item.author}
                        onChange={(e) => updateItem(index, 'author', e.target.value)}
                        placeholder="Nombre del alumno"
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
                        value={item.location || ''}
                        onChange={(e) => updateItem(index, 'location', e.target.value)}
                        placeholder="Ciudad / zona (opcional)"
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
                      <select
                        value={item.rating}
                        onChange={(e) => updateItem(index, 'rating', Number(e.target.value))}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: `${colors.dark}cc`,
                          border: `1px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: '0.9rem',
                        }}
                      >
                        {[5,4,3,2,1].map(stars => (
                          <option key={stars} value={stars}>{'★'.repeat(stars)}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={item.text}
                      onChange={(e) => updateItem(index, 'text', e.target.value)}
                      placeholder="Comentario del alumno"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: `${colors.dark}cc`,
                        border: `1px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '0.9rem',
                        resize: 'vertical',
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
                        onClick={() => {
                          setEditingIndex(null);
                        }}
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
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: colors.light,
                        margin: 0,
                      }}>
                        {item.author}
                      </h4>
                      {item.location && (
                        <span style={{
                          fontSize: '0.85rem',
                          color: colors.light,
                          opacity: 0.7,
                        }}>
                          • {item.location}
                        </span>
                      )}
                      <div style={{ marginLeft: 'auto', letterSpacing: '0.1rem' }}>
                        {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                      </div>
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: colors.light,
                      opacity: 0.8,
                      lineHeight: 1.4,
                      margin: 0,
                    }}>
                      "{item.text}"
                    </p>
                  </div>
                )}
              </div>
              {editingIndex !== index && (
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
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Formulario para agregar nueva reseña */}
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
            ➕ Nueva Reseña
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newItem.author}
                onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
                placeholder="Nombre del alumno"
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
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                placeholder="Ciudad / zona (opcional)"
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
              <select
                value={newItem.rating}
                onChange={(e) => setNewItem({ ...newItem, rating: Number(e.target.value) })}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
              >
                {[5,4,3,2,1].map(stars => (
                  <option key={stars} value={stars}>{'★'.repeat(stars)}</option>
                ))}
              </select>
            </div>
            <textarea
              value={newItem.text}
              onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
              placeholder="Escribe el comentario del alumno aquí..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                disabled={!newItem.author.trim() || !newItem.text.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newItem.author.trim() && newItem.text.trim() 
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.light}33`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: newItem.author.trim() && newItem.text.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                ✅ Agregar Reseña
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({ author: '', location: '', rating: 5, text: '' });
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
          <p>No hay reseñas aún</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Haz clic en "Agregar Reseña" para comenzar
          </p>
        </div>
      )}
    </div>
  );
}

