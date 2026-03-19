export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  search_count: number;
  plan: "free" | "pro";
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  bio: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  avatar_url: string | null;
  tags: string[];
  source: "gmail" | "calendar" | "linkedin" | "manual";
  last_interaction_at: string | null;
  interaction_count: number;
  relationship_score: number;
  score_updated_at: string | null;
  reminder_frequency: string | null;
  next_reminder_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  user_id: string;
  platform: "gmail" | "calendar" | "linkedin" | "twitter" | "manual";
  type: "email_sent" | "email_received" | "meeting" | "connection" | "call" | "note" | "meeting_note";
  subject: string | null;
  snippet: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  platform: "google" | "linkedin";
  status: "active" | "expired" | "revoked" | "needs_reauth";
  scopes: string[];
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestionJob {
  id: string;
  user_id: string;
  platform: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_items: number;
  processed_items: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SearchResult {
  contact_id: string;
  full_name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  avatar_url: string | null;
  tags: string[];
  last_interaction_at: string | null;
  similarity: number;
  why_matched?: string;
  matched_fields?: string[];
}

export interface SearchQuery {
  searchText: string;
  filters: {
    location?: string;
    platform?: string;
    dateAfter?: string;
    dateBefore?: string;
    tags?: string[];
  };
}

export interface ResearchProfileData {
  summary: string;
  current_role: {
    title: string;
    company: string;
    description: string;
  } | null;
  career_history: {
    title: string;
    company: string;
    period: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    year: string;
  }[];
  skills: string[];
  interests: string[];
  notable_achievements: string[];
  social_presence: {
    linkedin: string | null;
    twitter: string | null;
    github: string | null;
    website: string | null;
  };
  talking_points: string[];
  personality_insights: string;
  industry: string;
  location: string | null;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: Profile;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  email: string;
  invite_code: string;
  status: "pending" | "accepted";
  accepted_by: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile?: Profile;
}

export interface GroupBot {
  id: string;
  group_id: string;
  platform: "slack" | "discord" | "email";
  status: "pending" | "active" | "disconnected";
  config: Record<string, string>;
  webhook_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: "fundraising" | "hiring" | "sales" | "custom";
  created_at: string;
  updated_at: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
  cards?: PipelineCard[];
}

export interface PipelineCard {
  id: string;
  stage_id: string;
  contact_id: string;
  user_id: string;
  position: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

export interface TagDefinition {
  id: string;
  user_id: string;
  name: string;
  criteria: string;
  color: string;
  auto_assign: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
}

export interface ResearchProfile {
  id: string;
  user_id: string;
  contact_id: string | null;
  query_name: string;
  query_context: string | null;
  status: "pending" | "researching" | "completed" | "failed";
  profile_data: ResearchProfileData | null;
  sources: ResearchSource[];
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
}
