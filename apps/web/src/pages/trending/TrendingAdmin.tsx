import React from "react";
import {
  listTrendings,
  adminCreateTrending,
  adminPublishTrending,
  adminCloseTrending,
  adminAddRitmo,
  adminAddCandidate,
} from "@/lib/trending";
import { supabase } from "@/lib/supabase";
import "@/styles/event-public.css";
import RitmosChips from "@/components/RitmosChips";

type Mode = "per_candidate" | "per_ritmo";

export default function TrendingAdmin() {
  const [canAdmin, setCanAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<any[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startsAt, setStartsAt] = React.useState<string>("");
  const [endsAt, setEndsAt] = React.useState<string>("");
  const [mode, setMode] = React.useState<Mode>("per_candidate");
  const [creating, setCreating] = React.useState(false);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [ritmosSel, setRitmosSel] = React.useState<string[]>([]);
  // Listas de usuarios
  const [list1Ritmo, setList1Ritmo] = React.useState<string>("");
  const [list1UserIds, setList1UserIds] = React.useState<string>("");
  const [list2Ritmo, setList2Ritmo] = React.useState<string>("");
  const [list2UserIds, setList2UserIds] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setCanAdmin(false); return; }
        const { data: roles } = await supabase.from('user_roles').select('role_slug').eq('user_id', user.id);
        const slugs = (roles || []).map((r: any) => r.role_slug);
        setCanAdmin(slugs.includes('superadmin'));
      } finally {
        // no-op
      }
    })();
  }, []);

  const reload = React.useCallback(async (st?: string) => {
    setLoading(true);
    try {
      const data = await listTrendings(st as any);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { reload(statusFilter || undefined); }, [reload, statusFilter]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdmin) return;
    setCreating(true);
    try {
      // Subir portada si aplica
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const key = `trending-covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(key, coverFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('media').getPublicUrl(key);
        coverUrl = pub.publicUrl;
      }
      const id = await adminCreateTrending({
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        allowed_vote_mode: mode,
        cover_url: coverUrl,
      });
      // Guardar ritmos seleccionados
      for (const slug of ritmosSel) {
        await adminAddRitmo(id, slug);
      }
      // Procesar listas de usuarios pegadas
      const parseIds = (txt: string) => Array.from(new Set(txt.split(/[,\n\s]+/).map(s => s.trim()).filter(Boolean)));
      const l1 = parseIds(list1UserIds);
      const l2 = parseIds(list2UserIds);
      for (const uid of l1) {
        if (list1Ritmo) await adminAddCandidate({ trendingId: id, ritmoSlug: list1Ritmo, userId: uid });
      }
      for (const uid of l2) {
        if (list2Ritmo) await adminAddCandidate({ trendingId: id, ritmoSlug: list2Ritmo, userId: uid });
      }

      setTitle(""); setDescription(""); setStartsAt(""); setEndsAt(""); setMode("per_candidate"); setCoverFile(null); setRitmosSel([]); setList1Ritmo(""); setList1UserIds(""); setList2Ritmo(""); setList2UserIds("");
      await reload(statusFilter || undefined);
      alert(`Trending creado: #${id}`);
    } catch (err: any) {
      alert(err?.message || 'No se pudo crear');
    } finally {
      setCreating(false);
    }
  };

  const doPublish = async (id: number) => {
    if (!canAdmin) return;
    try { await adminPublishTrending(id); await reload(statusFilter || undefined); } catch (e: any) { alert(e.message || 'Error'); }
  };
  const doClose = async (id: number) => {
    if (!canAdmin) return;
    try { await adminCloseTrending(id); await reload(statusFilter || undefined); } catch (e: any) { alert(e.message || 'Error'); }
  };

  return (
    <div className="cc-page">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
        {/* Header */}
        <section className="cc-glass" style={{ padding: '1rem', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span className="cc-round-ico" style={{ width: 40, height: 40, fontSize: 18 }}>📈</span>
              <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Trending • Admin</h1>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, opacity: .85 }}>Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
                <option value="">Todos</option>
                <option value="draft">draft</option>
                <option value="open">open</option>
                <option value="closed">closed</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
        </section>

        {/* Crear */}
        <section className="cc-glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Crear trending</h2>
          {!canAdmin && <div style={{ opacity: .85 }}>Necesitas permisos de superadmin.</div>}
          {canAdmin && (
            <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.75rem', maxWidth: 700 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Portada</label>
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Título" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descripción" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmos</label>
                <RitmosChips selected={ritmosSel} onChange={(val: string[]) => setRitmosSel(val)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Inicia</label>
                  <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Termina</label>
                  <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Modo de voto</label>
                <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                  <option value="per_candidate">per_candidate</option>
                  <option value="per_ritmo">per_ritmo</option>
                </select>
              </div>
              {/* Listas de usuarios pegados */}
              <div className="cc-glass" style={{ padding: 12, borderRadius: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: '1rem' }}>Lista de usuarios #1</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmo</label>
                    <input placeholder="slug de ritmo (ej. bachata_tradicional)" value={list1Ritmo} onChange={(e) => setList1Ritmo(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>User IDs (separados por coma o renglón)</label>
                    <textarea rows={3} value={list1UserIds} onChange={(e) => setList1UserIds(e.target.value)} placeholder="uuid1, uuid2, uuid3" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                </div>
              </div>
              <div className="cc-glass" style={{ padding: 12, borderRadius: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: '1rem' }}>Lista de usuarios #2</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmo</label>
                    <input placeholder="slug de ritmo (ej. bachata_tradicional)" value={list2Ritmo} onChange={(e) => setList2Ritmo(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>User IDs (separados por coma o renglón)</label>
                    <textarea rows={3} value={list2UserIds} onChange={(e) => setList2UserIds(e.target.value)} placeholder="uuid1, uuid2, uuid3" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                </div>
              </div>
              <div>
                <button type="submit" disabled={creating} className="cc-btn cc-btn--primary">{creating ? 'Creando…' : 'Crear'}</button>
              </div>
            </form>
          )}
        </section>

        {/* Lista */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          {loading ? (
            <div>Cargando…</div>
          ) : rows.length === 0 ? (
            <div style={{ opacity: .85 }}>Sin elementos</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {rows.map((r) => (
                <div key={r.id} className="cc-glass" style={{ padding: 12, borderRadius: 12, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 900 }}>{r.title}</div>
                    <span className="cc-chip" style={{ textTransform: 'uppercase' }}>{r.status}</span>
                  </div>
                  {r.description && <div className="cc-two-lines" style={{ opacity: .9 }}>{r.description}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, opacity: .9 }}>
                    {r.starts_at && <span>🟢 {new Date(r.starts_at).toLocaleString()}</span>}
                    {r.ends_at && <span>🔴 {new Date(r.ends_at).toLocaleString()}</span>}
                    <span>modo: <b>{r.allowed_vote_mode}</b></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.status === 'draft' && <button className="cc-btn" onClick={() => doPublish(r.id)}>Publicar</button>}
                    {r.status === 'open' && <button className="cc-btn" onClick={() => doClose(r.id)}>Cerrar</button>}
                    <a href={`/trending/${r.id}`} className="cc-btn cc-btn--primary">Abrir</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


