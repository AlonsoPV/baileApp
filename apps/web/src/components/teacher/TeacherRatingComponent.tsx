import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';
import {
  useTeacherRatingStats,
  useMyTeacherRating,
  useUpsertTeacherRating,
  type TeacherRatingValue,
  getTeacherRatingDisplay,
  calculateTeacherAverage,
} from '../../hooks/useTeacherRatings';
import { useToast } from '../Toast';

interface TeacherRatingComponentProps {
  teacherId: number;
}

const RATING_OPTIONS: TeacherRatingValue[] = ['excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase'];

const QUESTIONS = [
  {
    id: 'overall' as const,
    label: '¿Cómo calificarías a este maestro?',
    key: 'overall_rating' as const,
  },
  {
    id: 'claridad' as const,
    label: 'Claridad al explicar pasos y técnica',
    key: 'claridad' as const,
  },
  {
    id: 'dominio_tecnico' as const,
    label: 'Dominio del estilo y calidad técnica',
    key: 'dominio_tecnico' as const,
  },
  {
    id: 'puntualidad' as const,
    label: 'Puntualidad de inicio y fin de clases',
    key: 'puntualidad' as const,
  },
  {
    id: 'actitud_energia' as const,
    label: 'Actitud y energía transmitida',
    key: 'actitud_energia' as const,
  },
  {
    id: 'ambiente_seguro' as const,
    label: 'Ambiente seguro y respetuoso durante la clase',
    key: 'ambiente_seguro' as const,
  },
];

export default function TeacherRatingComponent({ teacherId }: TeacherRatingComponentProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: stats, isLoading: statsLoading } = useTeacherRatingStats(teacherId);
  const { data: myRating, isLoading: myRatingLoading } = useMyTeacherRating(teacherId);
  const upsertRating = useUpsertTeacherRating();

  const [isOpen, setIsOpen] = useState(false);
  const [showAdditionalQuestions, setShowAdditionalQuestions] = useState(false);
  const [formData, setFormData] = useState<{
    overall_rating: TeacherRatingValue | null;
    claridad: TeacherRatingValue | null;
    dominio_tecnico: TeacherRatingValue | null;
    puntualidad: TeacherRatingValue | null;
    actitud_energia: TeacherRatingValue | null;
    ambiente_seguro: TeacherRatingValue | null;
  }>({
    overall_rating: null,
    claridad: null,
    dominio_tecnico: null,
    puntualidad: null,
    actitud_energia: null,
    ambiente_seguro: null,
  });

  // Cargar datos del usuario si ya calificó
  React.useEffect(() => {
    if (myRating) {
      setFormData({
        overall_rating: myRating.overall_rating,
        claridad: myRating.claridad || null,
        dominio_tecnico: myRating.dominio_tecnico || null,
        puntualidad: myRating.puntualidad || null,
        actitud_energia: myRating.actitud_energia || null,
        ambiente_seguro: myRating.ambiente_seguro || null,
      });
      // Si ya tiene calificaciones adicionales, mostrar el panel expandido
      if (myRating.claridad || myRating.dominio_tecnico || myRating.puntualidad || myRating.actitud_energia || myRating.ambiente_seguro) {
        setShowAdditionalQuestions(true);
      }
    }
  }, [myRating]);

  const handleRatingChange = (key: string, value: TeacherRatingValue) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para calificar', 'error');
      return;
    }

    if (!formData.overall_rating) {
      showToast('Por favor califica la pregunta principal', 'error');
      return;
    }

    try {
      await upsertRating.mutateAsync({
        teacher_id: teacherId,
        overall_rating: formData.overall_rating,
        claridad: formData.claridad || null,
        dominio_tecnico: formData.dominio_tecnico || null,
        puntualidad: formData.puntualidad || null,
        actitud_energia: formData.actitud_energia || null,
        ambiente_seguro: formData.ambiente_seguro || null,
      });

      showToast('¡Calificación guardada exitosamente!', 'success');
      setIsOpen(false);
    } catch (error: any) {
      console.error('[TeacherRatingComponent] Error al guardar calificación:', error);
      showToast('Error al guardar la calificación', 'error');
    }
  };

  // Calcular promedio general
  const overallAverage = stats ? calculateTeacherAverage(stats.overall) : null;
  const totalRatings = stats?.overall.total || 0;

  if (statsLoading || myRatingLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
        Cargando calificaciones...
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="teacher-rating-container"
      style={{
        marginBottom: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <style>{`
        .rating-option {
          transition: all 0.2s ease;
        }
        .rating-option:hover {
          transform: scale(1.05);
        }
        .rating-option.selected {
          background: rgba(34, 197, 94, 0.2) !important;
          border-color: rgba(34, 197, 94, 0.6) !important;
        }
        
        @media (max-width: 768px) {
          .teacher-rating-container {
            padding: 1rem !important;
            border-radius: 16px !important;
            margin-bottom: 1.5rem !important;
          }
          
          .teacher-rating-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .teacher-rating-header-content {
            flex-direction: row !important;
            gap: 1rem !important;
            width: 100%;
          }
          
          .teacher-rating-avatar {
            width: 60px !important;
            height: 60px !important;
            font-size: 1.5rem !important;
          }
          
          .teacher-rating-title {
            font-size: 1.1rem !important;
            margin-bottom: 0.25rem !important;
          }
          
          .teacher-rating-button {
            width: 100% !important;
            padding: 0.6rem 1rem !important;
            font-size: 0.85rem !important;
          }
          
          .teacher-rating-form {
            padding: 1rem !important;
            margin-top: 1rem !important;
          }
          
          .teacher-rating-options {
            gap: 0.5rem !important;
          }
          
          .teacher-rating-option {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
          
          .teacher-rating-option-icon {
            font-size: 1rem !important;
          }
          
          .teacher-rating-breakdown {
            margin-top: 1.5rem !important;
            padding-top: 1.5rem !important;
          }
          
          .teacher-rating-breakdown-title {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .teacher-rating-breakdown-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          
          .teacher-rating-breakdown-card {
            padding: 0.75rem !important;
          }
          
          .teacher-rating-breakdown-label {
            font-size: 0.8rem !important;
            margin-bottom: 0.4rem !important;
          }
          
          .teacher-rating-breakdown-value {
            font-size: 1.25rem !important;
          }
          
          .teacher-rating-breakdown-count {
            font-size: 0.7rem !important;
            margin-top: 0.2rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .teacher-rating-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
          
          .teacher-rating-avatar {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.25rem !important;
          }
          
          .teacher-rating-title {
            font-size: 1rem !important;
          }
          
          .teacher-rating-option {
            padding: 0.45rem 0.65rem !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>

      {/* Header con promedio */}
      <div className="teacher-rating-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="teacher-rating-header-content" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            className="teacher-rating-avatar"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: overallAverage
                ? `linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))`
                : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              flexShrink: 0,
            }}
          >
            {overallAverage ? overallAverage.toFixed(1) : '—'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="section-title teacher-rating-title" style={{ margin: 0, marginBottom: '0.5rem' }}>
              ⭐ Calificaciones
            </h3>
            {overallAverage && (
              <div style={{ fontSize: '0.8rem', opacity: 0.65, margin: 0, fontWeight: 400 }}>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{ listStyle: 'none', display: 'inline' }}>
                    <span style={{ textDecoration: 'underline', fontStyle: 'italic' }}>
                      ¿Cómo se calcula?
                    </span>
                  </summary>
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', fontSize: '0.75rem', lineHeight: 1.6 }}>
                    <p style={{ margin: 0, marginBottom: '0.5rem' }}>
                      <strong>Ponderación:</strong>
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc' }}>
                      <li>⭐ Excelente = 5 puntos</li>
                      <li>👍 Muy bueno = 4 puntos</li>
                      <li>🙂 Bueno = 3 puntos</li>
                      <li>😐 Regular = 2 puntos</li>
                      <li>❌ No tomé la clase = no cuenta</li>
                    </ul>
                    <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                      Promedio = (Suma de puntos) ÷ (Cantidad de calificaciones)
                    </p>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Botón para calificar */}
        <div style={{ flexShrink: 0 }}>
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="teacher-rating-button"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                background: myRating
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: `1px solid ${myRating ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {myRating ? '✏️ Actualizar calificación' : '⭐ Calificar'}
            </motion.button>
          )}

          {!user && (
            <div style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', opacity: 0.7, color: '#fff', textAlign: 'center' }}>
              Inicia sesión para calificar
            </div>
          )}
        </div>
      </div>

      {/* Formulario de calificación */}
      <AnimatePresence>
        {isOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="teacher-rating-form"
            style={{
              overflow: 'hidden',
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.15)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Pregunta Principal */}
            <div style={{ marginBottom: showAdditionalQuestions ? '1.5rem' : '0' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#fff',
                }}
              >
                {QUESTIONS[0].label}
                <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
              </label>

              <div
                className="teacher-rating-options"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {RATING_OPTIONS.map((option) => {
                  const { emoji, label } = getTeacherRatingDisplay(option);
                  const isSelected = formData.overall_rating === option;

                  return (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleRatingChange('overall_rating', option)}
                      className={`rating-option teacher-rating-option ${isSelected ? 'selected' : ''}`}
                      style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        background: isSelected
                          ? 'rgba(34, 197, 94, 0.25)'
                          : 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${isSelected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span className="teacher-rating-option-icon" style={{ fontSize: '1.1rem' }}>{emoji}</span>
                      <span>{label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Botón para mostrar más preguntas */}
            {!showAdditionalQuestions && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdditionalQuestions(true)}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>💬</span>
                <span>¿Quieres dejar más comentarios?</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>→</span>
              </motion.button>
            )}

            {/* Preguntas Adicionales */}
            <AnimatePresence>
              {showAdditionalQuestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    overflow: 'hidden',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: 0, fontStyle: 'italic' }}>
                      Opcional: Califica aspectos específicos
                    </p>
                  </div>

                  {QUESTIONS.slice(1).map((question) => {
                    const currentValue = formData[question.key];

                    return (
                      <div key={question.id} style={{ marginBottom: '1.25rem' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            marginBottom: '0.6rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                          }}
                        >
                          {question.label}
                        </label>

                        <div
                          className="teacher-rating-options"
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          {RATING_OPTIONS.map((option) => {
                            const { emoji, label } = getTeacherRatingDisplay(option);
                            const isSelected = currentValue === option;

                            return (
                              <motion.button
                                key={option}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleRatingChange(question.key, option)}
                                className={`rating-option teacher-rating-option ${isSelected ? 'selected' : ''}`}
                                style={{
                                  padding: '0.5rem 0.85rem',
                                  borderRadius: '8px',
                                  background: isSelected
                                    ? 'rgba(34, 197, 94, 0.2)'
                                    : 'rgba(255, 255, 255, 0.04)',
                                  border: `1px solid ${isSelected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? '600' : '400',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <span className="teacher-rating-option-icon" style={{ fontSize: '1rem' }}>{emoji}</span>
                                <span>{label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón para ocultar preguntas adicionales */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAdditionalQuestions(false)}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.8rem',
                      fontWeight: '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Ocultar preguntas adicionales
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsOpen(false);
                  setShowAdditionalQuestions(false);
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!formData.overall_rating || upsertRating.isPending}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: formData.overall_rating && !upsertRating.isPending
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: formData.overall_rating && !upsertRating.isPending ? 'pointer' : 'not-allowed',
                  opacity: formData.overall_rating && !upsertRating.isPending ? 1 : 0.5,
                }}
              >
                {upsertRating.isPending ? 'Guardando...' : 'Guardar'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desglose de calificaciones (si hay datos) */}
      {stats && totalRatings > 0 && (
        <div className="teacher-rating-breakdown" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h4 className="teacher-rating-breakdown-title" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#fff' }}>
            Desglose por categoría
          </h4>
          <div className="teacher-rating-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {QUESTIONS.map((question) => {
              const categoryStats = stats[question.id];
              const avg = calculateTeacherAverage(categoryStats);
              const total = categoryStats.total;

              if (total === 0) return null;

              return (
                <div
                  key={question.id}
                  className="teacher-rating-breakdown-card"
                  style={{
                    padding: '1rem',
                    background: question.id === 'overall' 
                      ? 'rgba(34, 197, 94, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: question.id === 'overall'
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="teacher-rating-breakdown-label" style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#fff' }}>
                    {question.label}
                  </div>
                  <div className="teacher-rating-breakdown-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: question.id === 'overall' ? '#22c55e' : '#22c55e' }}>
                    {avg ? avg.toFixed(1) : '—'}
                  </div>
                  <div className="teacher-rating-breakdown-count" style={{ fontSize: '0.75rem', opacity: 0.7, color: '#fff', marginTop: '0.25rem' }}>
                    {total} respuesta{total !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}

