-- Network-aware semantic search that can search across multiple users' contacts
-- Used for friend/group network sharing
create or replace function public.network_semantic_search(
  query_embedding vector(1536),
  match_user_ids uuid[],
  match_count int default 30,
  filter_location text default null,
  filter_platform text default null,
  filter_after timestamptz default null
)
returns table (
  contact_id uuid,
  owner_user_id uuid,
  full_name text,
  email text,
  company text,
  title text,
  location text,
  bio text,
  tags text[],
  linkedin_url text,
  twitter_handle text,
  avatar_url text,
  relationship_score integer,
  source text,
  last_interaction_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id as contact_id,
    c.user_id as owner_user_id,
    c.full_name,
    c.email,
    c.company,
    c.title,
    c.location,
    c.bio,
    c.tags,
    c.linkedin_url,
    c.twitter_handle,
    c.avatar_url,
    c.relationship_score,
    c.source,
    c.last_interaction_at,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.contact_embeddings ce
  join public.contacts c on c.id = ce.contact_id
  where ce.user_id = ANY(match_user_ids)
    and (filter_location is null or c.location ilike '%' || filter_location || '%')
    and (filter_platform is null or c.source = filter_platform)
    and (filter_after is null or c.last_interaction_at >= filter_after)
  order by ce.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Also update the original semantic_search to return extra fields
create or replace function public.semantic_search(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count int default 20,
  filter_location text default null,
  filter_platform text default null,
  filter_after timestamptz default null
)
returns table (
  contact_id uuid,
  full_name text,
  email text,
  company text,
  title text,
  location text,
  bio text,
  tags text[],
  linkedin_url text,
  twitter_handle text,
  avatar_url text,
  relationship_score integer,
  source text,
  last_interaction_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id as contact_id,
    c.full_name,
    c.email,
    c.company,
    c.title,
    c.location,
    c.bio,
    c.tags,
    c.linkedin_url,
    c.twitter_handle,
    c.avatar_url,
    c.relationship_score,
    c.source,
    c.last_interaction_at,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.contact_embeddings ce
  join public.contacts c on c.id = ce.contact_id
  where ce.user_id = match_user_id
    and (filter_location is null or c.location ilike '%' || filter_location || '%')
    and (filter_platform is null or c.source = filter_platform)
    and (filter_after is null or c.last_interaction_at >= filter_after)
  order by ce.embedding <=> query_embedding
  limit match_count;
end;
$$;
