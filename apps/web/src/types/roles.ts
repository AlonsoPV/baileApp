export type RoleSlug = 'usuario' | 'organizador' | 'academia' | 'maestro' | 'marca';
export type RoleRequestStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export type Role = { id: string; slug: RoleSlug; name: string };
export type UserRole = { id: string; user_id: string; role_slug: RoleSlug; created_at: string };

export type RoleRequest = {
  id: string;
  user_id: string;
  role_slug: RoleSlug;
  full_name: string;
  email?: string | null;
  phone: string;
  socials: Partial<Record<'instagram'|'tiktok'|'youtube'|'facebook'|'whatsapp', string>>;
  status: RoleRequestStatus;
  admin_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};


