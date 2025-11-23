import React from "react";
import {
  listTrendings,
  adminCreateTrending,
  adminPublishTrending,
  adminCloseTrending,
  adminDeleteTrending,
  adminAddRitmo,
  adminAddCandidate,
  adminRemoveCandidate,
  adminUpdateTrending,
  adminSetRoundsConfig,
  adminSetParticipantsLists,
  adminStartFirstRound,
  adminCloseRound,
  adminActivatePendingCandidates,
  getTrendingRounds,
  getTrendingCandidates,
  type RoundConfig,
  type ListConfig,
} from "@/lib/trending";
import { supabase } from "@/lib/supabase";
import "@/styles/event-public.css";
import { useToast } from "@/components/Toast";

type Mode = "per_candidate" | "per_ritmo";

export default function TrendingAdmin() {
  const { showToast } = useToast();
  const [canAdmin, setCanAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<any[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [createOpen, setCreateOpen] = React.useState<boolean>(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startsAt, setStartsAt] = React.useState<string>("");
  const [endsAt, setEndsAt] = React.useState<string>("");
  const [mode, setMode] = React.useState<Mode>("per_candidate");
  const [creating, setCreating] = React.useState(false);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [ritmosSel, setRitmosSel] = React.useState<string[]>([]);
  // Listas de usuarios
  type CandidateChip = { id: string; name: string; avatar?: string };
  type UserList = { key: string; name: string; ritmos: string[]; selected: CandidateChip[]; search: string };
  const [lists, setLists] = React.useState<UserList[]>([
    { key: Math.random().toString(36).slice(2), name: "", ritmos: [], selected: [], search: "" },
    { key: Math.random().toString(36).slice(2), name: "", ritmos: [], selected: [], search: "" },
  ]);
  // Configuración de rondas
  const [roundsConfig, setRoundsConfig] = React.useState<RoundConfig[]>([]);
  const [listsConfig, setListsConfig] = React.useState<ListConfig[]>([]);
  const [useRounds, setUseRounds] = React.useState(false);

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
      // Crear candidatos desde listas dinámicas
      for (const L of lists) {
        if (!L.ritmos || L.ritmos.length === 0) continue; // opcional
        for (const rs of L.ritmos) {
          for (const u of L.selected) {
            await adminAddCandidate({
              trendingId: id,
              ritmoSlug: rs,
              userId: u.id,
              displayName: u.name,
              avatarUrl: u.avatar,
              listName: L.name || null as any,
            });
          }
        }
      }

      // Guardar participantes y listas
      console.log('[TrendingAdmin] lists antes de procesar:', lists);
      const participantsLists = {
        lists: lists
          .filter(L => {
            const hasName = L.name && L.name.trim().length > 0;
            const hasParticipants = L.selected && L.selected.length > 0;
            console.log(`[TrendingAdmin] Lista "${L.name}": hasName=${hasName}, hasParticipants=${hasParticipants}, selected.length=${L.selected?.length || 0}`);
            return hasName && hasParticipants;
          })
          .map(L => ({
            name: L.name.trim(),
            participants: L.selected.map(u => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar || null,
            })),
          })),
      };
      console.log('[TrendingAdmin] Guardando participants_lists:', JSON.stringify(participantsLists, null, 2));
      try {
        await adminSetParticipantsLists(id, participantsLists);
        console.log('[TrendingAdmin] participants_lists guardado correctamente');
      } catch (e: any) {
        console.error('[TrendingAdmin] Error al guardar participants_lists:', e);
        showToast(`Error al guardar participantes: ${e?.message}`, 'error');
      }

      // Actualizar lists_config con el tamaño real de participantes si está habilitado el sistema de rondas
      if (useRounds && roundsConfig.length > 0) {
        const updatedListsConfig = participantsLists.lists.map(list => ({
          name: list.name,
          size: list.participants.length
        }));
        console.log('[TrendingAdmin] Actualizando lists_config con tamaños reales:', updatedListsConfig);
        await adminSetRoundsConfig(id, { rounds: roundsConfig }, { lists: updatedListsConfig }, roundsConfig.length);
      } else if (useRounds && roundsConfig.length > 0 && listsConfig.length > 0) {
        // Si no hay participantes aún, usar la configuración original
        await adminSetRoundsConfig(id, { rounds: roundsConfig }, { lists: listsConfig }, roundsConfig.length);
      }

      setTitle(""); setDescription(""); setStartsAt(""); setEndsAt(""); setMode("per_candidate"); setCoverFile(null); setRitmosSel([]);
      setLists([
        { key: Math.random().toString(36).slice(2), name: "", ritmos: [], selected: [], search: "" },
        { key: Math.random().toString(36).slice(2), name: "", ritmos: [], selected: [], search: "" },
      ]);
      setRoundsConfig([]);
      setListsConfig([]);
      setUseRounds(false);
      await reload(statusFilter || undefined);
      showToast(`Trending creado (#${id})`, "success");
    } catch (err: any) {
      showToast(err?.message || "No se pudo crear el trending", "error");
    } finally {
      setCreating(false);
    }
  };

  const doPublish = async (id: number) => {
    if (!canAdmin) return;
    try {
      await adminPublishTrending(id);
      await reload(statusFilter || undefined);
      showToast('Trending publicado', 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo publicar', 'error');
    }
  };
  const doClose = async (id: number) => {
    if (!canAdmin) return;
    try {
      await adminCloseTrending(id);
      await reload(statusFilter || undefined);
      showToast('Trending cerrado', 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo cerrar el trending', 'error');
    }
  };

  const doStartFirstRound = async (id: number) => {
    if (!canAdmin) return;
    try {
      await adminStartFirstRound(id);
      await reload(statusFilter || undefined);
      showToast('Primera ronda iniciada', 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo iniciar la ronda', 'error');
    }
  };

  const doCloseRound = async (id: number, roundNumber: number) => {
    if (!canAdmin) return;
    if (!confirm(`¿Cerrar ronda ${roundNumber}? Los ganadores avanzarán automáticamente.`)) return;
    try {
      await adminCloseRound(id, roundNumber);
      await reload(statusFilter || undefined);
      showToast(`Ronda ${roundNumber} cerrada`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo cerrar la ronda', 'error');
    }
  };

  const doDelete = async (id: number, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteTrending(id);
      await reload(statusFilter || undefined);
      showToast('Trending eliminado', 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo eliminar el trending', 'error');
    }
  };

  // Inline editing state
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editTitle, setEditTitle] = React.useState<string>("");
  const [editDescription, setEditDescription] = React.useState<string>("");
  const [editStartsAt, setEditStartsAt] = React.useState<string>("");
  const [editEndsAt, setEditEndsAt] = React.useState<string>("");
  const [editMode, setEditMode] = React.useState<Mode>("per_candidate");
  // Estado para editar candidatos y rondas
  const [editCandidates, setEditCandidates] = React.useState<any[]>([]);
  const [editRoundsConfig, setEditRoundsConfig] = React.useState<RoundConfig[]>([]);
  const [editListsConfig, setEditListsConfig] = React.useState<ListConfig[]>([]);
  const [editUseRounds, setEditUseRounds] = React.useState(false);
  const [editRitmosSel, setEditRitmosSel] = React.useState<string[]>([]);
  const [editLists, setEditLists] = React.useState<UserList[]>([]);
  const [loadingEditData, setLoadingEditData] = React.useState(false);

  const beginEdit = async (r: any) => {
    setEditId(r.id);
    setEditTitle(r.title || "");
    setEditDescription(r.description || "");
    setEditStartsAt(r.starts_at ? new Date(r.starts_at).toISOString().slice(0,16) : "");
    setEditEndsAt(r.ends_at ? new Date(r.ends_at).toISOString().slice(0,16) : "");
    setEditMode(r.allowed_vote_mode || "per_candidate");
    
    // Cargar datos adicionales
    setLoadingEditData(true);
    try {
      // Cargar candidatos existentes
      const candidates = await getTrendingCandidates(r.id);
      setEditCandidates(candidates);
      
      // Cargar ritmos
      const ritmos = await supabase
        .from('trending_ritmos')
        .select('ritmo_slug')
        .eq('trending_id', r.id);
      if (ritmos.data) {
        setEditRitmosSel(ritmos.data.map((x: any) => x.ritmo_slug));
      }
      
      // Cargar configuración de rondas si existe
      let parsedListsConfig: ListConfig[] = [];
      if (r.rounds_config && r.lists_config) {
        setEditUseRounds(true);
        try {
          const roundsConfig = r.rounds_config.rounds || r.rounds_config;
          const listsConfig = r.lists_config.lists || r.lists_config;
          
          if (Array.isArray(roundsConfig)) {
            setEditRoundsConfig(roundsConfig);
          } else if (roundsConfig && typeof roundsConfig === 'object') {
            // Si es un objeto con propiedad rounds
            setEditRoundsConfig(roundsConfig.rounds || []);
          }
          
          if (Array.isArray(listsConfig)) {
            parsedListsConfig = listsConfig;
            setEditListsConfig(listsConfig);
          } else if (listsConfig && typeof listsConfig === 'object') {
            parsedListsConfig = listsConfig.lists || [];
            setEditListsConfig(parsedListsConfig);
          }
        } catch (e) {
          console.error('Error parsing rounds config', e);
        }
      } else {
        setEditUseRounds(false);
        setEditRoundsConfig([]);
        setEditListsConfig([]);
      }
      
      // Cargar participants_lists si existe
      let participantsListsData: any = null;
      if (r.participants_lists) {
        try {
          if (typeof r.participants_lists === 'string') {
            participantsListsData = JSON.parse(r.participants_lists);
          } else {
            participantsListsData = r.participants_lists;
          }
          console.log('[TrendingAdmin] participants_lists cargado:', participantsListsData);
        } catch (e) {
          console.error('Error parsing participants_lists', e);
        }
      }
      
      // Agrupar candidatos por lista para poblar las listas (para obtener ritmos)
      const candidatesByList = new Map<string, any[]>();
      candidates.forEach((c: any) => {
        const listName = c.list_name || 'General';
        if (!candidatesByList.has(listName)) {
          candidatesByList.set(listName, []);
        }
        candidatesByList.get(listName)!.push(c);
      });
      
      // Crear listas de edición
      const editListsData: UserList[] = [];
      
      // Prioridad 1: Si hay participants_lists, usar esa información
      if (participantsListsData && participantsListsData.lists && Array.isArray(participantsListsData.lists) && participantsListsData.lists.length > 0) {
        console.log('[TrendingAdmin] Cargando desde participants_lists');
        // Obtener todos los ritmos del trending como fallback
        const allRitmos = ritmos.data?.map((r: any) => r.ritmo_slug) || [];
        
        participantsListsData.lists.forEach((listData: any) => {
          const listName = listData.name || '';
          const participants = listData.participants || [];
          
          // Obtener candidatos de esta lista para obtener ritmos
          const candidatesInList = candidatesByList.get(listName) || [];
          let ritmosFromCandidates = Array.from(new Set(candidatesInList.map((c: any) => c.ritmo_slug).filter(Boolean)));
          
          // Si no hay ritmos de candidatos, usar todos los ritmos del trending como fallback
          if (ritmosFromCandidates.length === 0 && allRitmos.length > 0) {
            ritmosFromCandidates = allRitmos;
            console.log(`[TrendingAdmin] Lista "${listName}" no tiene ritmos de candidatos, usando todos los ritmos del trending:`, ritmosFromCandidates);
          }
          
          editListsData.push({
            key: Math.random().toString(36).slice(2),
            name: listName,
            ritmos: ritmosFromCandidates,
            selected: participants.map((p: any) => ({
              id: p.id,
              name: p.name || p.id,
              avatar: p.avatar || null
            })),
            search: ""
          });
        });
      }
      // Prioridad 2: Si hay lists_config, crear las listas desde ahí
      else if (parsedListsConfig.length > 0) {
        console.log('[TrendingAdmin] Cargando desde lists_config');
        parsedListsConfig.forEach((listCfg) => {
          const listName = listCfg.name || '';
          const candidatesInList = candidatesByList.get(listName) || [];
          
          // Obtener ritmos únicos de los candidatos de esta lista
          const ritmosFromCandidates = Array.from(new Set(candidatesInList.map((c: any) => c.ritmo_slug).filter(Boolean)));
          
          editListsData.push({
            key: Math.random().toString(36).slice(2),
            name: listName,
            ritmos: ritmosFromCandidates,
            selected: candidatesInList.map((c: any) => ({
              id: c.user_id,
              name: c.display_name || c.user_id,
              avatar: c.avatar_url
            })),
            search: ""
          });
        });
      } 
      // Prioridad 3: Si no hay lists_config, crear desde candidatos existentes (comportamiento anterior)
      else {
        console.log('[TrendingAdmin] Cargando desde candidatos');
        candidatesByList.forEach((candidatesList, listName) => {
          editListsData.push({
            key: Math.random().toString(36).slice(2),
            name: listName,
            ritmos: Array.from(new Set(candidatesList.map((c: any) => c.ritmo_slug).filter(Boolean))),
            selected: candidatesList.map((c: any) => ({
              id: c.user_id,
              name: c.display_name || c.user_id,
              avatar: c.avatar_url
            })),
            search: ""
          });
        });
      }
      
      if (editListsData.length === 0) {
        // Si no hay listas, crear una vacía
        editListsData.push({
          key: Math.random().toString(36).slice(2),
          name: "",
          ritmos: [],
          selected: [],
          search: ""
        });
      }
      
      console.log('[TrendingAdmin] editListsData final:', editListsData);
      setEditLists(editListsData);
    } catch (e) {
      console.error('Error loading edit data', e);
    } finally {
      setLoadingEditData(false);
    }
  };

  const saveEdit = async () => {
    if (!canAdmin || editId == null) return;
    try {
      // Actualizar información básica del trending
      await adminUpdateTrending({
        id: editId,
        title: editTitle,
        description: editDescription,
        starts_at: editStartsAt ? new Date(editStartsAt).toISOString() : null,
        ends_at: editEndsAt ? new Date(editEndsAt).toISOString() : null,
        allowed_vote_mode: editMode,
      });
      
      // Actualizar ritmos
      const currentRitmos = await supabase
        .from('trending_ritmos')
        .select('ritmo_slug')
        .eq('trending_id', editId);
      
      const currentRitmoSlugs = (currentRitmos.data || []).map((x: any) => x.ritmo_slug);
      
      // Eliminar ritmos que ya no están seleccionados
      for (const slug of currentRitmoSlugs) {
        if (!editRitmosSel.includes(slug)) {
          await supabase
            .from('trending_ritmos')
            .delete()
            .eq('trending_id', editId)
            .eq('ritmo_slug', slug);
        }
      }
      
      // Agregar nuevos ritmos
      for (const slug of editRitmosSel) {
        if (!currentRitmoSlugs.includes(slug)) {
          await adminAddRitmo(editId, slug);
        }
      }
      
      // Obtener candidatos actuales para comparar
      const currentCandidates = await getTrendingCandidates(editId);
      const currentCandidateIds = new Set(currentCandidates.map((c: any) => c.id));
      
      // Crear set de candidatos que deberían existir (de las listas de edición)
      const expectedCandidateKeys = new Set<string>();
      editLists.forEach(L => {
        L.selected.forEach(u => {
          L.ritmos.forEach(rs => {
            expectedCandidateKeys.add(`${u.id}-${rs}-${L.name}`);
          });
        });
      });
      
      // Eliminar candidatos que ya no están en las listas
      for (const candidate of currentCandidates) {
        const key = `${candidate.user_id}-${candidate.ritmo_slug}-${candidate.list_name || ''}`;
        if (!expectedCandidateKeys.has(key)) {
          await adminRemoveCandidate(editId, candidate.id);
        }
      }
      
      // Agregar nuevos candidatos
      let newCandidatesAdded = false;
      for (const L of editLists) {
        if (!L.ritmos || L.ritmos.length === 0) continue;
        for (const rs of L.ritmos) {
          for (const u of L.selected) {
            // Verificar si ya existe
            const exists = currentCandidates.some((c: any) => 
              c.user_id === u.id && 
              c.ritmo_slug === rs && 
              (c.list_name || '') === (L.name || '')
            );
            
            if (!exists) {
              newCandidatesAdded = true;
              await adminAddCandidate({
                trendingId: editId,
                ritmoSlug: rs,
                userId: u.id,
                displayName: u.name,
                avatarUrl: u.avatar,
                listName: L.name || null as any,
              });
            }
          }
        }
      }
      
      console.log('[TrendingAdmin] Nuevos candidatos agregados:', newCandidatesAdded);
      
      // Guardar participantes y listas
      console.log('[TrendingAdmin] editLists antes de procesar:', editLists);
      const participantsLists = {
        lists: editLists
          .filter(L => {
            const hasName = L.name && L.name.trim().length > 0;
            const hasParticipants = L.selected && L.selected.length > 0;
            console.log(`[TrendingAdmin] Lista "${L.name}": hasName=${hasName}, hasParticipants=${hasParticipants}, selected.length=${L.selected?.length || 0}`);
            return hasName && hasParticipants;
          })
          .map(L => ({
            name: L.name.trim(),
            participants: L.selected.map(u => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar || null,
            })),
          })),
      };
      console.log('[TrendingAdmin] Guardando participants_lists (edit):', JSON.stringify(participantsLists, null, 2));
      try {
        await adminSetParticipantsLists(editId, participantsLists);
        console.log('[TrendingAdmin] participants_lists guardado correctamente (edit)');
      } catch (e: any) {
        console.error('[TrendingAdmin] Error al guardar participants_lists (edit):', e);
        showToast(`Error al guardar participantes: ${e?.message}`, 'error');
      }

      // Actualizar lists_config con el tamaño real de participantes si está habilitado el sistema de rondas
      if (editUseRounds && editRoundsConfig.length > 0) {
        const updatedListsConfig = participantsLists.lists.map(list => ({
          name: list.name,
          size: list.participants.length
        }));
        console.log('[TrendingAdmin] Actualizando lists_config con tamaños reales (edit):', updatedListsConfig);
        await adminSetRoundsConfig(editId, { rounds: editRoundsConfig }, { lists: updatedListsConfig }, editRoundsConfig.length);
      } else if (editUseRounds && editRoundsConfig.length > 0 && editListsConfig.length > 0) {
        // Si no hay participantes aún, usar la configuración original
        await adminSetRoundsConfig(editId, { rounds: editRoundsConfig }, { lists: editListsConfig }, editRoundsConfig.length);
      }
      
      // Recargar el trending para obtener el estado actualizado
      await reload(statusFilter || undefined);
      
      // Si hay una ronda activa, activar todos los candidatos pendientes (incluyendo los recién agregados)
      const updatedTrending = rows.find(r => r.id === editId);
      if (updatedTrending?.current_round_number && updatedTrending.current_round_number > 0) {
        try {
          console.log('[TrendingAdmin] Activando candidatos pendientes para ronda', updatedTrending.current_round_number);
          await adminActivatePendingCandidates(editId);
          console.log('[TrendingAdmin] Candidatos activados correctamente');
          // Recargar nuevamente para ver los candidatos activados
          await reload(statusFilter || undefined);
        } catch (e) {
          console.error('Error activando candidatos pendientes', e);
        }
      }
      
      setEditId(null);
      showToast('Trending actualizado', 'success');
    } catch (e:any) {
      showToast(e?.message || 'Error al guardar cambios', 'error');
    }
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

        {/* Crear (colapsable) */}
        <section className="cc-glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Crear trending</h2>
            <button type="button" className="cc-btn" onClick={() => setCreateOpen(!createOpen)}>
              {createOpen ? 'Cerrar' : 'Abrir'}
            </button>
          </div>
          {!canAdmin && <div style={{ opacity: .85, marginTop: 8 }}>Necesitas permisos de superadmin.</div>}
          {canAdmin && createOpen && (
            <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.75rem', maxWidth: 700, marginTop: 10 }}>
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
                <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmos (slugs separados por comas)</label>
                <input 
                  value={ritmosSel.join(', ')} 
                  onChange={(e) => setRitmosSel(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                  placeholder="Ej: salsa, bachata, kizomba"
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} 
                />
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
              {/* Listas dinámicas */}
              <div style={{ display:'grid', gap: 10 }}>
                {lists.map((L, idx) => (
                  <div key={L.key} className="cc-glass" style={{ padding: 12, borderRadius: 12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>Lista de usuarios #{idx+1}</h3>
                      <button type="button" className="cc-btn" onClick={() => setLists(lists.filter(x => x.key !== L.key))}>
                        Eliminar lista
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Nombre de lista</label>
                        <input placeholder="Ej. Bachata Team" value={L.name} onChange={(e) => setLists(lists.map(x => x.key===L.key ? { ...x, name: e.target.value } : x))} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmos (opcional, slugs separados por comas)</label>
                        <input 
                          placeholder="Ej: salsa, bachata, kizomba"
                          value={L.ritmos.join(', ')} 
                          onChange={(e) => setLists(lists.map(x => x.key===L.key ? { ...x, ritmos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : x))} 
                          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Agregar usuarios (buscar por nombre)</label>
                        <input placeholder="Escribe un nombre..." value={L.search} onChange={(e) => setLists(lists.map(x => x.key===L.key ? { ...x, search: e.target.value } : x))} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                        {L.search && (
                          <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}>
                            {allUsers.filter(u => u.name.toLowerCase().includes(L.search.toLowerCase())).slice(0,50).map(u => (
                              <button type="button" key={u.id} onClick={() => {
                                if (!L.selected.find(x=>x.id===u.id)) {
                                  setLists(lists.map(x => x.key===L.key ? { ...x, selected: [...x.selected, u] } : x));
                                }
                              }} style={{ display:'flex', gap:8, alignItems:'center', width:'100%', textAlign:'left', padding:8, background:'transparent', border:'none', color:'#fff', cursor:'pointer' }}>
                                <img src={u.avatar || 'https://placehold.co/32x32'} alt={u.name} style={{ width:24, height:24, borderRadius:999, objectFit:'cover' }} />
                                <span>{u.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {L.selected.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                            {L.selected.map(u => (
                              <span key={u.id} className="cc-chip" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                                {u.name}
                                <button type="button" onClick={() => setLists(lists.map(x => x.key===L.key ? { ...x, selected: x.selected.filter(y=>y.id!==u.id) } : x))} style={{ border:'none', background:'transparent', color:'#fff', cursor:'pointer' }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <button type="button" className="cc-btn" onClick={() => setLists([...lists, { key: Math.random().toString(36).slice(2), name: "", ritmos: [], selected: [], search: "" }])}>Añadir lista</button>
                </div>
              </div>
              
              {/* Configuración de rondas */}
              <div className="cc-glass" style={{ padding: 12, borderRadius: 12, border: '2px solid rgba(0,188,212,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input 
                    type="checkbox" 
                    checked={useRounds} 
                    onChange={(e) => {
                      setUseRounds(e.target.checked);
                      if (e.target.checked && roundsConfig.length === 0) {
                        // Inicializar con una ronda por defecto
                        setRoundsConfig([{ round_number: 1, advances_per_list: 10, duration_type: 'days', duration_value: 1 }]);
                        // Inicializar listas config desde las listas de usuarios
                        const listConfigs: ListConfig[] = lists
                          .filter(L => L.name.trim())
                          .map(L => ({ name: L.name, size: L.selected.length }));
                        if (listConfigs.length > 0) {
                          setListsConfig(listConfigs);
                        }
                      }
                    }}
                    style={{ width: 18, height: 18 }}
                  />
                  <label style={{ fontSize: '1rem', fontWeight: 700 }}>Usar sistema de rondas</label>
                </div>
                
                {useRounds && (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {/* Configuración de listas para rondas */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, opacity: .8, marginBottom: 8 }}>Configuración de listas</label>
                      {listsConfig.map((listCfg, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          <input 
                            type="text" 
                            placeholder="Nombre de lista"
                            value={listCfg.name}
                            onChange={(e) => setListsConfig(listsConfig.map((l, i) => i === idx ? { ...l, name: e.target.value } : l))}
                            style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                          />
                          <input 
                            type="number" 
                            placeholder="Tamaño"
                            value={listCfg.size}
                            onChange={(e) => setListsConfig(listsConfig.map((l, i) => i === idx ? { ...l, size: parseInt(e.target.value) || 0 } : l))}
                            style={{ width: 100, padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                          />
                          <button 
                            type="button" 
                            className="cc-btn" 
                            onClick={() => setListsConfig(listsConfig.filter((_, i) => i !== idx))}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="cc-btn" 
                        onClick={() => setListsConfig([...listsConfig, { name: '', size: 0 }])}
                      >
                        + Añadir lista
                      </button>
                    </div>

                    {/* Configuración de rondas */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, opacity: .8, marginBottom: 8 }}>Rondas</label>
                      {roundsConfig.map((round, idx) => (
                        <div key={idx} className="cc-glass" style={{ padding: 12, borderRadius: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Ronda {round.round_number}</h4>
                            {roundsConfig.length > 1 && (
                              <button 
                                type="button" 
                                className="cc-btn" 
                                onClick={() => setRoundsConfig(roundsConfig.filter((_, i) => i !== idx).map((r, i) => ({ ...r, round_number: i + 1 })))}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, opacity: .8, marginBottom: 4 }}>Avances por lista</label>
                              <input 
                                type="number" 
                                value={round.advances_per_list}
                                onChange={(e) => setRoundsConfig(roundsConfig.map((r, i) => i === idx ? { ...r, advances_per_list: parseInt(e.target.value) || 0 } : r))}
                                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, opacity: .8, marginBottom: 4 }}>Tipo de duración</label>
                              <select 
                                value={round.duration_type}
                                onChange={(e) => setRoundsConfig(roundsConfig.map((r, i) => i === idx ? { ...r, duration_type: e.target.value as any, duration_value: e.target.value === 'unlimited' ? undefined : r.duration_value } : r))}
                                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#4a4a4a', color: '#fff' }}
                              >
                                <option value="days">Días</option>
                                <option value="hours">Horas</option>
                                <option value="unlimited">Sin límite</option>
                              </select>
                            </div>
                            {round.duration_type !== 'unlimited' && (
                              <div>
                                <label style={{ display: 'block', fontSize: 12, opacity: .8, marginBottom: 4 }}>
                                  Duración ({round.duration_type === 'days' ? 'días' : 'horas'})
                                </label>
                                <input 
                                  type="number" 
                                  value={round.duration_value || ''}
                                  onChange={(e) => setRoundsConfig(roundsConfig.map((r, i) => i === idx ? { ...r, duration_value: parseInt(e.target.value) || undefined } : r))}
                                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="cc-btn" 
                        onClick={() => setRoundsConfig([...roundsConfig, { 
                          round_number: roundsConfig.length + 1, 
                          advances_per_list: Math.max(1, Math.floor((roundsConfig[roundsConfig.length - 1]?.advances_per_list || 10) / 2)), 
                          duration_type: 'days', 
                          duration_value: 1 
                        }])}
                      >
                        + Añadir ronda
                      </button>
                    </div>
                  </div>
                )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 450px)', gap: 12, justifyContent: 'center' }}>
              {rows.map((r) => (
                <div key={r.id} style={{
                  position: 'relative',
                  width: '450px',
                  maxWidth: '450px',
                  minWidth: '450px',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.18)'
                }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: r.cover_url
                      ? `url(${r.cover_url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))'
                  }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12, gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 900, color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.36))', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                      <span className="cc-chip" style={{ textTransform: 'uppercase' }}>{r.status}</span>
                    </div>
                    {r.description && <div className="cc-two-lines" style={{ opacity: .92, color:'#fff' }}>{r.description}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, opacity: .92, color:'#fff' }}>
                      {r.starts_at && <span>🟢 {new Date(r.starts_at).toLocaleString()}</span>}
                      {r.ends_at && <span>🔴 {new Date(r.ends_at).toLocaleString()}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {r.status === 'draft' && <button className="cc-btn" onClick={() => doPublish(r.id)}>Publicar</button>}
                      {r.status === 'open' && <button className="cc-btn" onClick={() => doClose(r.id)}>Cerrar</button>}
                      {r.rounds_config && r.current_round_number === 0 && r.status === 'open' && (
                        <button className="cc-btn" onClick={() => doStartFirstRound(r.id)} style={{ background: 'rgba(0,188,212,0.3)' }}>Iniciar Ronda 1</button>
                      )}
                      <a href={`/trending/${r.id}`} className="cc-btn cc-btn--primary">Abrir</a>
                      <button className="cc-btn" onClick={() => beginEdit(r)}>{editId === r.id ? 'Editando…' : 'Editar'}</button>
                      <button 
                        className="cc-btn" 
                        onClick={() => doDelete(r.id, r.title)}
                        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ff6b6b' }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                    {r.rounds_config && r.current_round_number > 0 && (
                      <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>
                        Ronda {r.current_round_number} de {r.total_rounds || '?'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {editId !== null && (
          <section className="cc-glass" style={{ padding: '1rem', marginTop: '1rem' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Editar trending #{editId}</h2>
            {loadingEditData ? (
              <div style={{ padding: 24, textAlign: 'center' }}>Cargando datos...</div>
            ) : (
              <div style={{ display:'grid', gap: 10, maxWidth: 700 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Título</label>
                  <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Descripción</label>
                  <textarea value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} rows={3} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmos (slugs separados por comas)</label>
                  <input 
                    value={editRitmosSel.join(', ')} 
                    onChange={(e) => setEditRitmosSel(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                    placeholder="Ej: salsa, bachata, kizomba"
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} 
                  />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display:'block', fontSize: 13, opacity: .8 }}>Inicia</label>
                    <input type="datetime-local" value={editStartsAt} onChange={(e)=>setEditStartsAt(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#fff' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize: 13, opacity: .8 }}>Termina</label>
                    <input type="datetime-local" value={editEndsAt} onChange={(e)=>setEditEndsAt(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#fff' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize: 13, opacity: .8 }}>Modo de voto</label>
                  <select value={editMode} onChange={(e)=>setEditMode(e.target.value as any)} style={{ width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#fff' }}>
                    <option value="per_candidate">per_candidate</option>
                    <option value="per_ritmo">per_ritmo</option>
                  </select>
                </div>
                
                {/* Listas de participantes */}
                <div className="cc-glass" style={{ padding: 12, borderRadius: 12, border: '2px solid rgba(0,188,212,0.3)' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: 12 }}>Listas de participantes</h3>
                  <div style={{ display:'grid', gap: 10 }}>
                    {editLists.map((L, idx) => (
                      <div key={L.key} className="cc-glass" style={{ padding: 12, borderRadius: 12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Lista #{idx+1}</h4>
                          <button type="button" className="cc-btn" onClick={() => setEditLists(editLists.filter(x => x.key !== L.key))}>
                            Eliminar lista
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Nombre de lista</label>
                            <input placeholder="Ej. Bachata Team" value={L.name} onChange={(e) => setEditLists(editLists.map(x => x.key===L.key ? { ...x, name: e.target.value } : x))} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Ritmos (opcional, slugs separados por comas)</label>
                            <input 
                              placeholder="Ej: salsa, bachata, kizomba"
                              value={L.ritmos.join(', ')} 
                              onChange={(e) => setEditLists(editLists.map(x => x.key===L.key ? { ...x, ritmos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : x))} 
                              style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, opacity: .8 }}>Agregar usuarios (buscar por nombre)</label>
                            <input placeholder="Escribe un nombre..." value={L.search} onChange={(e) => setEditLists(editLists.map(x => x.key===L.key ? { ...x, search: e.target.value } : x))} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                            {L.search && (
                              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}>
                                {allUsers.filter(u => u.name.toLowerCase().includes(L.search.toLowerCase())).slice(0,50).map(u => (
                                  <button type="button" key={u.id} onClick={() => {
                                    if (!L.selected.find(x=>x.id===u.id)) {
                                      setEditLists(editLists.map(x => x.key===L.key ? { ...x, selected: [...x.selected, u] } : x));
                                    }
                                  }} style={{ display:'flex', gap:8, alignItems:'center', width:'100%', textAlign:'left', padding:8, background:'transparent', border:'none', color:'#fff', cursor:'pointer' }}>
                                    <img src={u.avatar || 'https://placehold.co/32x32'} alt={u.name} style={{ width:24, height:24, borderRadius:999, objectFit:'cover' }} />
                                    <span>{u.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {L.selected.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                                {L.selected.map(u => (
                                  <span key={u.id} className="cc-chip" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                                    {u.name}
                                    <button type="button" onClick={() => setEditLists(editLists.map(x => x.key===L.key ? { ...x, selected: x.selected.filter(y=>y.id!==u.id) } : x))} style={{ border:'none', background:'transparent', color:'#fff', cursor:'pointer' }}>×</button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <button type="button" className="cc-btn" onClick={() => setEditLists([...editLists, { key: Math.random().toString(36).slice(2), name: "", ritmos: [], selected: [], search: "" }])}>Añadir lista</button>
                    </div>
                  </div>
                </div>

                {/* Configuración de rondas */}
                <div className="cc-glass" style={{ padding: 12, borderRadius: 12, border: '2px solid rgba(0,188,212,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input 
                      type="checkbox" 
                      checked={editUseRounds} 
                      onChange={(e) => {
                        setEditUseRounds(e.target.checked);
                        if (e.target.checked && editRoundsConfig.length === 0) {
                          setEditRoundsConfig([{ round_number: 1, advances_per_list: 10, duration_type: 'days', duration_value: 1 }]);
                          const listConfigs: ListConfig[] = editLists
                            .filter(L => L.name.trim())
                            .map(L => ({ name: L.name, size: L.selected.length }));
                          if (listConfigs.length > 0) {
                            setEditListsConfig(listConfigs);
                          }
                        }
                      }}
                      style={{ width: 18, height: 18 }}
                    />
                    <label style={{ fontSize: '1rem', fontWeight: 700 }}>Usar sistema de rondas</label>
                  </div>
                  
                  {editUseRounds && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {/* Configuración de listas para rondas */}
                      <div>
                        <label style={{ display: 'block', fontSize: 13, opacity: .8, marginBottom: 8 }}>Configuración de listas</label>
                        {editListsConfig.map((listCfg, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <input 
                              type="text" 
                              placeholder="Nombre de lista"
                              value={listCfg.name}
                              onChange={(e) => setEditListsConfig(editListsConfig.map((l, i) => i === idx ? { ...l, name: e.target.value } : l))}
                              style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                            />
                            <input 
                              type="number" 
                              placeholder="Tamaño"
                              value={listCfg.size}
                              onChange={(e) => setEditListsConfig(editListsConfig.map((l, i) => i === idx ? { ...l, size: parseInt(e.target.value) || 0 } : l))}
                              style={{ width: 100, padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                            />
                            <button 
                              type="button" 
                              className="cc-btn" 
                              onClick={() => setEditListsConfig(editListsConfig.filter((_, i) => i !== idx))}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          className="cc-btn" 
                          onClick={() => setEditListsConfig([...editListsConfig, { name: '', size: 0 }])}
                        >
                          + Añadir lista
                        </button>
                      </div>

                      {/* Configuración de rondas */}
                      <div>
                        <label style={{ display: 'block', fontSize: 13, opacity: .8, marginBottom: 8 }}>Rondas</label>
                        {editRoundsConfig.map((round, idx) => (
                          <div key={idx} className="cc-glass" style={{ padding: 12, borderRadius: 8, marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Ronda {round.round_number}</h4>
                              {editRoundsConfig.length > 1 && (
                                <button 
                                  type="button" 
                                  className="cc-btn" 
                                  onClick={() => setEditRoundsConfig(editRoundsConfig.filter((_, i) => i !== idx).map((r, i) => ({ ...r, round_number: i + 1 })))}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, opacity: .8, marginBottom: 4 }}>Avances por lista</label>
                                <input 
                                  type="number" 
                                  value={round.advances_per_list}
                                  onChange={(e) => setEditRoundsConfig(editRoundsConfig.map((r, i) => i === idx ? { ...r, advances_per_list: parseInt(e.target.value) || 0 } : r))}
                                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, opacity: .8, marginBottom: 4 }}>Tipo de duración</label>
                                <select 
                                  value={round.duration_type}
                                  onChange={(e) => setEditRoundsConfig(editRoundsConfig.map((r, i) => i === idx ? { ...r, duration_type: e.target.value as any, duration_value: e.target.value === 'unlimited' ? undefined : r.duration_value } : r))}
                                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#4a4a4a', color: '#fff' }}
                                >
                                  <option value="days">Días</option>
                                  <option value="hours">Horas</option>
                                  <option value="unlimited">Sin límite</option>
                                </select>
                              </div>
                              {round.duration_type !== 'unlimited' && (
                                <div>
                                  <label style={{ display: 'block', fontSize: 12, opacity: .8, marginBottom: 4 }}>
                                    Duración ({round.duration_type === 'days' ? 'días' : 'horas'})
                                  </label>
                                  <input 
                                    type="number" 
                                    value={round.duration_value || ''}
                                    onChange={(e) => setEditRoundsConfig(editRoundsConfig.map((r, i) => i === idx ? { ...r, duration_value: parseInt(e.target.value) || undefined } : r))}
                                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          className="cc-btn" 
                          onClick={() => setEditRoundsConfig([...editRoundsConfig, { 
                            round_number: editRoundsConfig.length + 1, 
                            advances_per_list: Math.max(1, Math.floor((editRoundsConfig[editRoundsConfig.length - 1]?.advances_per_list || 10) / 2)), 
                            duration_type: 'days', 
                            duration_value: 1 
                          }])}
                        >
                          + Añadir ronda
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button className="cc-btn cc-btn--primary" onClick={saveEdit}>Guardar</button>
                  <button className="cc-btn" onClick={()=>{
                    setEditId(null);
                    setEditCandidates([]);
                    setEditRoundsConfig([]);
                    setEditListsConfig([]);
                    setEditUseRounds(false);
                    setEditLists([]);
                    setEditRitmosSel([]);
                  }}>Cancelar</button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}


