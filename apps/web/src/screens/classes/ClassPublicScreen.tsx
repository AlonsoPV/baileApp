import React from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ClasesLive from '@/components/events/ClasesLive';
import TeacherCard from '@/components/explore/cards/TeacherCard';
import AcademyCard from '@/components/explore/cards/AcademyCard';
import AddToCalendarWithStats from '@/components/AddToCalendarWithStats';
import { useTeacherPublic } from '@/hooks/useTeacher';
import { useAcademyPublic } from '@/hooks/useAcademy';
import { useUserProfile } from '@/hooks/useUserProfile';
import { urls } from '@/lib/urls';
import SeoHead from '@/components/SeoHead';
import { SEO_BASE_URL, SEO_LOGO_URL } from '@/lib/seoConfig';
import { getMediaBySlot } from '@/utils/mediaSlots';
import { calculateNextDateWithTime } from '@/utils/calculateRecurringDates';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCreateCheckoutSession } from '@/hooks/useStripeCheckout';

type SourceType = 'teacher' | 'academy';

// Función para construir URL de WhatsApp para clases
function buildClassWhatsAppUrl(
  phone?: string | null,
  messageTemplate?: string | null,
  className?: string
): string | undefined {
  if (!phone) return undefined;
  
  const cleanedPhone = phone.replace(/[^\d]/g, '');
  if (!cleanedPhone) return undefined;

  let message = '';
  if (messageTemplate && className) {
    // Reemplazar {nombre} o {clase} con el nombre de la clase
    message = messageTemplate
      .replace(/\{nombre\}/g, className)
      .replace(/\{clase\}/g, className);
  } else if (className) {
    // Mensaje por defecto si no hay template
    message = `me interesa la clase: ${className}`;
  }

  // Prepend "Hola vengo de Donde Bailar MX, " al mensaje
  const fullMessage = message.trim() 
    ? `Hola vengo de Donde Bailar MX, ${message.trim()}`
    : 'Hola vengo de Donde Bailar MX';

  const encoded = encodeURIComponent(fullMessage);
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;
}

export default function ClassPublicScreen() {
  const [sp] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createCheckout = useCreateCheckoutSession();

  // Permitir /clase?type=teacher&id=123 o /clase/:type/:id
  const sourceType = (params as any)?.type || (sp.get('type') as SourceType) || 'teacher';
  const rawId = (params as any)?.id || sp.get('id') || '';
  const classIdParam = sp.get('classId') || sp.get('claseId') || '';
  const classIndexParam = sp.get('i') || sp.get('index') || '';
  const diaParam = sp.get('dia'); // Día específico para clases con múltiples días
  const fromParam = sp.get('from');
  const idNum = Number(rawId);

  const isTeacher = sourceType === 'teacher';
  const teacherQ = useTeacherPublic(isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const academyQ = useAcademyPublic(!isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const { profile: userProfile } = useUserProfile();

  const loading = isTeacher ? teacherQ.isLoading : academyQ.isLoading;
  const profile: any = isTeacher ? teacherQ.data : academyQ.data;

  if (!rawId || Number.isNaN(idNum)) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Falta id</div>;
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Cargando…</div>;
  }

  if (!profile) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Clase no encontrada</div>;
  }

  const creatorName = profile?.nombre_publico || profile?.display_name || '—';
  const creatorLink = isTeacher ? urls.teacherLive(profile?.id) : urls.academyLive(profile?.id);
  const creatorTypeLabel = isTeacher ? 'Maestro' : 'Academia';

  // Usar cronograma como fuente principal, con horarios como fallback para compatibilidad
  const cronograma = profile?.cronograma || profile?.horarios || [];
  const costos = profile?.costos || [];
  const ubicacionBase = Array.isArray(profile?.ubicaciones) && profile.ubicaciones.length > 0
    ? {
        nombre: profile.ubicaciones[0]?.nombre,
        direccion: profile.ubicaciones[0]?.direccion,
        ciudad: profile.ubicaciones[0]?.ciudad,
        referencias: profile.ubicaciones[0]?.referencias,
      }
    : undefined;

  // Seleccionar SOLO una clase del cronograma (por id o índice). Fallback: primera.
  const classesArr = Array.isArray(cronograma) ? (cronograma as any[]) : [];
  let selectedClass: any | undefined = undefined;
  let selectedClassIndex = 0;
  
  console.log('[ClassPublicScreen] 🔍 Buscando clase:', { classIdParam, classIndexParam, classesArrLength: classesArr.length });
  
  if (classIdParam) {
    const foundIndex = classesArr.findIndex((c: any) => String(c?.id) === String(classIdParam));
    if (foundIndex >= 0) {
      selectedClass = classesArr[foundIndex];
      selectedClassIndex = foundIndex;
      console.log('[ClassPublicScreen] ✅ Clase encontrada por ID:', { foundIndex, class: selectedClass });
    }
  }
  if (!selectedClass && classIndexParam !== '') {
    const idx = Number(classIndexParam);
    if (!Number.isNaN(idx) && idx >= 0 && idx < classesArr.length) {
      selectedClass = classesArr[idx];
      selectedClassIndex = idx;
      console.log('[ClassPublicScreen] ✅ Clase encontrada por índice:', { idx, class: selectedClass });
    } else {
      console.warn('[ClassPublicScreen] ⚠️ Índice inválido:', { idx, classesArrLength: classesArr.length });
    }
  }
  if (!selectedClass) {
    selectedClass = classesArr[0];
    selectedClassIndex = 0;
    console.log('[ClassPublicScreen] ⚠️ Usando primera clase como fallback:', selectedClass);
  }
  
  console.log('[ClassPublicScreen] 📋 Clase seleccionada:', {
    index: selectedClassIndex,
    id: selectedClass?.id,
    titulo: selectedClass?.titulo,
    nombre: selectedClass?.nombre,
    referenciaCosto: selectedClass?.referenciaCosto
  });

  // Precio numérico de la clase (para Stripe)
  const classPrice: number | null = (() => {
    try {
      // 1) Modelo nuevo: c.costo es un número
      if (typeof (selectedClass as any)?.costo === 'number') {
        const val = (selectedClass as any).costo as number;
        if (val > 0) return val;
      }

      // 2) Modelo con objeto: c.costo.precio
      if ((selectedClass as any)?.costo && typeof (selectedClass as any).costo?.precio === 'number') {
        const val = (selectedClass as any).costo.precio as number;
        if (val > 0) return val;
      }

      // 3) Buscar en el array de costos (modelo viejo)
      if (Array.isArray(costos) && costos.length) {
        const byClassId = (costos as any[]).find((c: any) => {
          if ((selectedClass as any)?.id && c?.classId && String(c.classId) === String((selectedClass as any).id)) {
            return true;
          }
          if (typeof c?.cronogramaIndex === 'number' && c.cronogramaIndex === selectedClassIndex) {
            return true;
          }
          return false;
        });
        if (byClassId && typeof byClassId.precio === 'number' && byClassId.precio > 0) {
          return byClassId.precio as number;
        }
      }
    } catch (e) {
      console.warn('[ClassPublicScreen] Error calculando classPrice:', e);
    }
    return null;
  })();

  console.log('[ClassPublicScreen] 💳 Debug pago:', {
    classPrice,
    hasStripeAccount: !!profile?.stripe_account_id,
    stripeAccountId: profile?.stripe_account_id,
  });
  
  // Generar un ID único para la clase basado en el índice (similar a useLiveClasses)
  // Si la clase tiene diasSemana, usar el primer día; si tiene fecha, usar 0
  const classUniqueId = selectedClass 
    ? (selectedClassIndex * 1000 + (selectedClass.diasSemana && Array.isArray(selectedClass.diasSemana) ? 0 : 0))
    : undefined;
  
  const cronogramaSelected = selectedClass ? [selectedClass] : [];

  // Ubicación: priorizar la de la clase si existe, si no usar base
  const ubicacion = selectedClass?.ubicacion
    ? { nombre: selectedClass.ubicacion, direccion: undefined as any, ciudad: ubicacionBase?.ciudad, referencias: undefined as any }
    : ubicacionBase;

  // Título de la clase
  const classTitle = (selectedClass?.nombre)
    || (selectedClass?.titulo)
    || (selectedClass?.clase)
    || (selectedClass?.estilo)
    || 'Clase';

  // Configuración WhatsApp para clases (solo academias tienen WhatsApp configurado)
  const whatsappNumber = !isTeacher ? ((profile as any)?.whatsapp_number || null) : null;
  const whatsappMessageTemplate = !isTeacher ? ((profile as any)?.whatsapp_message_template || 'me interesa la clase: {nombre}') : null;
  
  // Debug: verificar datos de WhatsApp
  console.log('[ClassPublicScreen] 📱 WhatsApp config:', {
    isTeacher,
    whatsappNumber,
    whatsappMessageTemplate,
    profileId: profile?.id,
    profileType: isTeacher ? 'teacher' : 'academy',
    hasWhatsappNumber: !!(profile as any)?.whatsapp_number
  });

  // Horario, costo y ubicación (para chips del header)
  const scheduleLabel = (() => {
    const ini = (selectedClass as any)?.inicio || (selectedClass as any)?.hora_inicio;
    const fin = (selectedClass as any)?.fin || (selectedClass as any)?.hora_fin;
    if (ini && fin) return `${ini} - ${fin}`;
    if (ini) return `${ini}`;
    return undefined;
  })();

  const handlePayClick = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para pagar', 'error');
      navigate('/auth/login');
      return;
    }
    if (!profile?.stripe_account_id) {
      showToast('Esta academia/maestro todavía no tiene Stripe listo para cobrar.', 'error');
      return;
    }
    if (!classPrice || classPrice <= 0) {
      showToast('Esta clase no tiene un precio válido para pago.', 'error');
      return;
    }

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('clase_asistencias')
        .insert({
          user_id: user.id,
          class_id: selectedClass?.id,
          academy_id: !isTeacher ? profile?.id : null,
          teacher_id: isTeacher ? profile?.id : null,
          role_baile: (userProfile as any)?.rol_baile || null,
          status: 'tentative',
        })
        .select('id')
        .single();

      let bookingId: string | number;
      if (bookingError) {
        const { data: existing } = await supabase
          .from('clase_asistencias')
          .select('id')
          .eq('user_id', user.id)
          .eq('class_id', selectedClass?.id)
          .maybeSingle();

        if (!existing) {
          throw bookingError;
        }
        bookingId = existing.id;
      } else {
        bookingId = booking.id;
      }

      await createCheckout.mutateAsync({
        price: classPrice,
        description: `Clase: ${classTitle} con ${creatorName}`,
        connectedAccountId: profile.stripe_account_id,
        origin: 'clase',
        bookingId,
      });
    } catch (error: any) {
      console.error('[ClassPublicScreen] Error al procesar pago:', error);
      showToast(error?.message || 'Error al iniciar el pago', 'error');
    }
  };

  const costLabel = (() => {
    try {
      console.log('[ClassPublicScreen] 💰 Buscando costo:', {
        costosLength: costos?.length || 0,
        selectedClassIndex,
        classId: selectedClass?.id,
        referenciaCosto: selectedClass?.referenciaCosto,
        titulo: selectedClass?.titulo,
        nombre: selectedClass?.nombre,
        tieneCostoEnClase: !!(selectedClass as any)?.costo,
        costos: costos
      });
      
      // PRIORIDAD 1: Buscar costo directamente en el item del cronograma (más rápido y confiable)
      if ((selectedClass as any)?.costo) {
        const costoEnClase = (selectedClass as any).costo;
        const precio = costoEnClase?.precio;
        if (typeof precio === 'number') {
          console.log('[ClassPublicScreen] ✅ Costo encontrado directamente en el item del cronograma:', { costoEnClase });
          if (precio === 0) {
            return 'Gratis';
          }
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(precio);
        }
        // Si precio es null/undefined, retornar undefined para no mostrar nada
        return undefined;
      }
      
      // PRIORIDAD 2: Buscar en el array de costos (fallback para datos antiguos)
      if (Array.isArray(costos) && costos.length) {
        // Buscar costo por múltiples criterios (más robusto)
        // PRIORIDAD: ID de clase > Índice cronograma > Nombre (para evitar problemas al cambiar nombre)
        let match: any = null;
        let matchMethod = '';
        
        // 1. Buscar por ID de clase (MÁS CONFIABLE - no cambia aunque cambie el nombre)
        if ((selectedClass as any)?.id) {
          const classId = String((selectedClass as any).id);
          // Buscar por classId exacto
          match = (costos as any[]).find((c: any) => {
            // Buscar por classId (campo dedicado)
            if (c?.classId && String(c.classId) === classId) return true;
            // Buscar por referenciaCosto que sea el ID (para compatibilidad)
            if (c?.referenciaCosto && String(c.referenciaCosto) === classId) return true;
            // También buscar si el nombre del costo es el ID (para compatibilidad con costos muy antiguos)
            return String(c?.nombre || '').trim() === classId;
          });
          if (match) {
            matchMethod = 'classId';
            console.log('[ClassPublicScreen] ✅ Costo encontrado por ID de clase:', { classId, match });
          }
        }
        
        // 2. Buscar por índice del cronograma (segunda opción más confiable)
        if (!match && selectedClassIndex !== null && selectedClassIndex !== undefined) {
          match = (costos as any[]).find((c: any) => c?.cronogramaIndex === selectedClassIndex);
          if (match) {
            matchMethod = 'cronogramaIndex';
            console.log('[ClassPublicScreen] ✅ Costo encontrado por índice:', { selectedClassIndex, match });
          }
        }
        
        // 3. Buscar por referenciaCosto (nombre de la clase) - case-insensitive
        // Si hay múltiples matches, priorizar el que tenga precio > 0 y que coincida exactamente
        if (!match && (selectedClass as any)?.referenciaCosto) {
          const ref = String((selectedClass as any).referenciaCosto).trim().toLowerCase();
          
          // Primero buscar match exacto por nombre (más confiable)
          const exactMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (exactMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = exactMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || exactMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || exactMatches[0]; // Último fallback: cualquier match exacto
            if (match) matchMethod = 'referenciaCosto (exacto)';
          }
          
          // Si no hay match exacto, buscar por título o tipo (menos confiable)
          if (!match) {
            const otherMatches = (costos as any[]).filter((c: any) => {
              const titulo = String(c?.titulo || '').trim().toLowerCase();
              const tipo = String(c?.tipo || '').trim().toLowerCase();
              return titulo === ref || tipo === ref;
            });
            
            if (otherMatches.length > 0) {
              match = otherMatches.find((c: any) => 
                (c?.classId || c?.cronogramaIndex !== undefined) && 
                typeof c?.precio === 'number' && c.precio > 0
              ) || otherMatches.find((c: any) => 
                typeof c?.precio === 'number' && c.precio > 0
              ) || otherMatches[0];
              if (match) matchMethod = 'referenciaCosto (título/tipo)';
            }
          }
        }
        
        // 4. Buscar por título de la clase (fallback)
        if (!match && (selectedClass as any)?.titulo) {
          const ref = String((selectedClass as any).titulo).trim().toLowerCase();
          const allMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (allMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = allMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches[0];
            if (match) matchMethod = 'titulo';
          }
        }
        
        // 5. Buscar por nombre de la clase (último fallback)
        if (!match && (selectedClass as any)?.nombre) {
          const ref = String((selectedClass as any).nombre).trim().toLowerCase();
          const allMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (allMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = allMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches[0];
            if (match) matchMethod = 'nombre';
          }
        }
        
        console.log('[ClassPublicScreen] 💰 Resultado de búsqueda de costo:', {
          matchFound: !!match,
          matchMethod,
          match: match ? { nombre: match.nombre, precio: match.precio, classId: match.classId, cronogramaIndex: match.cronogramaIndex } : null
        });
        
        const precio = match?.precio;
        if (typeof precio === 'number') {
          if (precio === 0) {
            return 'Gratis';
          }
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(precio);
        }
        // Si no se encontró un costo específico, buscar el mínimo de todos los costos
        const nums = (costos as any[]).map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
        if (nums.length) {
          const min = Math.min(...(nums as number[]));
          console.log('[ClassPublicScreen] 💰 Usando precio mínimo:', min);
          if (min === 0) {
            return 'Gratis';
          }
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(min);
        }
      }
      return undefined;
    } catch (error) {
      console.error('[ClassPublicScreen] ❌ Error buscando costo:', error);
      return undefined;
    }
  })();

  const locationLabel = (() => {
    if (!ubicacion) return undefined;
    const parts = [ubicacion.nombre, ubicacion.ciudad].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  })();

  // Ritmos de la clase: preferir los IDs numéricos más nuevos (ritmoIds),
  // pero mantener compatibilidad con datos antiguos que usan "ritmos"
  const ritmosRaw =
    (selectedClass?.ritmoIds && Array.isArray(selectedClass.ritmoIds) && selectedClass.ritmoIds) ||
    (selectedClass?.ritmos && Array.isArray(selectedClass.ritmos) && selectedClass.ritmos) ||
    [];
  const ritmosLabel = Array.isArray(ritmosRaw) ? ritmosRaw.slice(0, 3).join(', ') : '';
  const locationName = locationLabel || ubicacion?.ciudad || profile?.ciudad || 'México';
  const classTimes = scheduleLabel ? ` · Horario: ${scheduleLabel}` : '';
  const seoDescription = `${classTitle} con ${creatorName} en ${locationName}${classTimes}${ritmosLabel ? ` · Ritmos: ${ritmosLabel}` : ''}.`;
  const mediaList = (profile as any)?.media || [];
  const seoImage =
    getMediaBySlot(mediaList, 'p1')?.url ||
    getMediaBySlot(mediaList, 'cover')?.url ||
    profile?.avatar_url ||
    profile?.banner_url ||
    SEO_LOGO_URL;
  const classUrl = `${SEO_BASE_URL}/clase/${isTeacher ? 'teacher' : 'academy'}/${idNum}${classIndexParam ? `?i=${classIndexParam}` : classIdParam ? `?classId=${classIdParam}` : ''}`;

  return (
    <>
      <SeoHead
        section="class"
        title={`${classTitle} | ${creatorName}`}
        description={seoDescription}
        image={seoImage}
        url={classUrl}
        keywords={[
          classTitle,
          creatorName,
          locationName,
          ritmosLabel,
          'clases de baile',
          'Dónde Bailar',
        ].filter(Boolean) as string[]}
      />
      <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0', position: 'relative' }}>
      {/* Botón de volver si viene de /me/compras o /me/rsvps */}
      {(fromParam === '/me/compras' || fromParam === '/me/rsvps') && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 100,
        }}>
          <button
            onClick={() => navigate(fromParam)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ← Volver {fromParam === '/me/compras' ? 'a Compras' : 'a RSVPs'}
          </button>
        </div>
      )}
      <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
        
        /* Hero Banner */
        .class-hero-banner {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          background: linear-gradient(135deg, 
            rgba(11,13,16,.98) 0%, 
            rgba(18,22,27,.95) 50%, 
            rgba(30,20,40,.96) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin-bottom: 2rem;
          border: 2px solid rgba(240,147,251,.15);
          box-shadow: 
            0 20px 60px rgba(0,0,0,.6),
            0 0 0 1px rgba(240,147,251,.1) inset,
            0 4px 20px rgba(240,147,251,.15);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .class-hero-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          opacity: 0.9;
        }
        
        .class-hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          align-items: stretch;
          justify-content: center;
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          padding: 2rem 0;
        }
        
        .class-hero-content > div:first-child {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 1rem;
        }
        
        .class-hero-content > div:last-child {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          gap: 1rem;
        }
        
        @media (max-width: 768px) {
          .class-hero-content > div:first-child {
            gap: 0.875rem !important;
          }
          .class-hero-content > div:last-child {
            gap: 0.875rem !important;
            margin-top: 0.5rem !important;
          }
        }
        
        .class-title {
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 900;
          margin-bottom: 1.25rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: #fff;
        }
        
        @media (max-width: 1024px) {
          .class-hero-content {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .class-hero-banner {
            min-height: auto !important;
          }
        }
        
        @media (max-width: 768px) {
          .date-public-root { 
            padding: 12px 0 !important; 
          }
          .date-public-inner { 
            padding: 0 12px !important; 
          }
          .class-hero-banner { 
            padding: 1.5rem 1rem !important;
            min-height: auto !important;
            border-radius: 20px !important;
            margin-bottom: 1.5rem !important;
          }
          .class-hero-content { 
            gap: 1.25rem !important;
            padding: 1rem 0 !important;
          }
          .class-title {
            font-size: 2.2rem !important;
            margin-bottom: 1rem !important;
          }
          .chip {
            padding: 0.5rem 0.8rem !important;
            font-size: 0.85rem !important;
          }
          .class-back-button {
            padding: 0.6rem 1rem !important;
            font-size: 0.85rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .date-public-root { 
            padding: 8px 0 !important; 
          }
          .date-public-inner { 
            padding: 0 8px !important; 
          }
          .class-hero-banner { 
            padding: 1.25rem 0.75rem !important;
            min-height: auto !important;
            border-radius: 16px !important;
            margin-bottom: 1rem !important;
          }
          .class-hero-content { 
            gap: 1rem !important;
            padding: 0.75rem 0 !important;
          }
          .class-title { 
            font-size: 1.9rem !important;
            margin-bottom: 0.875rem !important;
          }
          .chip {
            padding: 0.45rem 0.7rem !important;
            font-size: 0.8rem !important;
          }
        }
        
        @media (max-width: 430px) {
          .date-public-root { 
            padding: 4px 0 !important; 
          }
          .date-public-inner { 
            padding: 0 2px !important; 
          }
          .class-hero-banner { 
            padding: 0.875rem 0.5rem !important;
            border-radius: 12px !important;
            margin-bottom: 0.75rem !important;
            min-height: auto !important;
            border-width: 1px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,.4) !important;
          }
          .class-hero-content { 
            gap: 0.875rem !important;
            padding: 0.5rem 0 !important;
          }
          .class-hero-content > div:first-child {
            gap: 0.625rem !important;
          }
          .class-title { 
            font-size: 1.5rem !important; 
            margin-bottom: 0.625rem !important;
            line-height: 1.3 !important;
            letter-spacing: -0.02em !important;
          }
          .chip {
            padding: 0.35rem 0.6rem !important;
            font-size: 0.7rem !important;
            border-radius: 8px !important;
            gap: 0.3rem !important;
            border-width: 1px !important;
            font-weight: 600 !important;
          }
          .glass-card-container {
            padding: 0.875rem !important;
            border-radius: 12px !important;
            margin-bottom: 0.75rem !important;
          }
          .card {
            padding: 0.65rem !important;
            border-radius: 10px !important;
          }
          .btn {
            padding: 0.5rem 0.85rem !important;
            font-size: 0.75rem !important;
            gap: 0.4rem !important;
            border-radius: 18px !important;
            font-weight: 700 !important;
          }
          .loc-item {
            padding: 0.65rem !important;
            border-radius: 12px !important;
            gap: 0.5rem !important;
          }
          .loc-item-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 1rem !important;
            border-radius: 8px !important;
          }
          .loc-item-content strong {
            font-size: 0.8rem !important;
          }
          .loc-item-content span {
            font-size: 0.75rem !important;
            line-height: 1.3 !important;
          }
          .loc-grid {
            gap: 0.6rem !important;
            margin-bottom: 0.75rem !important;
            grid-template-columns: 1fr !important;
          }
          .divider {
            margin: 0.4rem 0 !important;
          }
          .actions {
            gap: 0.5rem !important;
            flex-direction: column !important;
          }
          .actions .btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .ur-col {
            gap: 0.6rem !important;
          }
          /* Botón Volver optimizado para móvil */
          .class-back-button-container {
            margin-bottom: 0.625rem !important;
          }
          .class-back-button {
            padding: 0.45rem 0.85rem !important;
            font-size: 0.75rem !important;
            border-radius: 14px !important;
            border-width: 1.5px !important;
          }
          /* Botones de acción en columna en móvil */
          .class-action-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
            margin-bottom: 0.625rem !important;
          }
          .class-action-buttons a,
          .class-action-buttons > div {
            width: 100% !important;
          }
          .btn-maps-inline {
            justify-content: center !important;
            padding: 0.5rem 0.85rem !important;
            font-size: 0.75rem !important;
            border-radius: 18px !important;
            border-width: 1px !important;
          }
          .class-action-buttons > div {
            width: 100% !important;
          }
          .class-action-buttons > div > div {
            width: 100% !important;
          }
          /* Chips en mejor distribución */
          .class-chips-container {
            gap: 0.5rem !important;
            margin-bottom: 0.875rem !important;
            flex-wrap: wrap !important;
          }
          /* Columna 2 (creador) optimizada */
          .class-creator-section {
            gap: 0.625rem !important;
            margin-top: 0.5rem !important;
            width: 100% !important;
          }
          .class-creator-info {
            padding: 0.625rem 0.75rem !important;
            border-radius: 12px !important;
            max-width: 100% !important;
          }
          .class-creator-info a {
            font-size: 0.85rem !important;
            line-height: 1.4 !important;
          }
          .class-creator-section > div:last-child {
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Optimizar efectos decorativos en móvil */
          .class-hero-banner > div:first-child {
            opacity: 0.5 !important;
          }
          /* Asegurar que el contenido no se desborde */
          .class-hero-content {
            overflow: visible !important;
          }
          .class-hero-content > div:first-child,
          .class-hero-content > div:last-child {
            min-width: 0 !important;
            max-width: 100% !important;
          }
        }
        
        @media (max-width: 360px) {
          .class-title {
            font-size: 1.35rem !important;
          }
          .chip {
            padding: 0.3rem 0.5rem !important;
            font-size: 0.65rem !important;
          }
          .class-back-button {
            padding: 0.4rem 0.75rem !important;
            font-size: 0.7rem !important;
          }
          .btn-maps-inline {
            padding: 0.45rem 0.75rem !important;
            font-size: 0.7rem !important;
          }
        }
        
        .chip {
          display:inline-flex;
          align-items:center;
          gap:.45rem;
          padding:.55rem .95rem;
          border-radius:12px;
          font-weight:700;
          font-size:.92rem;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.12);
          color:#f4f4f5;
          box-shadow:0 6px 18px rgba(0,0,0,0.18);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .chip-date { 
          background:linear-gradient(135deg, rgba(240,147,251,.18), rgba(152,71,255,0.16));
          border-color:rgba(240,147,251,.38);
          color:#f5d6ff;
        }
        .chip-time {
          background:linear-gradient(135deg, rgba(255,209,102,.18), rgba(255,159,67,0.14));
          border-color:rgba(255,209,102,.38);
          color:#FFE6A8;
        }
        .chip-cost {
          background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
          border-color:rgba(30,136,229,0.32);
          color:#d4f0ff;
        }
        .chip-location {
          background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
          border-color:rgba(30,136,229,0.32);
          color:#d4f0ff;
        }
        .chip-level {
          background:linear-gradient(135deg, rgba(30,136,229,0.18), rgba(240,147,251,0.16));
          border-color:rgba(30,136,229,0.35);
          color:#e5edff;
        }
        .glass-card-container {
          margin-bottom: 2rem; padding: 2rem;
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          border-radius: 22px; border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 10px 32px rgba(0,0,0,.4); backdrop-filter: blur(10px);
        }
        .ur-col { display:grid; grid-template-columns: 1fr; gap: 1rem; }
        .card{border-radius:14px;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)}
        .loc{border-color:rgba(240,147,251,0.22);background:linear-gradient(135deg,rgba(240,147,251,.08),rgba(240,147,251,.04))}
        .loc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.25rem}
        .loc-item{display:flex;align-items:flex-start;gap:.75rem;padding:1rem;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);box-shadow:0 10px 24px rgba(0,0,0,0.18)}
        .loc-item-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:1.35rem;background:linear-gradient(135deg,rgba(240,147,251,0.22),rgba(240,147,251,0.08));border:1px solid rgba(240,147,251,0.32);color:#f5d6ff}
        .loc-item-content{display:flex;flex-direction:column;gap:.25rem}
        .loc-item-content strong{font-size:.95rem;color:#fff;letter-spacing:.01em}
        .loc-item-content span{font-size:.9rem;color:rgba(255,255,255,.78);line-height:1.45}
        .muted{color:rgba(255,255,255,.72)}
        .divider{height:1px;background:rgba(255,255,255,.12);margin:.75rem 0}
        .actions{display:flex;gap:.75rem;flex-wrap:wrap}
        .btn{display:inline-flex;align-items:center;gap:.55rem;padding:.6rem .95rem;border-radius:999px;font-weight:800;letter-spacing:.01em}
        .btn-maps{border:1px solid rgba(240,147,251,.4);color:#f7d9ff; background:radial-gradient(120% 120% at 0% 0%,rgba(240,147,251,.18),rgba(240,147,251,.08)); box-shadow:0 6px 18px rgba(240,147,251,.20) }
        .btn-copy{border:1px solid rgba(255,255,255,.18);color:#fff;background:rgba(255,255,255,.06)}
      `}</style>
      <div className="date-public-inner">
        {/* Hero Banner */}
        <motion.div
          className="class-hero-banner"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          {/* Efectos decorativos de fondo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(30,136,229,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(240,147,251,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <div className="class-hero-content">
            {/* Columna 1: Info de la clase */}
            <div>
              <div className="class-back-button-container" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', width: '100%' }}>
                <motion.button
                  className="class-back-button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(creatorLink)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: 999,
                    border: '2px solid rgba(240,147,251,0.3)',
                    background: 'rgba(240,147,251,0.15)',
                    color: '#f093fb',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 8px 20px rgba(240,147,251,.25)'
                  }}
                >
                  ← Volver
                </motion.button>
              </div>
              
              <h1 className="class-title" style={{ textAlign: 'left' }}>
                {classTitle}
              </h1>

              {/* Chips de fecha/día, horario, costo, ubicación y nivel */}
              <div className="class-chips-container" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', width: '100%' }}>
                {/* Chip de fecha o día */}
                {(() => {
                  if (selectedClass?.fecha) {
                    // Fecha específica - parsear como hora local para evitar problemas de zona horaria
                    const fechaDate = (() => {
                      const fechaValue = selectedClass.fecha;
                      // Si la fecha ya incluye hora, extraer solo la parte de fecha
                      const fechaOnly = fechaValue.includes('T') ? fechaValue.split('T')[0] : fechaValue;
                      const [year, month, day] = fechaOnly.split('-').map(Number);
                      // Crear fecha en hora local (no UTC) para evitar mostrar día anterior
                      return new Date(year, month - 1, day);
                    })();
                    const fechaStr = fechaDate.toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    });
                    return (
                      <span className="chip chip-date">
                        📅 {fechaStr}
                      </span>
                    );
                  } else if (diaParam !== null) {
                    // Si hay un parámetro de día específico en la URL, mostrar solo ese día
                    const diaNum = Number(diaParam);
                    if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const dayName = dayNames[diaNum] || 'Día no especificado';
                      return (
                        <span className="chip chip-date">
                          📅 {dayName}
                        </span>
                      );
                    }
                  } else if (diaParam !== null) {
                    // Si hay un parámetro de día específico en la URL, mostrar solo ese día
                    const diaNum = Number(diaParam);
                    if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const dayName = dayNames[diaNum] || 'Día no especificado';
                      return (
                        <span className="chip chip-date">
                          📅 {dayName}
                        </span>
                      );
                    }
                  } else if (selectedClass?.diaSemana !== undefined && selectedClass?.diaSemana !== null) {
                    // Día de la semana
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dayName = dayNames[selectedClass.diaSemana] || 'Día no especificado';
                    return (
                      <span className="chip chip-date">
                        📅 {dayName}
                      </span>
                    );
                  } else if (Array.isArray(selectedClass?.diasSemana) && selectedClass.diasSemana.length > 0) {
                    // Múltiples días - convertir números/strings a nombres de días
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dayNameMap: Record<string, string> = {
                      'domingo': 'Domingo', 'dom': 'Domingo',
                      'lunes': 'Lunes', 'lun': 'Lunes',
                      'martes': 'Martes', 'mar': 'Martes',
                      'miércoles': 'Miércoles', 'miercoles': 'Miércoles', 'mié': 'Miércoles', 'mie': 'Miércoles',
                      'jueves': 'Jueves', 'jue': 'Jueves',
                      'viernes': 'Viernes', 'vie': 'Viernes',
                      'sábado': 'Sábado', 'sabado': 'Sábado', 'sáb': 'Sábado', 'sab': 'Sábado',
                    };
                    const diasLegibles = selectedClass.diasSemana.map((d: string | number) => {
                      if (typeof d === 'number' && d >= 0 && d <= 6) {
                        return dayNames[d];
                      }
                      if (typeof d === 'string') {
                        return dayNameMap[d.toLowerCase()] || d;
                      }
                      return null;
                    }).filter((d: string | null) => d !== null);
                    return (
                      <span className="chip chip-date">
                        📅 {diasLegibles.join(', ')}
                      </span>
                    );
                  }
                  return null;
                })()}
                
                {scheduleLabel && (
                  <span className="chip chip-time">🕒 {scheduleLabel}</span>
                )}
                {costLabel && (
                  <span className="chip chip-cost">💰 {costLabel}</span>
                )}
                {locationLabel && (
                  <span className="chip chip-location">📍 {locationLabel}</span>
                )}
                {selectedClass?.nivel && (
                  <span className="chip chip-level">
                    🎯 {selectedClass.nivel}
                  </span>
                )}
              </div>

              {/* Botones de acción */}
              <div className="class-action-buttons" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', width: '100%' }}>
                {/* Botón Ver en Maps */}
                {ubicacion && (ubicacion.direccion || ubicacion.nombre || ubicacion.ciudad) && (
                  <motion.a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ubicacion.nombre ?? ''} ${ubicacion.direccion ?? ''} ${ubicacion.ciudad ?? ''}`.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-maps-inline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.55rem',
                      padding: '.6rem 1.1rem',
                      borderRadius: 999,
                      border: '1px solid rgba(240,147,251,.4)',
                      color: '#f7d9ff',
                      background: 'radial-gradient(120% 120% at 0% 0%, rgba(240,147,251,.18), rgba(240,147,251,.08))',
                      boxShadow: '0 6px 18px rgba(240,147,251,.20)',
                      fontWeight: 800,
                      fontSize: '.9rem',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>📍</span>
                    <span>Ver en Maps</span>
                    <span aria-hidden style={{ fontSize: '.85rem' }}>↗</span>
                  </motion.a>
                )}

                {/* Botón WhatsApp (solo para academias con WhatsApp configurado y usuarios logueados) */}
                {user && whatsappNumber && (
                  <motion.a
                    href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, classTitle) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.55rem',
                      padding: '.6rem 1.1rem',
                      borderRadius: 999,
                      border: '1px solid rgba(37, 211, 102, 0.5)',
                      color: '#fff',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      boxShadow: '0 6px 18px rgba(37, 211, 102, 0.3)',
                      fontWeight: 800,
                      fontSize: '.9rem',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaWhatsapp size={18} />
                    <span>Consultar por WhatsApp</span>
                  </motion.a>
                )}

                {/* Botón de Pago (Stripe) - solo requiere precio > 0 y stripe_account_id */}
                {typeof classPrice === 'number' && classPrice > 0 && !!profile?.stripe_account_id && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePayClick}
                    disabled={createCheckout.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.55rem',
                      padding: '.6rem 1.1rem',
                      borderRadius: 999,
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      color: '#fff',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      boxShadow: '0 6px 18px rgba(34, 197, 94, 0.3)',
                      fontWeight: 800,
                      fontSize: '.9rem',
                      cursor: createCheckout.isPending ? 'not-allowed' : 'pointer',
                      opacity: createCheckout.isPending ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>💳</span>
                    <span>
                      {createCheckout.isPending
                        ? 'Procesando...'
                        : `Pagar ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                            classPrice,
                          )}`}
                    </span>
                  </motion.button>
                )}

                {/* Botón de Agregar a Calendario */}
                {selectedClass && (
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <AddToCalendarWithStats
                      eventId={classUniqueId || idNum}
                      classId={classUniqueId || undefined}
                      academyId={!isTeacher ? profile?.id : undefined}
                      teacherId={isTeacher ? profile?.id : undefined}
                      roleBaile={userProfile?.rol_baile || null}
                      zonaTagId={selectedClass?.ubicacionJson?.zona_tag_id || profile?.zonas?.[0] || (userProfile?.zonas?.[0] || null)}
                      title={classTitle}
                      description={`Clase de ${classTitle} con ${creatorName}`}
                      location={locationLabel}
                      fecha={selectedClass?.fecha || null}
                      diaSemana={(() => {
                        // Si hay un parámetro dia en la URL, usar ese día específico
                        if (diaParam !== null) {
                          const diaNum = Number(diaParam);
                          if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                            return diaNum;
                          }
                        }
                        // Si no, usar el diaSemana de la clase
                        return selectedClass?.diaSemana ?? selectedClass?.dia_semana ?? null;
                      })()}
                      diasSemana={(() => {
                        // Si hay un parámetro dia en la URL, no pasar diasSemana (solo ese día específico)
                        if (diaParam !== null) {
                          const diaNum = Number(diaParam);
                          if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                            return null; // No pasar diasSemana, solo diaSemana con el día específico
                          }
                        }
                        // Si no hay parámetro dia, usar la lógica normal
                        if (selectedClass?.diasSemana && Array.isArray(selectedClass.diasSemana)) {
                          const dayMap: Record<string, number> = {
                            'domingo': 0, 'dom': 0,
                            'lunes': 1, 'lun': 1,
                            'martes': 2, 'mar': 2,
                            'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                            'jueves': 4, 'jue': 4,
                            'viernes': 5, 'vie': 5,
                            'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                          };
                          const dias = selectedClass.diasSemana
                            .map((d: string) => dayMap[String(d).toLowerCase().trim()])
                            .filter((d: number | undefined) => d !== undefined) as number[];
                          return dias.length > 0 ? dias : null;
                        }
                        return null;
                      })()}
                      start={(() => {
                        try {
                          // Función auxiliar para normalizar hora
                          const normalizeTime = (timeStr: string | null | undefined, defaultTime: string): string => {
                            if (!timeStr || typeof timeStr !== 'string') return defaultTime;
                            const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
                            if (timeMatch) {
                              const hours = parseInt(timeMatch[1], 10);
                              const minutes = parseInt(timeMatch[2], 10);
                              if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                              }
                            }
                            return defaultTime;
                          };
                          
                          if (selectedClass.fecha) {
                            const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                            const hora = normalizeTime(selectedClass.inicio, '20:00');
                            // Usar fecha local en lugar de string ISO para evitar problemas de zona horaria
                            const [year, month, day] = fechaStr.split('-').map(Number);
                            const [hour, minute] = hora.split(':').map(Number);
                            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
                              const date = new Date(year, month - 1, day, hour, minute, 0, 0);
                              console.log('[ClassPublicScreen] ✅ Start date construida:', {
                                fechaStr,
                                hora,
                                date: date.toISOString(),
                                local: date.toLocaleString()
                              });
                              return date;
                            }
                            return new Date(`${fechaStr}T${hora}:00`);
                          }
                          // Si es clase semanal, calcular próxima ocurrencia
                          // Priorizar: 1) día de URL, 2) diaSemana/dia_semana específico, 3) primer día de diasSemana
                          const diaParaCalcular = (() => {
                            // 1. Si hay parámetro dia en la URL, usar ese día específico
                            if (diaParam !== null) {
                              const diaNum = Number(diaParam);
                              if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                                console.log('[ClassPublicScreen] 📅 Usando día de URL:', diaNum);
                                return diaNum;
                              }
                            }
                            
                            // 2. Priorizar diaSemana o dia_semana (día específico de esta clase expandida)
                            if (selectedClass?.diaSemana !== null && selectedClass?.diaSemana !== undefined && typeof selectedClass.diaSemana === 'number' && selectedClass.diaSemana >= 0 && selectedClass.diaSemana <= 6) {
                              console.log('[ClassPublicScreen] 📅 Usando diaSemana específico:', selectedClass.diaSemana);
                              return selectedClass.diaSemana;
                            }
                            if (selectedClass?.dia_semana !== null && selectedClass?.dia_semana !== undefined && typeof selectedClass.dia_semana === 'number' && selectedClass.dia_semana >= 0 && selectedClass.dia_semana <= 6) {
                              console.log('[ClassPublicScreen] 📅 Usando dia_semana específico:', selectedClass.dia_semana);
                              return selectedClass.dia_semana;
                            }
                            
                            // 3. Si tiene múltiples días, usar el primer día
                            if (selectedClass?.diasSemana && Array.isArray(selectedClass.diasSemana) && selectedClass.diasSemana.length > 0) {
                              const dayMap: Record<string, number> = {
                                'domingo': 0, 'dom': 0,
                                'lunes': 1, 'lun': 1,
                                'martes': 2, 'mar': 2,
                                'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                                'jueves': 4, 'jue': 4,
                                'viernes': 5, 'vie': 5,
                                'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                              };
                              const firstDay = selectedClass.diasSemana[0];
                              if (typeof firstDay === 'number' && firstDay >= 0 && firstDay <= 6) {
                                console.log('[ClassPublicScreen] 📅 Usando primer día de diasSemana (número):', firstDay);
                                return firstDay;
                              }
                              if (typeof firstDay === 'string') {
                                const dayNum = dayMap[firstDay.toLowerCase().trim()];
                                if (dayNum !== undefined) {
                                  console.log('[ClassPublicScreen] 📅 Usando primer día de diasSemana (string):', firstDay, '->', dayNum);
                                  return dayNum;
                                }
                              }
                            }
                            
                            console.warn('[ClassPublicScreen] ⚠️ No se pudo determinar el día para calcular:', {
                              diaParam,
                              diaSemana: selectedClass?.diaSemana,
                              dia_semana: selectedClass?.dia_semana,
                              diasSemana: selectedClass?.diasSemana
                            });
                            return null;
                          })();
                          
                          if (diaParaCalcular !== null && typeof diaParaCalcular === 'number') {
                            const hora = normalizeTime(selectedClass.inicio, '20:00');
                            const date = calculateNextDateWithTime(diaParaCalcular, hora);
                            console.log('[ClassPublicScreen] ✅ Start date calculada (semanal):', {
                              diaParaCalcular,
                              hora,
                              date: date.toISOString(),
                              local: date.toLocaleString(),
                              diaSemana: selectedClass?.diaSemana,
                              dia_semana: selectedClass?.dia_semana,
                              diasSemana: selectedClass?.diasSemana
                            });
                            return date;
                          }
                          
                          // Fallback: usar fecha/hora actual
                          const now = new Date();
                          const hora = normalizeTime(selectedClass.inicio, '20:00');
                          const [hour, minute] = hora.split(':').map(Number);
                          now.setHours(hour, minute, 0, 0);
                          return now;
                        } catch {
                          return new Date();
                        }
                      })()}
                      end={(() => {
                        try {
                          // Función auxiliar para normalizar hora
                          const normalizeTime = (timeStr: string | null | undefined, defaultTime: string): string => {
                            if (!timeStr || typeof timeStr !== 'string') return defaultTime;
                            const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
                            if (timeMatch) {
                              const hours = parseInt(timeMatch[1], 10);
                              const minutes = parseInt(timeMatch[2], 10);
                              if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                              }
                            }
                            return defaultTime;
                          };
                          
                          if (selectedClass.fecha) {
                            const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                            const hora = normalizeTime(selectedClass.fin || selectedClass.inicio, '22:00');
                            // Usar fecha local en lugar de string ISO para evitar problemas de zona horaria
                            const [year, month, day] = fechaStr.split('-').map(Number);
                            const [hour, minute] = hora.split(':').map(Number);
                            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
                              const date = new Date(year, month - 1, day, hour, minute, 0, 0);
                              console.log('[ClassPublicScreen] ✅ End date construida:', {
                                fechaStr,
                                hora,
                                date: date.toISOString(),
                                local: date.toLocaleString()
                              });
                              return date;
                            }
                            return new Date(`${fechaStr}T${hora}:00`);
                          }
                          // Si es clase semanal, calcular próxima ocurrencia
                          // Priorizar: 1) día de URL, 2) diaSemana/dia_semana específico, 3) primer día de diasSemana
                          const diaParaCalcular = (() => {
                            // 1. Si hay parámetro dia en la URL, usar ese día específico
                            if (diaParam !== null) {
                              const diaNum = Number(diaParam);
                              if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                                return diaNum;
                              }
                            }
                            
                            // 2. Priorizar diaSemana o dia_semana (día específico de esta clase expandida)
                            if (selectedClass?.diaSemana !== null && selectedClass?.diaSemana !== undefined && typeof selectedClass.diaSemana === 'number' && selectedClass.diaSemana >= 0 && selectedClass.diaSemana <= 6) {
                              return selectedClass.diaSemana;
                            }
                            if (selectedClass?.dia_semana !== null && selectedClass?.dia_semana !== undefined && typeof selectedClass.dia_semana === 'number' && selectedClass.dia_semana >= 0 && selectedClass.dia_semana <= 6) {
                              return selectedClass.dia_semana;
                            }
                            
                            // 3. Si tiene múltiples días, usar el primer día
                            if (selectedClass?.diasSemana && Array.isArray(selectedClass.diasSemana) && selectedClass.diasSemana.length > 0) {
                              const dayMap: Record<string, number> = {
                                'domingo': 0, 'dom': 0,
                                'lunes': 1, 'lun': 1,
                                'martes': 2, 'mar': 2,
                                'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                                'jueves': 4, 'jue': 4,
                                'viernes': 5, 'vie': 5,
                                'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                              };
                              const firstDay = selectedClass.diasSemana[0];
                              if (typeof firstDay === 'number' && firstDay >= 0 && firstDay <= 6) {
                                return firstDay;
                              }
                              if (typeof firstDay === 'string') {
                                const dayNum = dayMap[firstDay.toLowerCase().trim()];
                                if (dayNum !== undefined) return dayNum;
                              }
                            }
                            
                            return null;
                          })();
                          
                          if (diaParaCalcular !== null && typeof diaParaCalcular === 'number') {
                            const hora = normalizeTime(selectedClass.fin || selectedClass.inicio, '22:00');
                            const startDate = calculateNextDateWithTime(diaParaCalcular, normalizeTime(selectedClass.inicio, '20:00'));
                            const endDate = new Date(startDate);
                            const [horaFin, minutoFin] = hora.split(':').map(Number);
                            if (!isNaN(horaFin) && !isNaN(minutoFin)) {
                              endDate.setHours(horaFin, minutoFin, 0, 0);
                              // Si la hora de fin es menor o igual a la de inicio, agregar 2 horas
                              if (endDate.getTime() <= startDate.getTime()) {
                                endDate.setHours(startDate.getHours() + 2);
                              }
                              console.log('[ClassPublicScreen] ✅ End date calculada (semanal):', {
                                diaParaCalcular,
                                hora,
                                startDate: startDate.toISOString(),
                                endDate: endDate.toISOString(),
                                local: endDate.toLocaleString(),
                                diaSemana: selectedClass?.diaSemana,
                                dia_semana: selectedClass?.dia_semana,
                                diasSemana: selectedClass?.diasSemana
                              });
                              return endDate;
                            }
                            // Fallback si la hora no es válida
                            endDate.setHours(startDate.getHours() + 2);
                            return endDate;
                          }
                          
                          // Fallback: usar fecha/hora actual
                          const now = new Date();
                          const hora = normalizeTime(selectedClass.fin || selectedClass.inicio, '22:00');
                          const [hour, minute] = hora.split(':').map(Number);
                          now.setHours(hour, minute, 0, 0);
                          return now;
                        } catch {
                          const end = new Date();
                          end.setHours(end.getHours() + 2);
                          return end;
                        }
                      })()}
                      showAsIcon={false}
                    />
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Columna 2: Creada por + Card del creador */}
            <div className="class-creator-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div className="class-creator-info" style={{ 
                padding: '1rem 1.25rem',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.12)',
                background: 'rgba(255,255,255,.05)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '350px'
              }}>
                {/* <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,.7)', marginBottom: '.5rem' }}>
                  Creada por
                </p> */}
                <Link to={creatorLink} style={{ 
                  color: '#FFD166', 
                  fontWeight: 900, 
                  fontSize: '1.1rem',
                  textDecoration: 'none', 
                  borderBottom: '2px solid rgba(255,209,102,0.5)',
                  paddingBottom: '2px',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}>
                  {creatorTypeLabel} · {creatorName}
                </Link>
              </div>
              
              <div style={{ width: '100%', maxWidth: '350px' }}>
                {isTeacher ? (
                  <TeacherCard item={profile} />
                ) : (
                  <AcademyCard item={profile} />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clases, horarios, costos y agregar a calendario - COMENTADO */}
        {/* <motion.section 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.25 }} 
          className="glass-card-container"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
              boxShadow: '0 10px 28px rgba(30,136,229,.4)',
              fontSize: '1.25rem',
              border: '2px solid rgba(30,136,229,.3)'
            }}>📚</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Detalles de la Clase</h3>
          </div>
          
          <ClasesLive 
            title="" 
            cronograma={cronogramaSelected} 
            costos={costos} 
            ubicacion={ubicacion as any} 
            showCalendarButton={true}
            sourceType={sourceType}
            sourceId={idNum}
            isClickable={false}
          />
        </motion.section> */}
      </div>
      </div>
    </>
  );
}


