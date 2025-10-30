export async function ensureRitmosExist(ids: string[]) {
	// Optional helper. Not used by default to avoid RLS/policy issues.
	try {
		if (!Array.isArray(ids) || ids.length === 0) return;
		const { RITMOS_CATALOG } = await import('@/lib/ritmosCatalog');
		const { supabase } = await import('@/lib/supabase');

		const entries: Array<{ id: string; label: string; group_id: string; active: boolean }> = [];
		for (const id of ids) {
			const group = RITMOS_CATALOG.find(g => g.items.some(it => it.id === id));
			const item = group?.items.find(it => it.id === id);
			if (group && item) {
				entries.push({ id: item.id, label: item.label, group_id: group.id, active: true });
			}
		}
		if (entries.length === 0) return;
		const { error } = await supabase
			.from('ritmos_catalog')
			.upsert(entries, { onConflict: 'id', ignoreDuplicates: false });
		if (error) {
			console.warn('[ensureRitmosExist] upsert warning:', error.message);
		}
	} catch (e) {
		console.warn('[ensureRitmosExist] skipped:', (e as any)?.message || e);
	}
}
