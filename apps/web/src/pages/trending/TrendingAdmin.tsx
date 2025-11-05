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
  const [list1Name, setList1Name] = React.useState<string>("");
  const [list1Ritmo, setList1Ritmo] = React.useState<string>("");
  const [list1Selected, setList1Selected] = React.useState<{id:string; name:string}[]>([]);
  const [list1Search, setList1Search] = React.useState<string>("");
  const [list2Name, setList2Name] = React.useState<string>("");
  const [list2Ritmo, setList2Ritmo] = React.useState<string>("");
  const [list2Selected, setList2Selected] = React.useState<{id:string; name:string}[]>([]);
  const [list2Search, setList2Search] = React.useState<string>("");

  const [allUsers, setAllUsers] = React.useState<{id:string; name:string; avatar?:string}[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('profiles_user')
        .select('user_id, display_name, avatar_url')
        .limit(2000);
      if (!error && Array.isArray(data)) {
        setAllUsers(data.map((u:any) => ({ id: u.user_id, name: u.display_name || u.user_id, avatar: u.avatar_url })));
      }
    })();
  }, []);

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
        const ext = coverFile.name.split('.')?.pop();
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
      // Crear candidatos desde listas seleccionadas por display_name
      for (const u of list1Selected) {
        if (list1Ritmo) {
          await adminAddCandidate({ trendingId: id, ritmoSlug: list1Ritmo, userId: u.id, displayName: u.name, listName: list1Name || null as any });
        }
      }
      for (const u of list2Selected) {
        if (list2Ritmo) {
          await adminAddCandidate({ trendingId: id, ritmoSlug: list2Ritmo, userId: u.id, displayName: u.name, listName: list2Name || null as any });
        }
      }

      setTitle(""); setDescription(""); setStartsAt(""); setEndsAt(""); setMode("per_candidate"); setCoverFile(null); setRitmosSel([]);
      setList1Name(""); setList1Ritmo(""); setList1Selected([]); setList1Search("");
      setList2Name(""); setList2Ritmo(""); setList2Selected([]); setList2Search("");
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
              {/* Lista #1 con selección por display_name */}
              <div className="cc-glass" style={{ padding: 12, borderRadius: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: '1rem' }}>Lista de usuarios #1</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Nombre de lista</label>
                    <input placeholder="Ej. Bachata Team A" value={list1Name} onChange={(e) => setList1Name(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmo</label>
                    <input placeholder="slug de ritmo (ej. bachata_tradicional)" value={list1Ritmo} onChange={(e) => setList1Ritmo(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Agregar usuarios (buscar por nombre)</label>
                    <input placeholder="Escribe un nombre..." value={list1Search} onChange={(e) => setList1Search(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                    {list1Search && (
                      <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}>
                        {allUsers.filter(u => u.name.toLowerCase().includes(list1Search.toLowerCase())).slice(0,50).map(u => (
                          <button type="button" key={u.id} onClick={() => { if (!list1Selected.find(x=>x.id===u.id)) setList1Selected([...list1Selected, u]); }} style={{ display:'flex', gap:8, alignItems:'center', width:'100%', textAlign:'left', padding:8, background:'transparent', border:'none', color:'#fff', cursor:'pointer' }}>
                            <img src={u.avatar || 'https://placehold.co/32x32'} alt={u.name} style={{ width:24, height:24, borderRadius:999, objectFit:'cover' }} />
                            <span>{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {list1Selected.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                        {list1Selected.map(u => (
                          <span key={u.id} className="cc-chip" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                            {u.name}
                            <button type="button" onClick={() => setList1Selected(list1Selected.filter(x=>x.id!==u.id))} style={{ border:'none', background:'transparent', color:'#fff', cursor:'pointer' }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Lista #2 con selección por display_name */}
              <div className="cc-glass" style={{ padding: 12, borderRadius: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: '1rem' }}>Lista de usuarios #2</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Nombre de lista</label>
                    <input placeholder="Ej. Bachata Team B" value={list2Name} onChange={(e) => setList2Name(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmo</label>
                    <input placeholder="slug de ritmo (ej. bachata_tradicional)" value={list2Ritmo} onChange={(e) => setList2Ritmo(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Agregar usuarios (buscar por nombre)</label>
                    <input placeholder="Escribe un nombre..." value={list2Search} onChange={(e) => setList2Search(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                    {list2Search && (
                      <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}>
                        {allUsers.filter(u => u.name.toLowerCase().includes(list2Search.toLowerCase())).slice(0,50).map(u => (
                          <button type="button" key={u.id} onClick={() => { if (!list2Selected.find(x=>x.id===u.id)) setList2Selected([...list2Selected, u]); }} style={{ display:'flex', gap:8, alignItems:'center', width:'100%', textAlign:'left', padding:8, background:'transparent', border:'none', color:'#fff', cursor:'pointer' }}>
                            <img src={u.avatar || 'https://placehold.co/32x32'} alt={u.name} style={{ width:24, height:24, borderRadius:999, objectFit:'cover' }} />
                            <span>{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {list2Selected.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                        {list2Selected.map(u => (
                          <span key={u.id} className="cc-chip" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                            {u.name}
                            <button type="button" onClick={() => setList2Selected(list2Selected.filter(x=>x.id!==u.id))} style={{ border:'none', background:'transparent', color:'#fff', cursor:'pointer' }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
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


