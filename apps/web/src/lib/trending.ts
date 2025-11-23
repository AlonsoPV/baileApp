import { supabase } from "@/lib/supabase";

export type Trending = {
  id: number;
  title: string;
  description: string | null;
  status: "draft" | "open" | "closed" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  allowed_vote_mode: "per_candidate" | "per_ritmo";
  cover_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  rounds_config?: any;
  lists_config?: any;
  current_round_number?: number;
  total_rounds?: number;
};

export type RoundConfig = {
  round_number: number;
  advances_per_list: number;
  duration_type: "days" | "hours" | "unlimited";
  duration_value?: number;
};

export type ListConfig = {
  name: string;
  size: number;
};

export type Round = {
  round_number: number;
  advances_per_list: number;
  duration_type: "days" | "hours" | "unlimited";
  duration_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: "pending" | "active" | "closed" | "completed";
};

export async function listTrendings(status?: Trending["status"]) {
  let q = supabase.from("trendings").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Trending[];
}

export async function getTrending(id: number) {
  const { data, error } = await supabase.from("trendings").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Trending;
}

export async function getTrendingRitmos(trendingId: number) {
  const { data, error } = await supabase
    .from("trending_ritmos")
    .select("*")
    .eq("trending_id", trendingId)
    .order("ritmo_slug", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTrendingCandidates(trendingId: number) {
  const { data, error } = await supabase
    .from("trending_candidates")
    .select("*")
    .eq("trending_id", trendingId);
  if (error) throw error;
  return data ?? [];
}

export async function leaderboard(trendingId: number) {
  const { data, error } = await supabase.rpc("rpc_trending_leaderboard", { p_trending_id: trendingId });
  if (error) throw error;
  return (data ?? []) as {
    candidate_id: number;
    ritmo_slug: string;
    list_name: string | null;
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    votes: number;
  }[];
}

export async function voteTrending(trendingId: number, candidateId: number) {
  const { error } = await supabase.rpc("rpc_trending_vote", {
    p_trending_id: trendingId,
    p_candidate_id: candidateId,
  });
  if (error) throw error;
}

export async function voteTrendingRound(trendingId: number, candidateId: number, roundNumber: number) {
  const { error } = await supabase.rpc("rpc_trending_vote_round", {
    p_trending_id: trendingId,
    p_candidate_id: candidateId,
    p_round_number: roundNumber,
  });
  if (error) throw error;
}

export async function adminCreateTrending(payload: {
  title: string;
  description?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  allowed_vote_mode?: "per_candidate" | "per_ritmo";
  cover_url?: string | null;
}) {
  const { data, error } = await supabase.rpc("rpc_trending_create", {
    p_title: payload.title,
    p_description: payload.description ?? null,
    p_starts_at: payload.starts_at ?? null,
    p_ends_at: payload.ends_at ?? null,
    p_allowed_vote_mode: payload.allowed_vote_mode ?? "per_candidate",
    p_cover_url: payload.cover_url ?? null,
  });
  if (error) throw error;
  return data as number;
}

export async function adminPublishTrending(trendingId: number) {
  const { error } = await supabase.rpc("rpc_trending_publish", { p_trending_id: trendingId });
  if (error) throw error;
}

export async function adminCloseTrending(trendingId: number) {
  const { error } = await supabase.rpc("rpc_trending_close", { p_trending_id: trendingId });
  if (error) throw error;
}

export async function adminDeleteTrending(trendingId: number) {
  const { error } = await supabase.rpc("rpc_trending_delete", { p_trending_id: trendingId });
  if (error) throw error;
}

export async function adminAddRitmo(trendingId: number, ritmoSlug: string) {
  const { error } = await supabase.rpc("rpc_trending_add_ritmo", {
    p_trending_id: trendingId,
    p_ritmo_slug: ritmoSlug,
  });
  if (error) throw error;
}

export async function adminAddCandidate(args: {
  trendingId: number;
  ritmoSlug: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  bioShort?: string;
  listName?: string;
}) {
  const { error } = await supabase.rpc("rpc_trending_add_candidate", {
    p_trending_id: args.trendingId,
    p_ritmo_slug: args.ritmoSlug,
    p_user_id: args.userId,
    p_display_name: args.displayName ?? null,
    p_avatar_url: args.avatarUrl ?? null,
    p_bio_short: args.bioShort ?? null,
    p_list_name: args.listName ?? null,
  });
  if (error) throw error;
}

export async function adminRemoveCandidate(trendingId: number, candidateId: number) {
  const { error } = await supabase.rpc("rpc_trending_remove_candidate", {
    p_trending_id: trendingId,
    p_candidate_id: candidateId,
  });
  if (error) throw error;
}

export async function adminUpdateTrending(args: {
  id: number;
  title?: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  allowed_vote_mode?: "per_candidate" | "per_ritmo";
  cover_url?: string | null;
}) {
  const { error } = await supabase.rpc("rpc_trending_update", {
    p_trending_id: args.id,
    p_title: args.title ?? null,
    p_description: args.description ?? null,
    p_starts_at: args.starts_at ?? null,
    p_ends_at: args.ends_at ?? null,
    p_allowed_vote_mode: args.allowed_vote_mode ?? null,
    p_cover_url: args.cover_url ?? null,
  });
  if (error) throw error;
}

// ================================================
// FUNCIONES DE RONDAS
// ================================================

export async function adminSetRoundsConfig(
  trendingId: number,
  roundsConfig: { rounds: RoundConfig[] },
  listsConfig: { lists: ListConfig[] },
  totalRounds: number
) {
  const { error } = await supabase.rpc("rpc_trending_set_rounds_config", {
    p_trending_id: trendingId,
    p_rounds_config: roundsConfig,
    p_lists_config: listsConfig,
    p_total_rounds: totalRounds,
  });
  if (error) throw error;
}

export async function adminStartFirstRound(trendingId: number) {
  const { error } = await supabase.rpc("rpc_trending_start_first_round", {
    p_trending_id: trendingId,
  });
  if (error) throw error;
}

export async function adminCloseRound(trendingId: number, roundNumber: number) {
  const { error } = await supabase.rpc("rpc_trending_close_round", {
    p_trending_id: trendingId,
    p_round_number: roundNumber,
  });
  if (error) throw error;
}

export async function getRoundCandidates(trendingId: number, roundNumber: number) {
  const { data, error } = await supabase.rpc("rpc_trending_get_round_candidates", {
    p_trending_id: trendingId,
    p_round_number: roundNumber,
  });
  if (error) throw error;
  return (data ?? []) as {
    candidate_id: number;
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    bio_short: string | null;
    list_name: string | null;
    votes: number;
  }[];
}

export async function getTrendingRounds(trendingId: number) {
  const { data, error } = await supabase.rpc("rpc_trending_get_rounds", {
    p_trending_id: trendingId,
  });
  if (error) throw error;
  return (data ?? []) as Round[];
}

export async function adminActivatePendingCandidates(trendingId: number) {
  const { error } = await supabase.rpc("rpc_trending_activate_pending_candidates", {
    p_trending_id: trendingId,
  });
  if (error) throw error;
}

export async function debugTrendingCandidates(trendingId: number) {
  const { data, error } = await supabase.rpc("rpc_trending_debug_candidates", {
    p_trending_id: trendingId,
  });
  if (error) throw error;
  return data ?? [];
}


