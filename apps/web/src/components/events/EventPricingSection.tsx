import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEventPrices, useCreatePrice, useUpdatePrice, useDeletePrice } from "../../hooks/useEventPrices";
import { useToast } from "../Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventPricingSectionProps {
  eventId: number;
  eventName: string;
}

interface PriceItem {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  moneda: string;
  tipo: 'general' | 'estudiante' | 'grupo' | 'early_bird' | 'last_minute';
  limite_cantidad?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
}

const PRICE_TYPES = [
  { id: 'general', name: 'General', icon: '🎫', description: 'Precio estándar' },
  { id: 'estudiante', name: 'Estudiante', icon: '🎓', description: 'Descuento para estudiantes' },
  { id: 'grupo', name: 'Grupo', icon: '👥', description: 'Descuento por grupo' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'Precio anticipado' },
  { id: 'last_minute', name: 'Last Minute', icon: '⏰', description: 'Precio de última hora' }
];

export default function EventPricingSection({ eventId, eventName }: EventPricingSectionProps) {
  const navigate = useNavigate();
  const { data: prices, isLoading } = useEventPrices(eventId);
  const createMutation = useCreatePrice();
  const updateMutation = useUpdatePrice();
  const deleteMutation = useDeletePrice();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [formData, setFormData] = useState<PriceItem>({
    nombre: '',
    descripcion: '',
    precio: 0,
    moneda: 'USD',
    tipo: 'general',
    limite_cantidad: undefined,
    fecha_inicio: '',
    fecha_fin: '',
    activo: true
  });

  const handleCreatePrice = () => {
    setIsCreating(true);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: 0,
      moneda: 'USD',
      tipo: 'general',
      limite_cantidad: undefined,
      fecha_inicio: '',
      fecha_fin: '',
      activo: true
    });
  };

  const handleEditPrice = (price: any) => {
    setEditingPrice(price.id);
    setFormData({
      id: price.id,
      nombre: price.nombre,
      descripcion: price.descripcion,
      precio: price.precio,
      moneda: price.moneda,
      tipo: price.tipo,
      limite_cantidad: price.limite_cantidad,
      fecha_inicio: price.fecha_inicio || '',
      fecha_fin: price.fecha_fin || '',
      activo: price.activo
    });
  };

  const handleSavePrice = async () => {
    try {
      if (!formData.nombre.trim() || formData.precio <= 0) {
        showToast('Nombre y precio son obligatorios', 'error');
        return;
      }

      const payload = {
        ...formData,
        event_id: eventId
      };

      if (editingPrice) {
        await updateMutation.mutateAsync({ id: editingPrice, patch: payload });
        showToast('Precio actualizado ✅', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Precio creado ✅', 'success');
      }

      setIsCreating(false);
      setEditingPrice(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 0,
        moneda: 'USD',
        tipo: 'general',
        limite_cantidad: undefined,
        fecha_inicio: '',
        fecha_fin: '',
        activo: true
      });
    } catch (error) {
      showToast('Error al guardar precio', 'error');
    }
  };

  const handleDeletePrice = async (priceId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este precio?')) {
      try {
        await deleteMutation.mutateAsync(priceId);
        showToast('Precio eliminado ✅', 'success');
      } catch (error) {
        showToast('Error al eliminar precio', 'error');
      }
    }
  };

  const getPriceTypeInfo = (tipo: string) => {
    return PRICE_TYPES.find(t => t.id === tipo) || PRICE_TYPES[0];
  };

  const formatPrice = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda
    }).format(precio);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: colors.light
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Cargando precios...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        marginBottom: '2rem',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: colors.light,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          💰 Costos y Promociones
        </h3>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreatePrice}
          style={{
            padding: '0.75rem 1.5rem',
            background: colors.blue,
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)'
          }}
        >
          ➕ Nuevo Precio
        </motion.button>
      </div>

      {/* Formulario de creación/edición */}
      <AnimatePresence>
        {(isCreating || editingPrice) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: colors.light,
              margin: '0 0 1rem 0'
            }}>
              {editingPrice ? '✏️ Editar Precio' : '➕ Nuevo Precio'}
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Nombre del Precio *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Entrada General"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Tipo de Precio
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                >
                  {PRICE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Precio *
                </label>
                <input
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Moneda
                </label>
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="COP">COP - Peso Colombiano</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Límite de Cantidad
                </label>
                <input
                  type="number"
                  value={formData.limite_cantidad || ''}
                  onChange={(e) => setFormData({...formData, limite_cantidad: parseInt(e.target.value) || undefined})}
                  placeholder="Sin límite"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Fecha de Inicio
                </label>
                <input
                  type="datetime-local"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  Fecha de Fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: colors.light
              }}>
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Descripción del precio, incluye, condiciones especiales..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                color: colors.light,
                fontSize: '0.9rem'
              }}>
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  style={{ margin: 0 }}
                />
                Precio activo
              </label>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCreating(false);
                  setEditingPrice(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePrice}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: colors.blue,
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: (createMutation.isPending || updateMutation.isPending) ? 'not-allowed' : 'pointer',
                  opacity: (createMutation.isPending || updateMutation.isPending) ? 0.6 : 1
                }}
              >
                {createMutation.isPending || updateMutation.isPending ? '⏳ Guardando...' : '💾 Guardar'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de precios */}
      {prices && prices.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {prices.map((price, index) => {
            const typeInfo = getPriceTypeInfo(price.tipo);
            return (
              <motion.div
                key={price.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: colors.light,
                      margin: '0 0 0.5rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {typeInfo.icon} {price.nombre}
                    </h4>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: colors.blue,
                      marginBottom: '0.5rem'
                    }}>
                      {formatPrice(price.precio, price.moneda)}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditPrice(price)}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(30, 136, 229, 0.2)',
                        border: '1px solid rgba(30, 136, 229, 0.3)',
                        borderRadius: '8px',
                        color: colors.blue,
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✏️
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeletePrice(price.id)}
                      disabled={deleteMutation.isPending}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255, 61, 87, 0.2)',
                        border: '1px solid rgba(255, 61, 87, 0.3)',
                        borderRadius: '8px',
                        color: colors.coral,
                        cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        opacity: deleteMutation.isPending ? 0.5 : 1
                      }}
                    >
                      🗑️
                    </motion.button>
                  </div>
                </div>

                {price.descripcion && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    margin: '0 0 1rem 0',
                    lineHeight: 1.4
                  }}>
                    {price.descripcion}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {price.limite_cantidad && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem'
                    }}>
                      <span>👥</span>
                      <span>Límite: {price.limite_cantidad} personas</span>
                    </div>
                  )}

                  {price.fecha_inicio && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem'
                    }}>
                      <span>📅</span>
                      <span>Desde: {new Date(price.fecha_inicio).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}

                  {price.fecha_fin && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem'
                    }}>
                      <span>📅</span>
                      <span>Hasta: {new Date(price.fecha_fin).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: price.activo 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(156, 163, 175, 0.2)',
                      color: price.activo 
                        ? '#10b981' 
                        : '#9ca3af',
                      border: `1px solid ${price.activo 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : 'rgba(156, 163, 175, 0.3)'}`
                    }}>
                      {price.activo ? '✅ Activo' : '⏸️ Inactivo'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
          <h4 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            margin: '0 0 0.5rem 0',
            color: colors.light
          }}>
            No hay precios configurados
          </h4>
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.9rem'
          }}>
            Agrega precios y promociones para tu evento
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreatePrice}
            style={{
              padding: '0.75rem 1.5rem',
              background: colors.blue,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)'
            }}
          >
            ➕ Crear Primer Precio
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
