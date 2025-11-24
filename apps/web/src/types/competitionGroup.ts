export type CompetitionGroupCostType = 'monthly' | 'per_session' | 'package';

export type CompetitionGroupMemberRole = 'student' | 'teacher' | 'assistant';

export type CompetitionGroupInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type CompetitionGroup = {
  id: string;
  owner_id: string;
  academy_id?: number | null;
  name: string;
  description?: string | null;
  training_schedule?: string | null;
  training_location: string;
  cost_type: CompetitionGroupCostType;
  cost_amount: number;
  cover_image_url?: string | null;
  promo_video_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompetitionGroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: CompetitionGroupMemberRole;
  joined_at: string;
  is_active: boolean;
  // Enriched fields
  user_display_name?: string;
  user_avatar_url?: string | null;
};

export type CompetitionGroupInvitation = {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: CompetitionGroupInvitationStatus;
  message?: string | null;
  created_at: string;
  responded_at?: string | null;
  updated_at: string;
  // Enriched fields
  group_name?: string;
  group_cover_image_url?: string | null;
  inviter_display_name?: string;
  invitee_display_name?: string;
};

export type CompetitionGroupFormData = {
  name: string;
  description?: string;
  training_schedule?: string;
  training_location: string;
  cost_type: CompetitionGroupCostType;
  cost_amount: number;
  cover_image_url?: string;
  promo_video_url?: string;
  academy_id?: number | null;
};

