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

interface FAQItem {
  q: string;
  a: string;
}

interface FAQEditorProps {
  value: FAQItem[];
  onChange: (value: FAQItem[]) => void;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function FAQEditor({
  value = [],
  onChange,
  label = "Preguntas Frecuentes",
  style,
  className
}: FAQEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ q: '', a: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.q.trim() && newItem.a.trim()) {
      const newFAQ = [...value, { q: newItem.q.trim(), a: newItem.a.trim() }];
      onChange(newFAQ);
      setNewItem({ q: '', a: '' });
      setIsAdding(false);
    }
  };

  const updateItem = (index: number, field: 'q' | 'a', text: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: text };
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
          ➕ Agregar FAQ
        </motion.button>
      </div>

      {/* Lista de FAQs existentes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {value.map((item, index) => (
          <div key={index} style={{
            padding: '16px',
            background: `${colors.dark}66`,
            borderRadius: '12px',
            border: `1px solid ${colors.light}22`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                {editingIndex === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={item.q}
                      onChange={(e) => updateItem(index, 'q', e.target.value)}
                      placeholder="Pregunta"
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
                    <textarea
                      value={item.a}
                      onChange={(e) => updateItem(index, 'a', e.target.value)}
                      placeholder="Respuesta"
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
                          // Restaurar valores originales si se cancela
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
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                      marginBottom: '4px',
                    }}>
                      ❓ {item.q}
                    </h4>
                    <p style={{
                      fontSize: '0.9rem',
                      color: colors.light,
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}>
                      {item.a}
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

      {/* Formulario para agregar nuevo FAQ */}
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
            ➕ Nueva Pregunta Frecuente
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={newItem.q}
              onChange={(e) => setNewItem({ ...newItem, q: e.target.value })}
              placeholder="¿Cuál es tu pregunta?"
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
            <textarea
              value={newItem.a}
              onChange={(e) => setNewItem({ ...newItem, a: e.target.value })}
              placeholder="Escribe la respuesta aquí..."
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
                disabled={!newItem.q.trim() || !newItem.a.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: newItem.q.trim() && newItem.a.trim() 
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.light}33`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: newItem.q.trim() && newItem.a.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                ✅ Agregar FAQ
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({ q: '', a: '' });
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
          <p>No hay preguntas frecuentes aún</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Haz clic en "Agregar FAQ" para comenzar
          </p>
        </div>
      )}
    </div>
  );
}
