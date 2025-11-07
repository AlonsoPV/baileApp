import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type Challenge = {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  ritmo_slug?: string | null;
  cover_image_url?: string | null;
  owner_video_url?: string | null;
  requirements?: string[] | null;
  status: string;
  visibility?: string | null;
  submission_deadline?: string | null;
  voting_deadline?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Submission = {
  id: string;
  challenge_id: string;
  user_id: string;
  video_url: string;
  caption?: string | null;
  status: string;
  created_at?: string;
};

export function useChallengesList() {
  return useQuery({
    queryKey: ['challenges','list'],
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Challenge[]) || [];
    }
  });
}

export function useChallenge(id?: string) {
  return useQuery({
    queryKey: ['challenges','detail', id],
    enabled: !!id,
    queryFn: async (): Promise<Challenge|null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Challenge | null;
    }
  });
}

export function useChallengeSubmissions(id?: string) {
  return useQuery({
    queryKey: ['challenges','submissions', id],
    enabled: !!id,
    queryFn: async (): Promise<Submission[]> => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('challenge_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Submission[]) || [];
    }
  });
}

export function useChallengeCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string | null;
      ritmo_slug?: string | null;
      cover_image_url?: string | null;
      owner_video_url?: string | null;
      submission_deadline?: string | null;
      voting_deadline?: string | null;
      requirements?: string[];
    }): Promise<string> => {
      const { data, error } = await supabase.rpc('challenge_create', {
        p_title: payload.title,
        p_description: payload.description ?? null,
        p_ritmo_slug: payload.ritmo_slug ?? null,
        p_cover_image_url: payload.cover_image_url ?? null,
        p_owner_video_url: payload.owner_video_url ?? null,
        p_submission_deadline: payload.submission_deadline ?? null,
        p_voting_deadline: payload.voting_deadline ?? null,
        p_requirements: payload.requirements ?? []
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges','list'] });
    }
  });
}

export function useChallengePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase.rpc('challenge_publish', { p_id: challengeId });
      if (error) throw error;
    },
    onSuccess: (_, challengeId) => {
      qc.invalidateQueries({ queryKey: ['challenges','detail', challengeId] });
      qc.invalidateQueries({ queryKey: ['challenges','list'] });
    }
  });
}

export function useChallengeSubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { challengeId: string; video_url: string; caption?: string | null; }): Promise<string> => {
      const { data, error } = await supabase.rpc('challenge_submit', {
        p_challenge_id: payload.challengeId,
        p_video_url: payload.video_url,
        p_caption: payload.caption ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ['challenges','submissions', payload.challengeId] });
    }
  });
}

export function useSubmissionApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc('challenge_approve_submission', { p_submission_id: submissionId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges','submissions'] });
      qc.invalidateQueries({ queryKey: ['challenges','list'] });
    }
  });
}

export function useSubmissionReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc('challenge_reject_submission', { p_submission_id: submissionId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges','submissions'] });
    }
  });
}

export function useToggleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc('challenge_toggle_vote', { p_submission_id: submissionId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges','leaderboard'] });
    }
  });
}

export function useChallengeLeaderboard(challengeId?: string) {
  return useQuery({
    queryKey: ['challenges','leaderboard', challengeId],
    enabled: !!challengeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_challenge_leaderboard')
        .select('*')
        .eq('challenge_id', challengeId);
      if (error) throw error;
      return data as { challenge_id: string; submission_id: string; user_id: string; votes: number }[];
    }
  });
}


