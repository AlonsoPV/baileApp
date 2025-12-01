import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent } from "../../hooks/useEvents";
import { useCreatePrice } from "../../hooks/useEventPrices";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../Toast";
import { Chip } from "../profile/Chip";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventCreateWizardProps {
  onSuccess?: (eventId: number) => void;
  onCancel?: () => void;
  showHeader?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

type WizardStep = 'basic' | 'pricing' | 'summary';

export default function EventCreateWizard({
  onSuccess,
  onCancel,
  showHeader = true,
  style,
  className
}: EventCreateWizardProps) {
  const navigate = useNavigate();
  const { data: organizer } = useMyOrganizer();
  const createEventMutation = useCreateParent();
  const createPriceMutation = useCreatePrice();
  const { ritmos } = useTags('ritmo');
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);

  // Basic Info State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sedeGeneral, setSedeGeneral] = useState('');
  const [estilosSeleccionados, setEstilosSeleccionados] = useState<number[]>([]);

  // Pricing State
  const [prices, setPrices] = useState<Array<{
    nombre: string;
    descripcion: string;
    precio: number;
    moneda: string;
    tipo: string;
    limite_cantidad?: number;
    activo: boolean;
  }>>([]);

  const [newPrice, setNewPrice] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    moneda: 'USD',
    tipo: 'general',
    limite_cantidad: undefined as number | undefined,
    activo: true
  });

  const handleBasicSubmit = async () => {
    if (!nombre.trim()) {
      showToast('El nombre del evento es obligatorio', 'error');
      return;
    }

    if (!(organizer as any)?.id) {
      showToast('No tienes organizador creado', 'error');
      return;
    }

    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        sede_general: sedeGeneral.trim() || null,
        estilos: estilosSeleccionados,
        organizer_id: (organizer as any).id,
      };

      const newEvent = await createEventMutation.mutateAsync(payload);
      setCreatedEventId(newEvent.id);
      setCurrentStep('pricing');
      showToast('Información básica guardada ✅', 'success');
    } catch (err: any) {
      showToast('Error al crear evento', 'error');
      console.error('Error creating event:', err);
    }
  };

  const handleAddPrice = () => {
    if (!newPrice.nombre.trim() || newPrice.precio <= 0) {
      showToast('Nombre y precio son obligatorios', 'error');
      return;
    }

    setPrices([...prices, { ...newPrice }]);
    setNewPrice({
      nombre: '',
      descripcion: '',
      precio: 0,
      moneda: 'USD',
      tipo: 'general',
      limite_cantidad: undefined,
      activo: true
    });
    showToast('Precio agregado ✅', 'success');
  };

  const handleRemovePrice = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (!createdEventId) {
      showToast('Error: No se pudo crear el evento', 'error');
      return;
    }

    try {
      // Crear todos los precios
      for (const price of prices) {
        await createPriceMutation.mutateAsync({
          event_id: createdEventId,
          ...price
        });
      }

      showToast('Evento creado completamente ✅', 'success');
      
      if (onSuccess) {
        onSuccess(createdEventId);
      } else {
        navigate('/profile/organizer/edit');
      }
    } catch (err: any) {
      showToast('Error al crear precios', 'error');
      console.error('Error creating prices:', err);
    }
  };

  const toggleEstilo = (estiloId: number) => {
    setEstilosSeleccionados(prev => 
      prev.includes(estiloId)
        ? prev.filter(id => id !== estiloId)
        : [...prev, estiloId]
    );
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/profile/organizer/edit');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic': return '📝 Información Básica';
      case 'pricing': return '💰 Precios y Promociones';
      case 'summary': return '📋 Resumen';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'basic': return 'Completa la información básica de tu evento';
      case 'pricing': return 'Configura los precios y promociones';
      case 'summary': return 'Revisa toda la información antes de crear';
      default: return '';
    }
  };

  if (!organizer) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        maxWidth: '600px',
        margin: '0 auto',
        ...style
      }} className={className}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          No tienes organizador
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Primero debes crear tu perfil de organizador
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile/organizer/edit')}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
          }}
        >
          🎤 Crear Organizador
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        padding: '24px',
        maxWidth: '900px',
        margin: '0 auto',
        color: colors.light,
        ...style
      }}
      className={className}
    >
      {/* Header */}
      {showHeader && (
        <div style={{ 
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 8px 0' }}>
            ➕ Nuevo Evento
          </h1>
          <p style={{ opacity: 0.7, margin: 0 }}>
            {getStepDescription()}
          </p>
        </div>
      )}

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px',
        gap: '16px'
      }}>
        {(['basic', 'pricing', 'summary'] as WizardStep[]).map((step, index) => (
          <div key={step} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: currentStep === step 
                ? colors.blue 
                : currentStep === 'basic' && step === 'basic'
                ? colors.blue
                : currentStep === 'pricing' && (step === 'basic' || step === 'pricing')
                ? colors.blue
                : currentStep === 'summary'
                ? colors.blue
                : `${colors.light}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.light,
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              {index + 1}
            </div>
            {index < 2 && (
              <div style={{
                width: '20px',
                height: '2px',
                background: currentStep === 'pricing' && step === 'basic'
                  ? colors.blue
                  : currentStep === 'summary'
                  ? colors.blue
                  : `${colors.light}33`
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'basic' && (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej: Festival de Salsa 2025"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Descripción
              </label>
              <textarea
                value={descripcion || ''}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                placeholder="Describe tu evento..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Sede General
              </label>
              <input
                type="text"
                value={sedeGeneral}
                onChange={(e) => setSedeGeneral(e.target.value)}
                placeholder="Ej: Centro de Convenciones"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                Estilos de Baile
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {ritmos?.map((ritmo) => (
                  <motion.button
                    key={ritmo.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleEstilo(ritmo.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: estilosSeleccionados.includes(ritmo.id)
                        ? `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`
                        : `${colors.dark}cc`,
                      border: `2px solid ${estilosSeleccionados.includes(ritmo.id) ? colors.coral : `${colors.light}33`}`,
                      color: colors.light,
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    🎵 {ritmo.nombre}
                  </motion.button>
                ))}
              </div>
              <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '8px' }}>
                Seleccionados: {estilosSeleccionados.length}
              </p>
            </div>
          </motion.div>
        )}

        {currentStep === 'pricing' && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>
                💰 Precios y Promociones
              </h3>
              <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                Configura los diferentes tipos de precios para tu evento
              </p>
            </div>

            {/* Add Price Form */}
            <div style={{
              padding: '20px',
              background: `${colors.dark}33`,
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                ➕ Agregar Nuevo Precio
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newPrice.nombre}
                    onChange={(e) => setNewPrice({...newPrice, nombre: e.target.value})}
                    placeholder="Ej: Entrada General"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: `${colors.dark}cc`,
                      border: `1px solid ${colors.light}33`,
                      color: colors.light,
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={newPrice.precio}
                    onChange={(e) => setNewPrice({...newPrice, precio: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: `${colors.dark}cc`,
                      border: `1px solid ${colors.light}33`,
                      color: colors.light,
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                    Moneda
                  </label>
                  <select
                    value={newPrice.moneda}
                    onChange={(e) => setNewPrice({...newPrice, moneda: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: `${colors.dark}cc`,
                      border: `1px solid ${colors.light}33`,
                      color: colors.light,
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                    Tipo
                  </label>
                  <select
                    value={newPrice.tipo}
                    onChange={(e) => setNewPrice({...newPrice, tipo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: `${colors.dark}cc`,
                      border: `1px solid ${colors.light}33`,
                      color: colors.light,
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="general">🎫 General</option>
                    <option value="estudiante">🎓 Estudiante</option>
                    <option value="grupo">👥 Grupo</option>
                    <option value="early_bird">🐦 Early Bird</option>
                    <option value="last_minute">⏰ Last Minute</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                  Descripción
                </label>
                <textarea
                  value={newPrice.descripcion || ''}
                  onChange={(e) => setNewPrice({...newPrice, descripcion: e.target.value})}
                  placeholder="Descripción del precio..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: `${colors.dark}cc`,
                    border: `1px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddPrice}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: colors.blue,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ➕ Agregar Precio
              </motion.button>
            </div>

            {/* Prices List */}
            {prices.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                  📋 Precios Configurados
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {prices.map((price, index) => (
                    <div key={index} style={{
                      padding: '16px',
                      background: `${colors.dark}33`,
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {price.nombre}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: price.moneda
                          }).format(price.precio)} • {price.tipo}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemovePrice(index)}
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
                        🗑️ Eliminar
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentStep === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>
                📋 Resumen del Evento
              </h3>
              <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                Revisa toda la información antes de crear el evento
              </p>
            </div>

            {/* Event Info Summary */}
            <div style={{
              padding: '20px',
              background: `${colors.dark}33`,
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>
                📝 Información Básica
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Nombre:</strong> {nombre}</div>
                {descripcion && <div><strong>Descripción:</strong> {descripcion}</div>}
                {sedeGeneral && <div><strong>Sede:</strong> {sedeGeneral}</div>}
                {estilosSeleccionados.length > 0 && (
                  <div>
                    <strong>Estilos:</strong> {estilosSeleccionados.map(id => 
                      ritmos?.find(r => r.id === id)?.nombre
                    ).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Prices Summary */}
            {prices.length > 0 && (
              <div style={{
                padding: '20px',
                background: `${colors.dark}33`,
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>
                  💰 Precios Configurados
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prices.map((price, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{price.nombre}</div>
                        {price.descripcion && (
                          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            {price.descripcion}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: price.moneda
                          }).format(price.precio)}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                          {price.tipo}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '32px' }}>
        {currentStep === 'basic' && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBasicSubmit}
              disabled={createEventMutation.isPending}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '16px',
                borderRadius: '50px',
                border: 'none',
                background: createEventMutation.isPending
                  ? `${colors.light}33` 
                  : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: createEventMutation.isPending ? 'not-allowed' : 'pointer',
                boxShadow: `0 8px 24px ${colors.blue}66`,
              }}
            >
              {createEventMutation.isPending 
                ? '⏳ Creando...' 
                : '➡️ Continuar a Precios'
              }
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              style={{
                padding: '16px 24px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Cancelar
            </motion.button>
          </>
        )}

        {currentStep === 'pricing' && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentStep('summary')}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '16px',
                borderRadius: '50px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 8px 24px ${colors.blue}66`,
              }}
            >
              ➡️ Ver Resumen
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentStep('basic')}
              style={{
                padding: '16px 24px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Información Básica
            </motion.button>
          </>
        )}

        {currentStep === 'summary' && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinalSubmit}
              disabled={createPriceMutation.isPending}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '16px',
                borderRadius: '50px',
                border: 'none',
                background: createPriceMutation.isPending
                  ? `${colors.light}33` 
                  : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: createPriceMutation.isPending ? 'not-allowed' : 'pointer',
                boxShadow: `0 8px 24px ${colors.blue}66`,
              }}
            >
              {createPriceMutation.isPending 
                ? '⏳ Creando...' 
                : '✨ Crear Evento Completo'
              }
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentStep('pricing')}
              style={{
                padding: '16px 24px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Precios
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
