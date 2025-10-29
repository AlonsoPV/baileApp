import React from "react";
import { motion } from "framer-motion";
// ProfileToolbar removido: usamos el toggle unificado
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import '@/styles/organizer.css';
import { useNavigate } from "react-router-dom";
import ChipPicker from "../../components/common/ChipPicker";
import FAQEditor from "../../components/common/FAQEditor";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import UbicacionesEditor from "../../components/academy/UbicacionesEditor";
import { useTeacherMy, useUpsertTeacher } from "@/hooks/useTeacher";
import { useTeacherMedia } from "@/hooks/useTeacherMedia";
import EventInfoGrid from "../../components/events/EventInfoGrid";
import CostosyHorarios from './CostosyHorarios';
import { useTags } from "@/hooks/useTags";
import EditorHeader from "./teacher/editor/EditorHeader";
import BasicInfoForm from "./teacher/editor/BasicInfoForm";
import SocialLinksForm from "./teacher/editor/SocialLinksForm";
import GalleryManager from "./teacher/editor/GalleryManager";
import ClassesManager from "./teacher/editor/ClassesManager";

const colors = {
  green: '#43e97b',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function TeacherProfileEditor() {
  const navigate = useNavigate();
  const { data: teacher } = useTeacherMy();
  const upsert = useUpsertTeacher();
  const teacherMedia = useTeacherMedia();
  const { data: allTags } = useTags();
  const [form, setForm] = React.useState({
    nombre_publico: "",
    bio: "",
    ritmos: [] as number[],
    zonas: [] as number[],
    redes_sociales: {} as any,
    media: [] as any[],
    faq: [] as any[],
    cronograma: [] as any[],
    costos: [] as any[],
  });

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(s => ({ ...s, [k]: v }));
  }

  React.useEffect(() => {
    if (teacher) {
      setForm({
        nombre_publico: teacher.nombre_publico || '',
        bio: teacher.bio || '',
        ritmos: teacher.ritmos || [],
        zonas: teacher.zonas || [],
        redes_sociales: teacher.redes_sociales || {},
        media: teacher.media || [],
        faq: teacher.faq || [],
        cronograma: (teacher as any).cronograma || [],
        costos: (teacher as any).costos || [],
      });
    }
  }, [teacher]);

  return (
    <div className="org-editor" style={{ minHeight: '100vh', background: '#000000', color: '#F5F5F5', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <EditorHeader title="✏️ Editar Maestro" subtitle={form.nombre_publico} />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <ProfileNavigationToggle
          currentView="edit"
          profileType="teacher"
          editHref="/profile/teacher"
          liveHref={teacher?.id ? `/maestro/${teacher.id}` : "/profile/teacher/live"}
          onSave={async ()=>{
            await upsert.mutateAsync({
              id: teacher?.id,
              nombre_publico: form.nombre_publico,
              bio: form.bio,
              ritmos: form.ritmos,
              zonas: form.zonas,
              redes_sociales: form.redes_sociales,
              media: (teacherMedia.media as any[]),
              faq: form.faq,
              ...(form as any).cronograma ? { cronograma: (form as any).cronograma } : {},
              ...(form as any).costos ? { costos: (form as any).costos } : {},
            });
            if (teacher?.id) navigate(`/maestro/${teacher.id}`);
          }}
          isSaving={upsert.isPending}
          saveDisabled={!form.nombre_publico}
        />
        </div>

        {/* Toolbar antigua removida */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Información básica */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="org-editor__card">
            <BasicInfoForm value={{ nombre_publico: form.nombre_publico, bio: form.bio }} onChange={(patch)=>setForm(s=>({ ...s, ...patch }))} />
          </motion.div>

          {/* Clases & Costos */}
          <ClassesManager
            cronograma={(form as any).cronograma || []}
            costos={(form as any).costos || []}
            onCronogramaChange={(v:any)=> setField('cronograma' as any, v as any)}
            onCostosChange={(v:any)=> setField('costos' as any, v as any)}
            ritmos={(allTags||[]).filter((t:any)=>t.tipo==='ritmo').map((t:any)=>({ id: t.id, nombre: t.nombre }))}
            locations={((form as any).ubicaciones||[]).map((u:any)=> u?.nombre || u?.lugar || '').filter(Boolean)}
          />

          {/* Vista previa informativa (2x2) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>🧭 Vista previa de información</h3>
            <style>{`
              .two-col-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
              @media (min-width: 768px) { .two-col-grid { grid-template-columns: 1fr 1fr; } }
            `}</style>
            <EventInfoGrid date={{
              lugar: (form as any)?.ubicaciones?.[0]?.nombre || '',
              direccion: (form as any)?.ubicaciones?.[0]?.direccion || '',
              ciudad: (form as any)?.ubicaciones?.[0]?.ciudad || '',
              referencias: (form as any)?.ubicaciones?.[0]?.referencias || '',
              requisitos: undefined,
              cronograma: (form as any).cronograma || [],
              costos: (form as any).costos || []
            }} />
          </motion.div>

          {/* Vista previa: Costos y Horarios */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>🗓️ Vista previa de horarios y costos</h3>
            <CostosyHorarios
              date={{ cronograma: (form as any).cronograma || [], costos: (form as any).costos || [] }}
              ubicacion={{
                nombre: (form as any)?.ubicaciones?.[0]?.nombre,
                direccion: (form as any)?.ubicaciones?.[0]?.direccion,
                ciudad: (form as any)?.ubicaciones?.[0]?.ciudad,
                referencias: (form as any)?.ubicaciones?.[0]?.referencias,
              }}
            />
          </motion.div>

          {/* Ritmos y Zonas */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>🎵 Ritmos y Zonas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ChipPicker tipo="ritmo" selected={form.ritmos} onChange={(v)=>setField('ritmos', v)} label="Ritmos que enseñas" />
              <ChipPicker tipo="zona" selected={form.zonas} onChange={(v)=>setField('zonas', v)} label="Zonas donde enseñas" />
            </div>
          </motion.div>

          {/* Redes sociales */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="org-editor__card">
            <SocialLinksForm value={form.redes_sociales || {}} onChange={(v)=> setField('redes_sociales', v)} />
          </motion.div>

          {/* Ubicaciones (opcional) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>📍 Ubicaciones</h3>
            <UbicacionesEditor
              value={(form as any).ubicaciones || []}
              onChange={(v:any)=> setField('ubicaciones' as any, v as any)}
            />
          </motion.div>

          {/* Gestión de Media (fotos y videos) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>📸 Media</h3>
            <GalleryManager
              media={teacherMedia.media as any[]}
              onAdd={(file, slot) => teacherMedia.add.mutate({ file, slot })}
              onRemove={(slot) => {
                const item = (teacherMedia.media as any[]).find((m:any)=> m.slot===slot);
                if (item) teacherMedia.remove.mutate(item.id);
              }}
            />
          </motion.div>

          {Array.isArray(teacherMedia.media) && teacherMedia.media.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} id="user-profile-photo-gallery" className="org-editor__card">
              <h3 style={{ margin: 0, marginBottom: 12 }}>📷 Galería</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {(teacherMedia.media as any[]).map((item: any, index: number) => (
                  <div key={index} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                    {item.type === 'image' ? (
                      <img src={item.url} alt={`Imagen ${index+1}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    ) : (
                      <video src={item.url} controls style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* FAQ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '1.5rem', border: `1px solid ${colors.green}33`, borderRadius: '1rem', background: 'rgba(67,233,123,0.06)' }}>
            <h3 style={{ margin: 0, marginBottom: 12 }}>❓ Preguntas Frecuentes</h3>
            <FAQEditor value={form.faq} onChange={(v)=>setField('faq', v)} />
        </motion.div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #2a2a2a', background: 'transparent', color:'#fff' }}>Cancelar</button>
            <button
              onClick={async ()=>{
                await upsert.mutateAsync({
                  id: teacher?.id,
                  nombre_publico: form.nombre_publico,
                  bio: form.bio,
                  ritmos: form.ritmos,
                  zonas: form.zonas,
                  redes_sociales: form.redes_sociales,
                  media: (teacherMedia.media as any[]),
                  faq: form.faq,
                  ...(form as any).cronograma ? { cronograma: (form as any).cronograma } : {},
                  ...(form as any).costos ? { costos: (form as any).costos } : {},
                  ...(form as any).ubicaciones ? { ubicaciones: (form as any).ubicaciones } : {},
                });
              }}
              style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#2e7d32', color:'#fff', fontWeight: 700 }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

