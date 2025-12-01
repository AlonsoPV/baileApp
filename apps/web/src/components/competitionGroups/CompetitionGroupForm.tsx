import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useCreateCompetitionGroup, useUpdateCompetitionGroup, useCompetitionGroup } from '@/hooks/useCompetitionGroups';
import { useMyApprovedRoles } from '@/hooks/useMyApprovedRoles';
import { useTeacherMy } from '@/hooks/useTeacher';
import { useAcademyMy } from '@/hooks/useAcademy';
import { supabase } from '@/lib/supabase';
import type { CompetitionGroupFormData, CompetitionGroupCostType } from '@/types/competitionGroup';
import { useToast } from '@/components/Toast';
import UbicacionesEditor from '@/components/locations/UbicacionesEditor';
import { useUploadCompetitionGroupMedia, useRemoveCompetitionGroupMedia } from '@/hooks/useCompetitionGroupMedia';
import { useAvailableUsersForInvitation, useAvailableTeachersForInvitation, useSendCompetitionGroupInvitation, useGroupInvitations } from '@/hooks/useCompetitionGroupInvitations';

export default function CompetitionGroupForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  console.log('[CompetitionGroupForm] user:', user);
  const { showToast } = useToast();
  const { data: approvedRoles } = useMyApprovedRoles();
  const isEditMode = !!id;

  // Hooks
  const { data: existingGroup, isLoading: loadingGroup } = useCompetitionGroup(id);
  const createGroup = useCreateCompetitionGroup();
  const updateGroup = useUpdateCompetitionGroup();
  const { data: teacherProfile } = useTeacherMy();
  const { data: academyProfile } = useAcademyMy();
  const uploadMedia = useUploadCompetitionGroupMedia();
  const removeMedia = useRemoveCompetitionGroupMedia();
  
  // Estados para invitaciones
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitationSearch, setInvitationSearch] = useState('');
  const [invitationType, setInvitationType] = useState<'users' | 'teachers' | 'all'>('all');
  const [selectedInvitees, setSelectedInvitees] = useState<Array<{ user_id: string; name: string; avatar_url?: string; type?: 'user' | 'teacher' }>>([]);
  
  // Hooks para buscar usuarios/maestros disponibles (funciona en creación y edición)
  const { data: availableUsers } = useAvailableUsersForInvitation(
    isEditMode && id ? id : undefined,
    (invitationType === 'users' || invitationType === 'all') && invitationSearch ? invitationSearch : undefined
  );
  const { data: availableTeachers } = useAvailableTeachersForInvitation(
    isEditMode && id ? id : undefined,
    (invitationType === 'teachers' || invitationType === 'all') && invitationSearch ? invitationSearch : undefined
  );
  const sendInvitation = useSendCompetitionGroupInvitation();
  const { data: existingInvitations } = useGroupInvitations(isEditMode && id ? id : undefined);

  // Cargar invitaciones existentes cuando se está editando
  useEffect(() => {
    if (isEditMode && existingInvitations && existingInvitations.length > 0) {
      const invitees = existingInvitations
        .filter(inv => inv.status === 'pending' || inv.status === 'accepted')
        .map(inv => ({
          user_id: inv.invitee_id,
          name: inv.invitee_display_name || inv.invitee_id,
          avatar_url: undefined, // Se puede enriquecer después si es necesario
          type: 'user' as const,
        }));
      setSelectedInvitees(invitees);
    }
  }, [isEditMode, existingInvitations]);

  // Combinar resultados de usuarios y maestros cuando invitationType es 'all'
  // Incluir invitaciones existentes en los resultados para que aparezcan en la lista
  const combinedResults = React.useMemo(() => {
    // Obtener user_ids de invitaciones existentes
    const existingInviteeIds = new Set(
      (existingInvitations || [])
        .filter((inv: any) => inv.status === 'pending' || inv.status === 'accepted')
        .map((inv: any) => inv.invitee_id)
    );

    let users: any[] = [];
    let teachers: any[] = [];

    if (invitationType === 'all' || invitationType === 'users') {
      users = (availableUsers || []).map((u: any) => ({ ...u, _type: 'user' }));
    }
    
    if (invitationType === 'all' || invitationType === 'teachers') {
      teachers = (availableTeachers || []).map((t: any) => ({ ...t, _type: 'teacher' }));
    }

    // Agregar invitaciones existentes que no están en los resultados de búsqueda
    if (existingInvitations && existingInvitations.length > 0) {
      existingInvitations.forEach((inv: any) => {
        if (inv.status === 'pending' || inv.status === 'accepted') {
          const alreadyInResults = [...users, ...teachers].some(item => item.user_id === inv.invitee_id);
          if (!alreadyInResults) {
            // Agregar como usuario (se puede mejorar para detectar si es maestro)
            users.push({
              user_id: inv.invitee_id,
              display_name: inv.invitee_display_name || inv.invitee_id,
              avatar_url: undefined,
              _type: 'user',
              _isExistingInvitation: true,
              _invitationStatus: inv.status,
            });
          }
        }
      });
    }

    if (invitationType === 'all') {
      return [...users, ...teachers].slice(0, 20); // Aumentar límite para incluir invitaciones existentes
    }
    if (invitationType === 'users') {
      return users;
    }
    return teachers;
  }, [invitationType, availableUsers, availableTeachers, existingInvitations]);

  // Estados del formulario
  const [formData, setFormData] = useState<CompetitionGroupFormData>({
    name: '',
    description: '',
    training_schedule: '',
    training_location: '',
    cost_type: 'monthly',
    cost_amount: 0,
    cover_image_url: '',
    promo_video_url: '',
    academy_id: null,
  });

  const [selectedLocations, setSelectedLocations] = useState<any[]>([]);
  const [userZonas, setUserZonas] = useState<number[]>([]);
  const [locationLoaded, setLocationLoaded] = useState(false); // Evitar recargar ubicación después de guardar

  // Cargar ubicaciones del perfil (teacher o academy)
  useEffect(() => {
    const profileLocations = teacherProfile?.ubicaciones || academyProfile?.ubicaciones || [];
    const profileZonas = teacherProfile?.zonas || academyProfile?.zonas || [];
    
    if (profileLocations.length > 0) {
      setSelectedLocations(profileLocations);
    }
    
    if (profileZonas.length > 0) {
      setUserZonas(profileZonas);
    }
  }, [teacherProfile, academyProfile]);

  // Establecer automáticamente el academy_id cuando se crea desde una academia
  useEffect(() => {
    if (!isEditMode) {
      // Si hay un perfil de academia, establecer su ID automáticamente
      if (academyProfile?.id) {
        console.log('[CompetitionGroupForm] Estableciendo academy_id automáticamente:', academyProfile.id);
        setFormData(prev => ({
          ...prev,
          academy_id: academyProfile.id,
        }));
      } else if (teacherProfile && !academyProfile) {
        // Si solo hay perfil de maestro (sin academia), asegurar que academy_id sea null
        console.log('[CompetitionGroupForm] Creando grupo desde perfil de maestro, academy_id será null');
        setFormData(prev => ({
          ...prev,
          academy_id: null,
        }));
      }
    }
  }, [academyProfile, teacherProfile, isEditMode]);

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (isEditMode && existingGroup) {
      setFormData({
        name: existingGroup.name || '',
        description: existingGroup.description || '',
        training_schedule: existingGroup.training_schedule || '',
        training_location: existingGroup.training_location || '',
        cost_type: existingGroup.cost_type,
        cost_amount: existingGroup.cost_amount || 0,
        cover_image_url: existingGroup.cover_image_url || '',
        promo_video_url: existingGroup.promo_video_url || '',
        academy_id: existingGroup.academy_id || null,
      });
      
      // Si hay una ubicación guardada como string, intentar convertirla (solo una vez)
      if (existingGroup.training_location && !selectedLocations.length && !locationLoaded) {
        // Intentar encontrar una ubicación que coincida o crear una básica
        const profileLocations = teacherProfile?.ubicaciones || academyProfile?.ubicaciones || [];
        const matching = profileLocations.find((loc: any) => 
          loc.direccion?.includes(existingGroup.training_location) || 
          loc.nombre?.includes(existingGroup.training_location)
        );
        
        if (matching) {
          setSelectedLocations([matching]);
        } else {
          // Crear una ubicación básica desde el string
          setSelectedLocations([{
            nombre: existingGroup.training_location,
            direccion: existingGroup.training_location,
            zonaIds: [],
          }]);
        }
        setLocationLoaded(true); // Marcar como cargado para evitar recargas
      }
    }
  }, [isEditMode, existingGroup, teacherProfile, academyProfile, selectedLocations.length, locationLoaded]);

  // Cargar academias del usuario si es academia

  // Actualizar training_location cuando cambian las ubicaciones seleccionadas
  // Solo actualizar si no estamos en modo edición o si el valor cambió realmente
  useEffect(() => {
    if (selectedLocations.length === 0) {
      // Si no hay ubicaciones seleccionadas y no estamos editando, limpiar
      if (!isEditMode) {
        setFormData(prev => ({ ...prev, training_location: '' }));
      }
      return;
    }
    
    const firstLocation = selectedLocations[0];
    const locationString = [
      firstLocation.nombre || firstLocation.sede,
      firstLocation.direccion,
      firstLocation.ciudad
    ].filter(Boolean).join(', ') || firstLocation.direccion || firstLocation.nombre || '';
    
    if (locationString) {
      setFormData(prev => {
        // Solo actualizar si el valor realmente cambió para evitar duplicados
        if (prev.training_location !== locationString) {
          return { ...prev, training_location: locationString };
        }
        return prev;
      });
    }
  }, [selectedLocations, isEditMode]);

  // Validar formulario
  const validate = (): boolean => {
    if (!formData.name.trim()) {
      showToast('El nombre del grupo es obligatorio', 'error');
      return false;
    }
    if (!formData.training_location.trim() && selectedLocations.length === 0) {
      showToast('La ubicación de entrenamientos es obligatoria', 'error');
      return false;
    }
    if (!formData.cost_amount || formData.cost_amount <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return false;
    }
    return true;
  };

  // Manejar cambio de campos
  const handleChange = (field: keyof CompetitionGroupFormData, value: any) => {
    if (field === 'cost_amount') {
      const normalized = Number(value);
      const safeAmount = Number.isFinite(normalized) ? Math.max(0, normalized) : 0;
      setFormData(prev => ({ ...prev, cost_amount: safeAmount }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar upload de imagen de portada
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen', 'error');
      return;
    }

    try {
      // Si estamos editando, subir al grupo existente
      if (isEditMode && id) {
        const media = await uploadMedia.mutateAsync({ groupId: id, file });
        handleChange('cover_image_url', media.url);
        showToast('Imagen subida correctamente', 'success');
      } else {
        // Si estamos creando, guardar el archivo temporalmente
        // Se subirá después de crear el grupo
        const reader = new FileReader();
        reader.onloadend = () => {
          handleChange('cover_image_url', reader.result as string);
        };
        reader.readAsDataURL(file);
        showToast('Imagen seleccionada. Se subirá al crear el grupo.', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Error al subir imagen', 'error');
    }
  };

  // Manejar upload de video
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      showToast('Por favor selecciona un archivo de video', 'error');
      return;
    }

    try {
      // Si estamos editando, subir al grupo existente
      if (isEditMode && id) {
        const media = await uploadMedia.mutateAsync({ groupId: id, file });
        handleChange('promo_video_url', media.url);
        showToast('Video subido correctamente', 'success');
      } else {
        // Si estamos creando, guardar el archivo temporalmente
        const reader = new FileReader();
        reader.onloadend = () => {
          handleChange('promo_video_url', reader.result as string);
        };
        reader.readAsDataURL(file);
        showToast('Video seleccionado. Se subirá al crear el grupo.', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Error al subir video', 'error');
    }
  };

  // Manejar eliminación de imagen
  const handleRemoveImage = async () => {
    if (formData.cover_image_url && isEditMode && id) {
      try {
        // Extraer el path del URL para eliminarlo
        const url = new URL(formData.cover_image_url);
        const path = url.pathname.split('/').slice(-2).join('/');
        await removeMedia.mutateAsync(`competition-groups/${id}/${path}`);
        handleChange('cover_image_url', '');
        showToast('Imagen eliminada', 'success');
      } catch (error: any) {
        showToast(error.message || 'Error al eliminar imagen', 'error');
      }
    } else {
      handleChange('cover_image_url', '');
    }
  };

  // Manejar eliminación de video
  const handleRemoveVideo = async () => {
    if (formData.promo_video_url && isEditMode && id) {
      try {
        // Extraer el path del URL para eliminarlo
        const url = new URL(formData.promo_video_url);
        const path = url.pathname.split('/').slice(-2).join('/');
        await removeMedia.mutateAsync(`competition-groups/${id}/${path}`);
        handleChange('promo_video_url', '');
        showToast('Video eliminado', 'success');
      } catch (error: any) {
        showToast(error.message || 'Error al eliminar video', 'error');
      }
    } else {
      handleChange('promo_video_url', '');
    }
  };

  // Guardar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditMode && id) {
        // Asegurar que training_location no se duplique
        const finalFormData = {
          ...formData,
          training_location: selectedLocations.length > 0 
            ? [
                selectedLocations[0].nombre || selectedLocations[0].sede,
                selectedLocations[0].direccion,
                selectedLocations[0].ciudad
              ].filter(Boolean).join(', ') || selectedLocations[0].direccion || selectedLocations[0].nombre || formData.training_location
            : formData.training_location
        };
        
        await updateGroup.mutateAsync({ groupId: id, formData: finalFormData });
        
        // Enviar invitaciones si hay seleccionadas (solo las nuevas, no las existentes)
        const existingInviteeIds = new Set(
          (existingInvitations || [])
            .filter((inv: any) => inv.status === 'pending' || inv.status === 'accepted')
            .map((inv: any) => inv.invitee_id)
        );
        
        const newInvitees = selectedInvitees.filter(inv => !existingInviteeIds.has(inv.user_id));
        
        if (newInvitees.length > 0) {
          for (const invitee of newInvitees) {
            try {
              await sendInvitation.mutateAsync({
                groupId: id,
                inviteeId: invitee.user_id,
              });
            } catch (err: any) {
              console.error('Error al enviar invitación:', err);
            }
          }
          showToast(`Grupo actualizado e invitaciones enviadas a ${newInvitees.length} persona(s)`, 'success');
        } else {
          showToast('Grupo actualizado correctamente', 'success');
        }
        navigate(`/competition-groups/${id}`);
      } else {
        const newGroup = await createGroup.mutateAsync(formData);
        
        // Si hay imagen/video como data URL, subirlos ahora
        if (formData.cover_image_url && formData.cover_image_url.startsWith('data:')) {
          // Convertir data URL a File y subir
          const response = await fetch(formData.cover_image_url);
          const blob = await response.blob();
          const file = new File([blob], 'cover.jpg', { type: blob.type });
          const media = await uploadMedia.mutateAsync({ groupId: newGroup.id, file });
          await updateGroup.mutateAsync({ groupId: newGroup.id, formData: { cover_image_url: media.url } });
        }
        
        if (formData.promo_video_url && formData.promo_video_url.startsWith('data:')) {
          const response = await fetch(formData.promo_video_url);
          const blob = await response.blob();
          const file = new File([blob], 'promo.mp4', { type: blob.type });
          const media = await uploadMedia.mutateAsync({ groupId: newGroup.id, file });
          await updateGroup.mutateAsync({ groupId: newGroup.id, formData: { promo_video_url: media.url } });
        }
        
        // Enviar invitaciones si hay seleccionadas
        if (selectedInvitees.length > 0) {
          for (const invitee of selectedInvitees) {
            try {
              await sendInvitation.mutateAsync({
                groupId: newGroup.id,
                inviteeId: invitee.user_id,
              });
            } catch (err: any) {
              console.error('Error al enviar invitación:', err);
            }
          }
          showToast(`Grupo creado e invitaciones enviadas a ${selectedInvitees.length} persona(s)`, 'success');
        } else {
          showToast('Grupo creado correctamente', 'success');
        }
        navigate(`/competition-groups/${newGroup.id}`);
      }
    } catch (error: any) {
      showToast(error.message || 'Error al guardar el grupo', 'error');
    }
  };

  if (loadingGroup) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Cargando...</div>;
  }

  // Sin restricciones: cualquier usuario autenticado puede crear grupos
  if (!user) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Cargando usuario...</div>;
  }

  return (
    <>
      <style>{`
        .form-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }
        .form-header {
          margin-bottom: 2rem;
        }
        .form-title {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #f093fb, #f5576c, #FFD166);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .form-subtitle {
          font-size: 1rem;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }
        .form-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 2.5rem;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          margin-bottom: 1.5rem;
        }
        .form-section {
          margin-bottom: 2rem;
        }
        .form-section:last-child {
          margin-bottom: 0;
        }
        .form-section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
        }
        .form-section-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          box-shadow: 0 4px 16px rgba(240, 147, 251, 0.2);
        }
        .form-field {
          margin-bottom: 1.5rem;
        }
        .form-field:last-child {
          margin-bottom: 0;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: #fff;
          font-size: 0.95rem;
        }
        .form-label-required::after {
          content: " *";
          color: #f5576c;
        }
        .form-help {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          margin-top: 0.5rem;
          line-height: 1.5;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          outline: none;
          border-color: rgba(240, 147, 251, 0.5);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
        }
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        @media (max-width: 768px) {
          .form-container {
            padding: 1rem;
          }
          .form-card {
            padding: 1.5rem;
          }
          .form-title {
            font-size: 2rem;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="form-container">
        <div className="form-header">
          <button 
            onClick={() => navigate(-1)} 
            className="cc-btn cc-btn--ghost"
            style={{
              marginBottom: '1.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Volver
          </button>
          <h1 className="form-title">
            {isEditMode ? 'Editar Grupo de Competencia' : 'Crear Grupo de Competencia'}
          </h1>
          <p className="form-subtitle">
            {isEditMode 
              ? 'Actualiza la información de tu grupo de competencia'
              : 'Completa la información para crear un nuevo grupo de competencia. Serás el administrador del grupo automáticamente.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información Básica */}
          <div className="form-card">
            <div className="form-section-title">
              <div className="form-section-icon">📋</div>
              <span>Información Básica</span>
            </div>
            
            <div className="form-field">
              <label className="form-label form-label-required">
                Nombre del Grupo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="form-input"
                placeholder="Ej: Grupo de Competencia Bachata Avanzada"
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="form-textarea"
                placeholder="Describe el grupo, objetivos, nivel requerido, etc."
              />
              <p className="form-help">
                Proporciona una descripción detallada que ayude a los miembros potenciales a entender el propósito y requisitos del grupo.
              </p>
            </div>
          </div>

          {/* Horarios y Ubicación */}
          <div className="form-card">
            <div className="form-section-title">
              <div className="form-section-icon">📍</div>
              <span>Horarios y Ubicación</span>
            </div>

            <div className="form-field">
              <label className="form-label">
                Horarios de Entrenamiento
              </label>
              <textarea
                value={formData.training_schedule || ''}
                onChange={(e) => handleChange('training_schedule', e.target.value)}
                rows={3}
                className="form-textarea"
                placeholder="Ej: Lunes y Miércoles de 7:00 PM a 9:00 PM"
              />
            </div>

            <div className="form-field">
              <label className="form-label form-label-required">
                Ubicación de Entrenamientos
              </label>
              <p className="form-help">
                Selecciona una ubicación de tu perfil o agrega una nueva manualmente
              </p>
              <UbicacionesEditor
                value={selectedLocations}
                onChange={(locations) => {
                  setSelectedLocations(locations);
                }}
                title=""
                allowedZoneIds={userZonas.length > 0 ? userZonas : undefined}
                style={{ marginBottom: 16 }}
              />
            </div>
          </div>

          {/* Costos */}
          <div className="form-card">
            <div className="form-section-title">
              <div className="form-section-icon">💰</div>
              <span>Información de Costos</span>
            </div>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label form-label-required">
                  Tipo de Costo
                </label>
                <select
                  value={formData.cost_type}
                  onChange={(e) => handleChange('cost_type', e.target.value as CompetitionGroupCostType)}
                  required
                  className="form-select"
                  style={{ background: '#000000' }}
                >
                  <option value="monthly">Mensual</option>
                  <option value="per_session">Por Sesión</option>
                  <option value="package">Paquete</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label form-label-required">
                  Monto (MXN)
                </label>
                <input
                  type="number"
                  value={formData.cost_amount}
                  onChange={(e) => handleChange('cost_amount', parseFloat(e.target.value) || 0)}
                  required
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Medios */}
          <div className="form-card">
            <div className="form-section-title">
              <div className="form-section-icon">🖼️</div>
              <span>Medios Visuales</span>
            </div>

            <div className="form-field">
              <label className="form-label">
                Foto de Portada
              </label>
              {formData.cover_image_url ? (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={formData.cover_image_url}
                    alt="Portada"
                    style={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      marginTop: 12,
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(239,68,68,0.2)',
                      border: '1px solid #EF4444',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    }}
                  >
                    🗑️ Eliminar Imagen
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="cover-image-upload"
                  />
                  <label
                    htmlFor="cover-image-upload"
                    style={{
                      display: 'block',
                      padding: '2rem',
                      borderRadius: 12,
                      border: '2px dashed rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                    <div style={{ fontWeight: 600 }}>Subir Foto de Portada</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem' }}>
                      PNG, JPG o WEBP (máx. 10MB)
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Video Promocional
              </label>
              <p className="form-help">
                Puedes subir un video o ingresar una URL de YouTube/Vimeo
              </p>
              
              {formData.promo_video_url ? (
                <div style={{ marginBottom: 12 }}>
                  {formData.promo_video_url.startsWith('http') ? (
                    <div style={{ 
                      padding: '1rem', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <p style={{ margin: 0, opacity: 0.9, wordBreak: 'break-all' }}>
                        <strong>URL:</strong> {formData.promo_video_url}
                      </p>
                    </div>
                  ) : (
                    <video
                      src={formData.promo_video_url}
                      controls
                      style={{
                        width: '100%',
                        maxHeight: 300,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    style={{
                      marginTop: 12,
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(239,68,68,0.2)',
                      border: '1px solid #EF4444',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    }}
                  >
                    🗑️ Eliminar Video
                  </button>
                </div>
              ) : null}
              
              <div className="form-grid">
                <div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                    id="promo-video-upload"
                  />
                  <label
                    htmlFor="promo-video-upload"
                    style={{
                      display: 'block',
                      padding: '1rem',
                      borderRadius: 12,
                      border: '2px dashed rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎥</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subir Video</div>
                  </label>
                </div>
                <div>
                  <input
                    type="url"
                    value={formData.promo_video_url?.startsWith('http') ? formData.promo_video_url : ''}
                    onChange={(e) => handleChange('promo_video_url', e.target.value)}
                    placeholder="URL de YouTube o Vimeo"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invitaciones */}
          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="form-section-title" style={{ margin: 0 }}>
                <div className="form-section-icon">👥</div>
                <span>Invitaciones (Opcional)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInvitations(!showInvitations)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: showInvitations ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${showInvitations ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = showInvitations ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = showInvitations ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)';
                }}
              >
                {showInvitations ? '👁️ Ocultar' : '👁️‍🗨️ Mostrar'}
              </button>
            </div>
          
            {showInvitations && (
              <div style={{
                padding: '1.5rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
              {!isEditMode && (
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: 12, padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 8 }}>
                  💡 Las invitaciones se enviarán después de crear el grupo. Puedes seleccionar usuarios/maestros ahora.
                </p>
              )}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setInvitationType('all');
                      setInvitationSearch('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: invitationType === 'all' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${invitationType === 'all' ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    🔍 Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvitationType('users');
                      setInvitationSearch('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: invitationType === 'users' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${invitationType === 'users' ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    👤 Usuarios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvitationType('teachers');
                      setInvitationSearch('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: invitationType === 'teachers' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${invitationType === 'teachers' ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    👨‍🏫 Maestros
                  </button>
                </div>
                
                <input
                  type="text"
                  value={invitationSearch}
                  onChange={(e) => setInvitationSearch(e.target.value)}
                  placeholder={`Buscar ${invitationType === 'all' ? 'usuarios y maestros' : invitationType === 'users' ? 'usuarios' : 'maestros'}...`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>

              {/* Mostrar invitaciones existentes (solo en modo edición) */}
              {isEditMode && existingInvitations && existingInvitations.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: 8 }}>
                    Invitaciones existentes:
                  </p>
                  <div style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    marginBottom: 12,
                  }}>
                    {existingInvitations.map((inv: any) => {
                      const isSelected = selectedInvitees.some(sel => sel.user_id === inv.invitee_id);
                      const statusLabels: Record<string, string> = {
                        pending: '⏳ Pendiente',
                        accepted: '✅ Aceptada',
                        rejected: '❌ Rechazada',
                        cancelled: '🚫 Cancelada',
                      };
                      
                      return (
                        <div
                          key={inv.id}
                          style={{
                            padding: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: isSelected ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>
                              {inv.invitee_display_name || inv.invitee_id}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                              {statusLabels[inv.status] || inv.status}
                            </div>
                          </div>
                          {isSelected && <span style={{ fontSize: '1.2rem' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista de resultados - funciona en creación y edición */}
              {invitationSearch && (
                <div style={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  marginBottom: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}>
                  {combinedResults.length > 0 ? (
                    combinedResults.map((item: any) => {
                      const isSelected = selectedInvitees.some(inv => inv.user_id === item.user_id);
                      const displayName = item.display_name || item.nombre_publico || 'Sin nombre';
                      const itemType = item._type || (item.display_name ? 'user' : 'teacher');
                      
                      return (
                        <button
                          key={`${item.user_id}-${itemType}`}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedInvitees(prev => prev.filter(inv => inv.user_id !== item.user_id));
                            } else {
                              setSelectedInvitees(prev => [...prev, {
                                user_id: item.user_id,
                                name: displayName,
                                avatar_url: item.avatar_url,
                                type: itemType,
                              }]);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: isSelected ? 'rgba(59,130,246,0.2)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <img
                            src={item.avatar_url || 'https://placehold.co/32x32'}
                            alt={displayName}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600 }}>{displayName}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                              {item._isExistingInvitation 
                                ? `📬 ${item._invitationStatus === 'pending' ? 'Invitación pendiente' : 'Invitación aceptada'}`
                                : itemType === 'teacher' ? '👨‍🏫 Maestro' : '👤 Usuario'}
                            </span>
                          </div>
                          {isSelected && <span style={{ fontSize: '1.2rem' }}>✓</span>}
                        </button>
                      );
                    })
                  ) : invitationSearch.length > 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>
                      <p>No se encontraron {invitationType === 'all' ? 'usuarios ni maestros' : invitationType === 'users' ? 'usuarios' : 'maestros'} con ese nombre.</p>
                    </div>
                  ) : null}
                </div>
              )}
              
              {/* Opción manual para agregar por user_id (solo en modo creación) */}
              {!isEditMode && (
                <div style={{ marginBottom: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 8 }}>
                    O agrega manualmente por user_id:
                  </p>
                  <input
                    type="text"
                    placeholder="Ingresa user_id y presiona Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const userId = e.currentTarget.value.trim();
                        if (!selectedInvitees.some(inv => inv.user_id === userId)) {
                          setSelectedInvitees(prev => [...prev, {
                            user_id: userId,
                            name: userId,
                            avatar_url: undefined,
                          }]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              )}

              {/* Invitados seleccionados */}
              {selectedInvitees.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: 8 }}>
                    {selectedInvitees.length} persona(s) seleccionada(s):
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedInvitees.map((invitee) => (
                      <div
                        key={invitee.user_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 12px',
                          background: 'rgba(59,130,246,0.2)',
                          border: '1px solid #3B82F6',
                          borderRadius: 20,
                          fontSize: '0.875rem',
                        }}
                      >
                        <img
                          src={invitee.avatar_url || 'https://placehold.co/20x20'}
                          alt={invitee.name}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                        <span>{invitee.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedInvitees(prev => prev.filter(inv => inv.user_id !== invitee.user_id))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: 0,
                            width: 20,
                            height: 20,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Acciones */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cc-btn cc-btn--ghost"
              style={{
                padding: '0.875rem 1.75rem',
                fontSize: '1rem',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="cc-btn"
              disabled={createGroup.isPending || updateGroup.isPending}
              style={{
                padding: '0.875rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                background: createGroup.isPending || updateGroup.isPending 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'linear-gradient(135deg, #f093fb, #f5576c)',
                boxShadow: createGroup.isPending || updateGroup.isPending 
                  ? 'none' 
                  : '0 8px 24px rgba(240, 147, 251, 0.4)',
                transition: 'all 0.2s ease',
                cursor: createGroup.isPending || updateGroup.isPending ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!createGroup.isPending && !updateGroup.isPending) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(240, 147, 251, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {createGroup.isPending || updateGroup.isPending
                ? '⏳ Guardando...'
                : isEditMode
                ? '💾 Actualizar Grupo'
                : '✨ Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

