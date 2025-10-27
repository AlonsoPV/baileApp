import React from "react";
import { motion } from "framer-motion";
// ProfileToolbar removido: usamos el toggle unificado
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import '@/styles/organizer.css';
import { useNavigate } from "react-router-dom";
import ChipPicker from "../../components/common/ChipPicker";
import FAQEditor from "../../components/common/FAQEditor";
import { MediaUploader } from "../../components/MediaUploader";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import { useTeacherMy, useUpsertTeacher } from "@/hooks/useTeacher";

const colors = {
  green: '#43e97b',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function TeacherProfileEditor() {
  const navigate = useNavigate();
  const { data: teacher } = useTeacherMy();
  const upsert = useUpsertTeacher();
  const [form, setForm] = React.useState({
    nombre_publico: "",
    bio: "",
    ritmos: [] as number[],
    zonas: [] as number[],
    redes_sociales: {} as any,
    media: [] as any[],
    faq: [] as any[],
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
      });
    }
  }, [teacher]);

  return (
    <div className="org-editor" style={{ minHeight: '100vh', background: '#000000', color: '#F5F5F5', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div className="org-editor__header">
          <button className="org-editor__back" onClick={() => navigate(-1)}>← Volver</button>
          <h1 className="org-editor__title" style={{ margin: 0 }}>✏️ Editar Maestro</h1>
          <div style={{ width: 100 }} />
        </div>

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
              media: form.media,
              faq: form.faq,
            });
            if (teacher?.id) navigate(`/maestro/${teacher.id}`);
          }}
          isSaving={upsert.isPending}
          saveDisabled={!form.nombre_publico}
        />

        {/* Toolbar antigua removida */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header básico */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="org-editor__card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <input
                placeholder="Nombre público"
                value={form.nombre_publico}
                onChange={(e)=>setField('nombre_publico', e.target.value)}
                style={{ padding: '12px', borderRadius: 12, border: '1px solid #2a2a2a', background: '#111', color: '#fff' }}
              />
              <textarea
                placeholder="Biografía"
                rows={3}
                value={form.bio}
                onChange={(e)=>setField('bio', e.target.value)}
                style={{ padding: '12px', borderRadius: 12, border: '1px solid #2a2a2a', background: '#111', color: '#fff' }}
              />
            </div>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>🔗 Redes</h3>
            <SocialMediaSection availablePlatforms={[ 'instagram','tiktok','youtube','facebook','whatsapp' ]}
              respuestas={{ redes: form.redes_sociales }}
            />
          </motion.div>

          {/* Media */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="org-editor__card">
            <h3 style={{ margin: 0, marginBottom: 12 }}>📸 Media</h3>
            <MediaUploader onPick={(files)=>{
              const next = Array.from(files).map(f=>({ type: f.type.startsWith('video')?'video':'image', url: URL.createObjectURL(f) }));
              setField('media', [...form.media, ...next]);
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 12, marginTop: 12 }}>
              {form.media.map((m, i)=> (
                <div key={i} style={{ aspectRatio: '1', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
                  {m.type==='image' ? (
                    <img src={m.url} alt="media" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  ) : (
                    <video src={m.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

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
                  media: form.media,
                  faq: form.faq,
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

