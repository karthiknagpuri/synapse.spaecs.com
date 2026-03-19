# Synapse MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working Phase 1 MVP of Synapse — an AI-powered network search platform with Google OAuth, Gmail/Calendar ingestion, LinkedIn CSV import, and natural language semantic search via pgvector.

**Architecture:** Next.js 15 App Router with Supabase (PostgreSQL + pgvector) backend. OpenAI GPT-4o-mini for NLP query translation and explanation generation. text-embedding-3-small for vector embeddings. Apple-inspired purple-accent UI with Shadcn components.

**Tech Stack:** Next.js 15, TypeScript, Supabase, pgvector, OpenAI, TailwindCSS, Shadcn UI, Vercel

**Project Directory:** `/Users/karthiknagapuri/Downloads/SynapseAI.com`

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `.env.local.example`, `.gitignore`
- Create: `components.json` (Shadcn config)

**Step 1: Initialize Next.js project**

```bash
cd /Users/karthiknagapuri/Downloads/SynapseAI.com
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full scaffold.

**Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr openai lucide-react date-fns clsx tailwind-merge class-variance-authority
```

**Step 3: Initialize Shadcn UI**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables: yes.

**Step 4: Install Shadcn components**

```bash
npx shadcn@latest add button card input label separator avatar badge dialog dropdown-menu sheet skeleton tabs textarea toast sonner command scroll-area progress
```

**Step 5: Create .env.local.example**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Google OAuth (for Gmail/Calendar API access beyond Supabase Auth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 6: Set up globals.css with purple theme**

Replace `src/app/globals.css` with Tailwind base + purple CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 263 70% 58%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 263 70% 58%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 263 70% 58%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

**Step 7: Update tailwind.config.ts for Inter font**

Ensure `fontFamily` includes Inter:

```ts
// In tailwind.config.ts, under theme.extend:
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
},
```

**Step 8: Verify dev server runs**

```bash
npm run dev
```

Expected: App runs on localhost:3000 with Next.js default page.

**Step 9: Initialize git and commit**

```bash
cd /Users/karthiknagapuri/Downloads/SynapseAI.com
git init
git add -A
git commit -m "feat: scaffold Next.js 15 project with Shadcn UI and purple theme"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Define all shared types**

```typescript
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
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  user_id: string;
  platform: "gmail" | "calendar" | "linkedin" | "twitter";
  type: "email_sent" | "email_received" | "meeting" | "connection";
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
  status: "active" | "expired" | "revoked";
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
  tags: string[];
  last_interaction_at: string | null;
  similarity: number;
  why_matched?: string;
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
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions for all entities"
```

---

## Task 3: Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Write the full migration SQL**

```sql
-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  search_count integer default 0,
  plan text default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Contacts table
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  email text,
  phone text,
  company text,
  title text,
  location text,
  bio text,
  linkedin_url text,
  twitter_handle text,
  avatar_url text,
  tags text[] default '{}',
  source text default 'manual' check (source in ('gmail', 'calendar', 'linkedin', 'manual')),
  last_interaction_at timestamptz,
  interaction_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, email)
);

alter table public.contacts enable row level security;

create policy "Users can CRUD own contacts"
  on public.contacts for all using (auth.uid() = user_id);

create index idx_contacts_user_id on public.contacts(user_id);
create index idx_contacts_email on public.contacts(user_id, email);
create index idx_contacts_location on public.contacts(location);

-- Interactions table
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null check (platform in ('gmail', 'calendar', 'linkedin', 'twitter')),
  type text not null check (type in ('email_sent', 'email_received', 'meeting', 'connection')),
  subject text,
  snippet text,
  metadata jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.interactions enable row level security;

create policy "Users can CRUD own interactions"
  on public.interactions for all using (auth.uid() = user_id);

create index idx_interactions_contact on public.interactions(contact_id);
create index idx_interactions_user on public.interactions(user_id);
create index idx_interactions_date on public.interactions(occurred_at);

-- Contact embeddings table (pgvector)
create table public.contact_embeddings (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade unique not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  embedding vector(1536),
  content_hash text,
  updated_at timestamptz default now()
);

alter table public.contact_embeddings enable row level security;

create policy "Users can CRUD own embeddings"
  on public.contact_embeddings for all using (auth.uid() = user_id);

create index idx_embeddings_user on public.contact_embeddings(user_id);

-- IVFFlat index for fast vector search (create after initial data load)
-- For <1000 rows, use exact search. For larger: lists = sqrt(num_rows)
create index idx_embeddings_vector on public.contact_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Integrations table
create table public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null check (platform in ('google', 'linkedin')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  status text default 'active' check (status in ('active', 'expired', 'revoked')),
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

alter table public.integrations enable row level security;

create policy "Users can CRUD own integrations"
  on public.integrations for all using (auth.uid() = user_id);

-- Ingestion jobs table
create table public.ingestion_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_items integer default 0,
  processed_items integer default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.ingestion_jobs enable row level security;

create policy "Users can view own jobs"
  on public.ingestion_jobs for all using (auth.uid() = user_id);

-- Semantic search RPC function
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
  tags text[],
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
    c.tags,
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

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at before update on public.contacts
  for each row execute function public.update_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger integrations_updated_at before update on public.integrations
  for each row execute function public.update_updated_at();
```

**Step 2: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with pgvector, RLS, and semantic search RPC"
```

**Note for executor:** This SQL must be run in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste and run). The user needs to:
1. Create a Supabase project at supabase.com
2. Enable the `vector` extension (Database → Extensions → search "vector" → enable)
3. Run this migration SQL
4. Copy the project URL and anon key to `.env.local`

---

## Task 4: Supabase Client Libraries

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

**Step 1: Browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 2: Server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore — called from Server Component
          }
        },
      },
    }
  );
}
```

**Step 3: Middleware helper**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from dashboard
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Step 4: Root middleware**

```typescript
// src/middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client, server, and middleware auth helpers"
```

---

## Task 5: Auth Flow (Login + Callback)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/auth/callback/route.ts`

**Step 1: Login page**

```typescript
// src/app/(auth)/login/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm mx-auto text-center space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-semibold tracking-tight">Synapse</h1>
          </div>
          <p className="text-muted-foreground">
            Your network, searchable.
          </p>
        </div>

        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full h-12 text-base gap-3 border-gray-200 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-xs text-muted-foreground">
          We request read-only access to Gmail and Calendar to build your network graph. We never store full email bodies.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: OAuth callback handler**

```typescript
// src/app/(auth)/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Store the provider token for Gmail/Calendar API access
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;

      if (providerToken) {
        await supabase.from("integrations").upsert(
          {
            user_id: data.session.user.id,
            platform: "google",
            access_token: providerToken,
            refresh_token: providerRefreshToken,
            token_expires_at: new Date(
              Date.now() + 3600 * 1000
            ).toISOString(),
            scopes: ["gmail.readonly", "calendar.readonly"],
            status: "active",
          },
          { onConflict: "user_id,platform" }
        );
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

**Step 3: Verify login flow works**

Run dev server, navigate to `/login`. Click "Continue with Google". Should redirect to Google OAuth, then back to `/dashboard` (which will 404 for now — that's fine).

**Step 4: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add Google OAuth login with Gmail/Calendar scopes"
```

---

## Task 6: OpenAI Library

**Files:**
- Create: `src/lib/openai.ts`

**Step 1: Create OpenAI utility functions**

```typescript
// src/lib/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function translateQuery(
  naturalLanguageQuery: string
): Promise<{
  searchText: string;
  filters: {
    location?: string;
    platform?: string;
    dateAfter?: string;
    dateBefore?: string;
    tags?: string[];
  };
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a search query translator. Convert natural language queries about a user's professional network into structured search parameters.

Return JSON with:
- searchText: the core semantic search terms (what to embed and search for)
- filters: optional SQL filters
  - location: city/region if mentioned
  - platform: "gmail" | "calendar" | "linkedin" if a specific source is mentioned
  - dateAfter: ISO date string if time mentioned (e.g., "last year" = start of last year)
  - dateBefore: ISO date string if time range end mentioned
  - tags: array of tags if specific roles/categories mentioned

Examples:
"Founders in Hyderabad I emailed about Web3 last year" →
{ "searchText": "Web3 founder startup blockchain", "filters": { "location": "Hyderabad", "platform": "gmail", "dateAfter": "2025-01-01", "dateBefore": "2025-12-31" } }

"designers I met at conferences" →
{ "searchText": "designer UX UI design conference event", "filters": { "platform": "calendar" } }

"people at Google" →
{ "searchText": "Google engineer product manager", "filters": {} }

Current date: ${new Date().toISOString().split("T")[0]}`,
      },
      { role: "user", content: naturalLanguageQuery },
    ],
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateWhyMatched(
  query: string,
  contact: {
    full_name: string;
    company?: string | null;
    title?: string | null;
    location?: string | null;
    tags?: string[];
    interactions?: { type: string; subject: string | null; occurred_at: string }[];
  }
): Promise<string> {
  const interactionSummary = contact.interactions
    ?.slice(0, 3)
    .map(
      (i) =>
        `${i.type} ${i.subject ? `about "${i.subject}"` : ""} on ${new Date(i.occurred_at).toLocaleDateString()}`
    )
    .join("; ");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 100,
    messages: [
      {
        role: "system",
        content:
          "Generate a brief 1-2 sentence explanation of why this contact matched the search query. Be specific and reference actual data points. Start with 'Matched:'",
      },
      {
        role: "user",
        content: `Query: "${query}"
Contact: ${contact.full_name}, ${contact.title || "N/A"} at ${contact.company || "N/A"}, ${contact.location || "N/A"}
Tags: ${contact.tags?.join(", ") || "none"}
Recent interactions: ${interactionSummary || "none"}`,
      },
    ],
  });

  return response.choices[0].message.content || "Matched based on relevance.";
}

export async function generateContactEmbeddingText(contact: {
  full_name: string;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  bio?: string | null;
  tags?: string[];
  interactions?: { subject?: string | null; snippet?: string | null }[];
}): string {
  const parts = [
    contact.full_name,
    contact.title,
    contact.company,
    contact.location,
    contact.bio,
    contact.tags?.join(", "),
    contact.interactions
      ?.slice(0, 10)
      .map((i) => [i.subject, i.snippet].filter(Boolean).join(" "))
      .join(". "),
  ].filter(Boolean);

  return parts.join(" | ");
}
```

**Step 2: Commit**

```bash
git add src/lib/openai.ts
git commit -m "feat: add OpenAI utility for embeddings, query translation, and why-matched"
```

---

## Task 7: Dashboard Layout Shell

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/components/topbar.tsx`

**Step 1: Sidebar component**

```typescript
// src/components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  Plug,
  Settings,
  Zap,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <Zap className="h-6 w-6 text-purple-600" />
        <span className="text-lg font-semibold tracking-tight">Synapse</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 2: Topbar component**

```typescript
// src/components/topbar.tsx
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function Topbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-gray-200 bg-white">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user?.user_metadata?.full_name || user?.email}
        </span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
```

**Step 3: Dashboard layout**

```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx src/components/sidebar.tsx src/components/topbar.tsx
git commit -m "feat: add dashboard layout with sidebar and topbar"
```

---

## Task 8: Landing Page

**Files:**
- Create: `src/app/(marketing)/layout.tsx`
- Create: `src/app/(marketing)/page.tsx`
- Remove default: `src/app/page.tsx` (move to marketing group)

**Step 1: Marketing layout**

```typescript
// src/app/(marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Step 2: Landing page**

Build a clean, Apple-inspired landing with:
- Navigation bar with Synapse logo + "Sign In" button
- Hero section: big headline, subtitle, search bar demo, CTA
- Features grid: 4 cards (Network Search, Gmail Sync, Calendar Intelligence, LinkedIn Import)
- How It Works: 3-step flow
- Footer with minimal links

The landing page should use the purple accent (#7C3AED), be entirely white/gray background, no gradients, thin borders, generous whitespace.

```typescript
// src/app/(marketing)/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Search, Mail, Calendar, FileText, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Natural Language Search",
    description:
      "Ask in plain English. Find anyone in your network with AI-powered semantic search.",
  },
  {
    icon: Mail,
    title: "Gmail Intelligence",
    description:
      "Automatically extract contacts and context from your email history. Read-only, private.",
  },
  {
    icon: Calendar,
    title: "Calendar Context",
    description:
      "Know who you've met, when, and what you discussed. Your meetings become searchable.",
  },
  {
    icon: FileText,
    title: "LinkedIn Import",
    description:
      "Upload your connections CSV. Synapse merges everything into one unified graph.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect",
    description: "Sign in with Google. We sync your Gmail and Calendar contacts with read-only access.",
  },
  {
    number: "02",
    title: "Search",
    description: "Type natural language queries like \"VCs in SF I met last quarter\" and get instant results.",
  },
  {
    number: "03",
    title: "Discover",
    description: "Uncover hidden connections. Every result shows exactly why it matched your query.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-purple-600" />
          <span className="text-lg font-semibold tracking-tight">Synapse</span>
        </div>
        <Link href="/login">
          <Button variant="ghost" className="text-sm">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-sm mb-6">
          <Zap className="h-3.5 w-3.5" />
          AI-Powered Network Intelligence
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-gray-900 leading-tight">
          Your network,
          <br />
          <span className="text-purple-600">searchable.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Synapse connects your Gmail, Calendar, and LinkedIn into one unified
          graph. Search your entire professional network using natural language.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/login">
            <Button className="h-12 px-8 text-base bg-purple-600 hover:bg-purple-700">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Search demo */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <Search className="h-5 w-5 text-gray-400" />
            <span className="text-gray-400 text-left">
              &quot;Find me startup founders in Mumbai I haven&apos;t spoken to in 6 months&quot;
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            Everything connected
          </h2>
          <p className="mt-3 text-gray-500">
            One search across all your professional touchpoints.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-gray-200 bg-white"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-purple-50 mb-4">
                <feature.icon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            Three steps to network clarity
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-4xl font-semibold text-purple-200 mb-3">
                {step.number}
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-12 rounded-2xl border border-gray-200 bg-white">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            Ready to search your network?
          </h2>
          <p className="mt-3 text-gray-500">
            Free to start. No credit card required.
          </p>
          <Link href="/login">
            <Button className="mt-8 h-12 px-8 text-base bg-purple-600 hover:bg-purple-700">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Zap className="h-4 w-4" />
            Synapse
          </div>
          <p className="text-sm text-gray-400">
            Privacy-first network intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 3: Remove/replace default page.tsx**

Delete `src/app/page.tsx` if it exists (the marketing route group handles `/` now). Or keep it as a redirect.

Actually, the `(marketing)` route group with `page.tsx` inside it will serve as the `/` route. The original `src/app/page.tsx` must be deleted to avoid conflict.

```bash
rm src/app/page.tsx  # if exists after scaffold
```

**Step 4: Verify landing page renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Should see the full landing page.

**Step 5: Commit**

```bash
git add src/app/\(marketing\)/ && git rm src/app/page.tsx 2>/dev/null; git add -A
git commit -m "feat: add marketing landing page with purple theme"
```

---

## Task 9: Dashboard Home Page

**Files:**
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/search-bar.tsx`

**Step 1: Search bar component**

```typescript
// src/components/search-bar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your network in plain English..."
          className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600 animate-spin" />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {[
          "Founders in Hyderabad",
          "People I emailed last month",
          "Designers at startups",
          "VCs I met this year",
        ].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuery(suggestion);
            }}
            className="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </form>
  );
}
```

**Step 2: Dashboard home page**

```typescript
// src/app/(dashboard)/page.tsx
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/search-bar";
import { Users, Mail, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch stats
  const { count: contactCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  const { count: interactionCount } = await supabase
    .from("interactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  const { data: integrations } = await supabase
    .from("integrations")
    .select("platform, status")
    .eq("user_id", user?.id);

  const stats = [
    {
      label: "Contacts",
      value: contactCount || 0,
      icon: Users,
    },
    {
      label: "Interactions",
      value: interactionCount || 0,
      icon: Mail,
    },
    {
      label: "Integrations",
      value: integrations?.filter((i) => i.status === "active").length || 0,
      icon: Calendar,
    },
  ];

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Greeting + Search */}
      <div className="pt-8 text-center space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Hey {firstName}
          </h1>
          <p className="text-gray-500 mt-1">
            Search your network in plain English.
          </p>
        </div>
        <SearchBar />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-50">
              <stat.icon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx src/components/search-bar.tsx
git commit -m "feat: add dashboard home with search bar and stats"
```

---

## Task 10: Search API Route

**Files:**
- Create: `src/app/api/search/route.ts`

**Step 1: Implement the search endpoint**

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, translateQuery, generateWhyMatched } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Step 1: Translate natural language to structured query
    const structured = await translateQuery(query);

    // Step 2: Generate embedding for search text
    const embedding = await generateEmbedding(structured.searchText);

    // Step 3: Call Supabase RPC for hybrid search
    const { data: results, error } = await supabase.rpc("semantic_search", {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user.id,
      match_count: 20,
      filter_location: structured.filters.location || null,
      filter_platform: structured.filters.platform || null,
      filter_after: structured.filters.dateAfter || null,
    });

    if (error) {
      console.error("Search RPC error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    // Step 4: Generate "Why matched" for top results
    const enrichedResults = await Promise.all(
      (results || []).slice(0, 10).map(async (result: any) => {
        // Fetch recent interactions for context
        const { data: interactions } = await supabase
          .from("interactions")
          .select("type, subject, occurred_at")
          .eq("contact_id", result.contact_id)
          .order("occurred_at", { ascending: false })
          .limit(3);

        const whyMatched = await generateWhyMatched(query, {
          full_name: result.full_name,
          company: result.company,
          title: result.title,
          location: result.location,
          tags: result.tags,
          interactions: interactions || [],
        });

        return {
          ...result,
          why_matched: whyMatched,
        };
      })
    );

    // Increment search count
    await supabase.rpc("increment_search_count", { user_id: user.id }).catch(() => {});

    return NextResponse.json({
      results: enrichedResults,
      structured_query: structured,
      total: enrichedResults.length,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/search/route.ts
git commit -m "feat: add semantic search API with query translation and why-matched"
```

---

## Task 11: Search Results Page

**Files:**
- Create: `src/app/(dashboard)/search/page.tsx`
- Create: `src/components/contact-card.tsx`
- Create: `src/components/why-matched.tsx`

**Step 1: Contact card component**

```typescript
// src/components/contact-card.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { SearchResult } from "@/types";

export function ContactCard({
  result,
  whyMatched,
}: {
  result: SearchResult;
  whyMatched?: string;
}) {
  const initials = result.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/dashboard/contacts/${result.contact_id}`}>
      <div className="p-5 rounded-xl border border-gray-200 bg-white hover:border-purple-200 transition-colors">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">
                {result.full_name}
              </h3>
              {result.similarity > 0.8 && (
                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                  Strong match
                </Badge>
              )}
            </div>
            {(result.title || result.company) && (
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {[result.title, result.company].filter(Boolean).join(" at ")}
              </p>
            )}
            {result.location && (
              <p className="text-xs text-gray-400 mt-0.5">{result.location}</p>
            )}
            {result.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {whyMatched && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-700 leading-relaxed">
                  {whyMatched}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">
              {Math.round(result.similarity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Search results page**

```typescript
// src/app/(dashboard)/search/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { SearchBar } from "@/components/search-bar";
import { ContactCard } from "@/components/contact-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { SearchResult } from "@/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query) return;

    const doSearch = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <SearchBar />

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-start gap-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No results found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Try a different query or connect more platforms to expand your network.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {results.length} result{results.length !== 1 && "s"} for &quot;{query}&quot;
          </p>
          {results.map((result) => (
            <ContactCard
              key={result.contact_id}
              result={result}
              whyMatched={result.why_matched}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/search/ src/components/contact-card.tsx
git commit -m "feat: add search results page with contact cards and why-matched"
```

---

## Task 12: Gmail Ingestion API

**Files:**
- Create: `src/lib/integrations/gmail.ts`
- Create: `src/app/api/ingest/gmail/route.ts`

**Step 1: Gmail parser utility**

```typescript
// src/lib/integrations/gmail.ts
export interface GmailThread {
  id: string;
  messages: {
    from: string;
    to: string[];
    subject: string;
    snippet: string;
    date: string;
  }[];
}

export function parseEmailAddress(
  header: string
): { name: string; email: string } | null {
  // "Karthik Nagapuri <karthik@example.com>" → { name: "Karthik Nagapuri", email: "karthik@example.com" }
  const match = header.match(/^"?(.+?)"?\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].toLowerCase() };

  // "karthik@example.com" → { name: "", email: "karthik@example.com" }
  const emailMatch = header.match(/([^\s<>]+@[^\s<>]+)/);
  if (emailMatch)
    return { name: "", email: emailMatch[1].toLowerCase() };

  return null;
}

export function extractHeader(
  headers: { name: string; value: string }[],
  name: string
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

export async function fetchGmailThreads(
  accessToken: string,
  maxResults: number = 200
): Promise<any[]> {
  const threads: any[] = [];
  let pageToken = "";

  while (threads.length < maxResults) {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/threads");
    url.searchParams.set("maxResults", String(Math.min(100, maxResults - threads.length)));
    url.searchParams.set("labelIds", "SENT");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);

    const data = await res.json();
    if (!data.threads) break;

    threads.push(...data.threads);
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return threads;
}

export async function fetchThreadDetail(
  accessToken: string,
  threadId: string
): Promise<any> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`Gmail thread fetch error: ${res.status}`);
  return res.json();
}
```

**Step 2: Gmail ingestion API route**

```typescript
// src/app/api/ingest/gmail/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGmailThreads,
  fetchThreadDetail,
  parseEmailAddress,
  extractHeader,
} from "@/lib/integrations/gmail";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Google access token
    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("platform", "google")
      .eq("status", "active")
      .single();

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 400 }
      );
    }

    // Create ingestion job
    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "gmail",
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Fetch threads
    const threads = await fetchGmailThreads(integration.access_token, 200);

    let processed = 0;
    const contactsMap = new Map<string, any>();

    for (const thread of threads) {
      try {
        const detail = await fetchThreadDetail(
          integration.access_token,
          thread.id
        );

        for (const message of detail.messages || []) {
          const headers = message.payload?.headers || [];
          const from = parseEmailAddress(extractHeader(headers, "From"));
          const toRaw = extractHeader(headers, "To");
          const subject = extractHeader(headers, "Subject");
          const date = extractHeader(headers, "Date");

          // Skip self-emails
          if (from && from.email !== user.email) {
            if (!contactsMap.has(from.email)) {
              contactsMap.set(from.email, {
                email: from.email,
                name: from.name,
                interactions: [],
              });
            }
            contactsMap.get(from.email)!.interactions.push({
              type: "email_received",
              subject,
              snippet: message.snippet?.slice(0, 200) || "",
              date,
            });
          }

          // Parse To addresses
          const toAddresses = toRaw.split(",").map((t: string) => parseEmailAddress(t.trim())).filter(Boolean);
          for (const to of toAddresses) {
            if (to && to.email !== user.email) {
              if (!contactsMap.has(to.email)) {
                contactsMap.set(to.email, {
                  email: to.email,
                  name: to.name,
                  interactions: [],
                });
              }
              contactsMap.get(to.email)!.interactions.push({
                type: "email_sent",
                subject,
                snippet: message.snippet?.slice(0, 200) || "",
                date,
              });
            }
          }
        }

        processed++;
      } catch (err) {
        console.error(`Error processing thread ${thread.id}:`, err);
      }
    }

    // Upsert contacts and interactions
    let contactsCreated = 0;
    for (const [email, data] of contactsMap) {
      // Upsert contact
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .upsert(
          {
            user_id: user.id,
            email: email,
            full_name: data.name || email.split("@")[0],
            source: "gmail",
            interaction_count: data.interactions.length,
            last_interaction_at: data.interactions[0]?.date
              ? new Date(data.interactions[0].date).toISOString()
              : null,
          },
          { onConflict: "user_id,email" }
        )
        .select("id")
        .single();

      if (contactError || !contact) continue;

      // Insert interactions
      const interactions = data.interactions.slice(0, 20).map((i: any) => ({
        contact_id: contact.id,
        user_id: user.id,
        platform: "gmail" as const,
        type: i.type,
        subject: i.subject?.slice(0, 200),
        snippet: i.snippet,
        occurred_at: i.date ? new Date(i.date).toISOString() : new Date().toISOString(),
      }));

      await supabase.from("interactions").insert(interactions);
      contactsCreated++;
    }

    // Update job
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        total_items: threads.length,
        processed_items: processed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      threads_processed: processed,
      contacts_created: contactsCreated,
    });
  } catch (err: any) {
    console.error("Gmail ingestion error:", err);
    return NextResponse.json(
      { error: err.message || "Ingestion failed" },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/integrations/gmail.ts src/app/api/ingest/gmail/route.ts
git commit -m "feat: add Gmail ingestion pipeline with contact extraction"
```

---

## Task 13: Calendar Ingestion API

**Files:**
- Create: `src/lib/integrations/calendar.ts`
- Create: `src/app/api/ingest/calendar/route.ts`

**Step 1: Calendar parser utility**

```typescript
// src/lib/integrations/calendar.ts
export async function fetchCalendarEvents(
  accessToken: string,
  maxResults: number = 100
): Promise<any[]> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("timeMin", oneYearAgo.toISOString());
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("singleEvents", "true");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);

  const data = await res.json();
  return data.items || [];
}
```

**Step 2: Calendar ingestion API route**

```typescript
// src/app/api/ingest/calendar/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCalendarEvents } from "@/lib/integrations/calendar";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("platform", "google")
      .eq("status", "active")
      .single();

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 400 }
      );
    }

    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "calendar",
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const events = await fetchCalendarEvents(integration.access_token, 100);

    let contactsCreated = 0;

    for (const event of events) {
      const attendees = event.attendees || [];

      for (const attendee of attendees) {
        if (attendee.self || !attendee.email) continue;

        const { data: contact } = await supabase
          .from("contacts")
          .upsert(
            {
              user_id: user.id,
              email: attendee.email.toLowerCase(),
              full_name:
                attendee.displayName || attendee.email.split("@")[0],
              source: "calendar",
            },
            { onConflict: "user_id,email" }
          )
          .select("id")
          .single();

        if (!contact) continue;

        await supabase.from("interactions").insert({
          contact_id: contact.id,
          user_id: user.id,
          platform: "calendar",
          type: "meeting",
          subject: event.summary?.slice(0, 200),
          snippet: event.description?.slice(0, 200),
          metadata: {
            location: event.location,
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
          },
          occurred_at:
            event.start?.dateTime ||
            event.start?.date ||
            new Date().toISOString(),
        });

        // Update contact's last interaction
        await supabase
          .from("contacts")
          .update({
            last_interaction_at:
              event.start?.dateTime || event.start?.date,
            interaction_count: contact.id
              ? (
                  await supabase
                    .from("interactions")
                    .select("*", { count: "exact", head: true })
                    .eq("contact_id", contact.id)
                ).count || 0
              : 0,
          })
          .eq("id", contact.id);

        contactsCreated++;
      }
    }

    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        total_items: events.length,
        processed_items: events.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      events_processed: events.length,
      contacts_created: contactsCreated,
    });
  } catch (err: any) {
    console.error("Calendar ingestion error:", err);
    return NextResponse.json(
      { error: err.message || "Ingestion failed" },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/integrations/calendar.ts src/app/api/ingest/calendar/route.ts
git commit -m "feat: add Calendar ingestion pipeline with attendee extraction"
```

---

## Task 14: LinkedIn CSV Ingestion

**Files:**
- Create: `src/lib/integrations/linkedin.ts`
- Create: `src/app/api/ingest/linkedin/route.ts`

**Step 1: LinkedIn CSV parser**

```typescript
// src/lib/integrations/linkedin.ts
export interface LinkedInContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
  url: string;
}

export function parseLinkedInCSV(csvText: string): LinkedInContact[] {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const contacts: LinkedInContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    contacts.push({
      firstName: row["First Name"] || "",
      lastName: row["Last Name"] || "",
      email: row["Email Address"] || "",
      company: row["Company"] || "",
      position: row["Position"] || "",
      connectedOn: row["Connected On"] || "",
      url: row["URL"] || "",
    });
  }

  return contacts.filter((c) => c.firstName || c.lastName);
}
```

**Step 2: LinkedIn ingestion API route**

```typescript
// src/app/api/ingest/linkedin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseLinkedInCSV } from "@/lib/integrations/linkedin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const csvText = await file.text();
    const linkedInContacts = parseLinkedInCSV(csvText);

    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "linkedin",
        status: "processing",
        total_items: linkedInContacts.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    let processed = 0;

    for (const lc of linkedInContacts) {
      const fullName = `${lc.firstName} ${lc.lastName}`.trim();

      const { data: contact } = await supabase
        .from("contacts")
        .upsert(
          {
            user_id: user.id,
            email: lc.email || null,
            full_name: fullName,
            company: lc.company || null,
            title: lc.position || null,
            linkedin_url: lc.url || null,
            source: "linkedin",
            last_interaction_at: lc.connectedOn
              ? new Date(lc.connectedOn).toISOString()
              : null,
          },
          {
            onConflict: "user_id,email",
            ignoreDuplicates: !lc.email, // Skip if no email (can't deduplicate)
          }
        )
        .select("id")
        .single();

      if (contact) {
        await supabase.from("interactions").insert({
          contact_id: contact.id,
          user_id: user.id,
          platform: "linkedin",
          type: "connection",
          subject: `Connected on LinkedIn`,
          snippet: `${lc.position} at ${lc.company}`,
          occurred_at: lc.connectedOn
            ? new Date(lc.connectedOn).toISOString()
            : new Date().toISOString(),
        });
      }

      processed++;
    }

    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        processed_items: processed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      contacts_imported: processed,
      total_in_csv: linkedInContacts.length,
    });
  } catch (err: any) {
    console.error("LinkedIn ingestion error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/integrations/linkedin.ts src/app/api/ingest/linkedin/route.ts
git commit -m "feat: add LinkedIn CSV import pipeline"
```

---

## Task 15: Embeddings Generation API

**Files:**
- Create: `src/app/api/embeddings/route.ts`

**Step 1: Batch embeddings endpoint**

```typescript
// src/app/api/embeddings/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, generateContactEmbeddingText } from "@/lib/openai";
import crypto from "crypto";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contacts without embeddings or with stale embeddings
    const { data: contacts } = await supabase
      .from("contacts")
      .select(
        `
        id, full_name, company, title, location, bio, tags,
        interactions (subject, snippet),
        contact_embeddings (content_hash)
      `
      )
      .eq("user_id", user.id)
      .limit(100);

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ message: "No contacts to embed", embedded: 0 });
    }

    let embedded = 0;

    for (const contact of contacts) {
      const text = generateContactEmbeddingText({
        full_name: contact.full_name,
        company: contact.company,
        title: contact.title,
        location: contact.location,
        bio: contact.bio,
        tags: contact.tags,
        interactions: contact.interactions || [],
      });

      const contentHash = crypto
        .createHash("md5")
        .update(text)
        .digest("hex");

      // Skip if hash unchanged
      const existingHash = (contact.contact_embeddings as any)?.[0]?.content_hash;
      if (existingHash === contentHash) continue;

      const embedding = await generateEmbedding(text);

      await supabase.from("contact_embeddings").upsert(
        {
          contact_id: contact.id,
          user_id: user.id,
          embedding: JSON.stringify(embedding),
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "contact_id" }
      );

      embedded++;
    }

    return NextResponse.json({ success: true, embedded });
  } catch (err: any) {
    console.error("Embedding error:", err);
    return NextResponse.json(
      { error: err.message || "Embedding failed" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/embeddings/route.ts
git commit -m "feat: add batch embedding generation endpoint"
```

---

## Task 16: Integrations Page

**Files:**
- Create: `src/app/(dashboard)/integrations/page.tsx`
- Create: `src/components/integration-card.tsx`

**Step 1: Integration card component**

```typescript
// src/components/integration-card.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Upload } from "lucide-react";

export function IntegrationCard({
  platform,
  title,
  description,
  icon,
  isConnected,
  lastSynced,
  onSync,
  onUpload,
}: {
  platform: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  lastSynced?: string | null;
  onSync?: () => Promise<void>;
  onUpload?: (file: File) => Promise<void>;
}) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setSyncing(true);
    try {
      await onUpload(file);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-gray-50">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{title}</h3>
              {isConnected && (
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            {lastSynced && (
              <p className="text-xs text-gray-400 mt-1">
                Last synced: {new Date(lastSynced).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div>
          {onUpload ? (
            <label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild disabled={syncing}>
                <span className="cursor-pointer">
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </>
                  )}
                </span>
              </Button>
            </label>
          ) : isConnected && onSync ? (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sync Now"
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Integrations page**

```typescript
// src/app/(dashboard)/integrations/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IntegrationCard } from "@/components/integration-card";
import { Mail, Calendar, Linkedin, Loader2 } from "lucide-react";
import type { Integration } from "@/types";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id);

    setIntegrations((data as Integration[]) || []);
    setLoading(false);
  };

  const googleIntegration = integrations.find((i) => i.platform === "google");
  const isGoogleConnected = googleIntegration?.status === "active";

  const syncGmail = async () => {
    setMessage(null);
    const res = await fetch("/api/ingest/gmail", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setMessage(`Gmail: ${data.contacts_created} contacts imported from ${data.threads_processed} threads.`);
      // Trigger embedding generation
      await fetch("/api/embeddings", { method: "POST" });
      setMessage((m) => m + " Embeddings generated.");
    } else {
      setMessage(`Gmail error: ${data.error}`);
    }
  };

  const syncCalendar = async () => {
    setMessage(null);
    const res = await fetch("/api/ingest/calendar", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setMessage(`Calendar: ${data.contacts_created} contacts from ${data.events_processed} events.`);
      await fetch("/api/embeddings", { method: "POST" });
      setMessage((m) => m + " Embeddings generated.");
    } else {
      setMessage(`Calendar error: ${data.error}`);
    }
  };

  const uploadLinkedIn = async (file: File) => {
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/ingest/linkedin", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`LinkedIn: ${data.contacts_imported} contacts imported.`);
      await fetch("/api/embeddings", { method: "POST" });
      setMessage((m) => m + " Embeddings generated.");
    } else {
      setMessage(`LinkedIn error: ${data.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your accounts to build your network graph.
        </p>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-lg bg-purple-50 border border-purple-100 text-sm text-purple-700">
          {message}
        </div>
      )}

      <div className="space-y-3">
        <IntegrationCard
          platform="gmail"
          title="Gmail"
          description="Import contacts from your email conversations. Read-only access."
          icon={<Mail className="h-5 w-5 text-red-500" />}
          isConnected={isGoogleConnected}
          lastSynced={googleIntegration?.last_synced_at}
          onSync={isGoogleConnected ? syncGmail : undefined}
        />

        <IntegrationCard
          platform="calendar"
          title="Google Calendar"
          description="Extract contacts from meeting attendees and events."
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          isConnected={isGoogleConnected}
          lastSynced={googleIntegration?.last_synced_at}
          onSync={isGoogleConnected ? syncCalendar : undefined}
        />

        <IntegrationCard
          platform="linkedin"
          title="LinkedIn"
          description="Upload your connections CSV. Download from LinkedIn Settings > Data Privacy > Get a copy of your data."
          icon={<Linkedin className="h-5 w-5 text-blue-700" />}
          isConnected={true}
          onUpload={uploadLinkedIn}
        />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/integrations/ src/components/integration-card.tsx
git commit -m "feat: add integrations page with Gmail, Calendar, and LinkedIn sync"
```

---

## Task 17: Contacts List + Profile Pages

**Files:**
- Create: `src/app/(dashboard)/contacts/page.tsx`
- Create: `src/app/(dashboard)/contacts/[id]/page.tsx`

**Step 1: Contacts list page**

```typescript
// src/app/(dashboard)/contacts/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user?.id)
    .order("last_interaction_at", { ascending: false, nullsFirst: false })
    .limit(200);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contacts?.length || 0} people in your network
          </p>
        </div>
      </div>

      {!contacts || contacts.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No contacts yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect Gmail, Calendar, or upload LinkedIn CSV to get started.
          </p>
          <Link
            href="/dashboard/integrations"
            className="text-sm text-purple-600 hover:underline mt-3 inline-block"
          >
            Go to Integrations
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
          {contacts.map((contact) => {
            const initials = contact.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Link
                key={contact.id}
                href={`/dashboard/contacts/${contact.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {contact.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {[contact.title, contact.company]
                      .filter(Boolean)
                      .join(" at ") || contact.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    {contact.source}
                  </Badge>
                  {contact.last_interaction_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(contact.last_interaction_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Contact profile page**

```typescript
// src/app/(dashboard)/contacts/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import {
  Mail,
  Calendar,
  Linkedin,
  MapPin,
  Building,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!contact) notFound();

  const { data: interactions } = await supabase
    .from("interactions")
    .select("*")
    .eq("contact_id", id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const initials = contact.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const platformIcon = (platform: string) => {
    switch (platform) {
      case "gmail":
        return <Mail className="h-4 w-4 text-red-500" />;
      case "calendar":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </Link>

      {/* Profile Header */}
      <div className="p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              {contact.full_name}
            </h1>
            <div className="mt-2 space-y-1">
              {contact.title && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Briefcase className="h-4 w-4" />
                  {contact.title}
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building className="h-4 w-4" />
                  {contact.company}
                </div>
              )}
              {contact.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {contact.location}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="h-4 w-4" />
                  {contact.email}
                </div>
              )}
            </div>
            {contact.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {contact.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {contact.source}
          </Badge>
        </div>
      </div>

      {/* Interaction Timeline */}
      <div>
        <h2 className="text-sm font-medium text-gray-900 mb-3">
          Interaction Timeline ({interactions?.length || 0})
        </h2>
        {interactions && interactions.length > 0 ? (
          <div className="space-y-2">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-white"
              >
                <div className="mt-0.5">{platformIcon(interaction.platform)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {interaction.type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(interaction.occurred_at).toLocaleDateString()}
                    </span>
                  </div>
                  {interaction.subject && (
                    <p className="text-sm text-gray-600 mt-0.5 truncate">
                      {interaction.subject}
                    </p>
                  )}
                  {interaction.snippet && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {interaction.snippet}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No interactions recorded.</p>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/contacts/
git commit -m "feat: add contacts list and contact profile pages"
```

---

## Task 18: Settings Page

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`

**Step 1: Settings page with sign-out and data management**

```typescript
// src/app/(dashboard)/settings/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Trash2, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAllData = async () => {
    if (
      !confirm(
        "This will permanently delete ALL your contacts, interactions, and embeddings. This cannot be undone. Continue?"
      )
    )
      return;

    setDeleting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("contact_embeddings").delete().eq("user_id", user.id);
      await supabase.from("interactions").delete().eq("user_id", user.id);
      await supabase.from("contacts").delete().eq("user_id", user.id);
      await supabase.from("integrations").delete().eq("user_id", user.id);
      await supabase.from("ingestion_jobs").delete().eq("user_id", user.id);
    }

    setDeleting(false);
    alert("All data deleted.");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and data privacy.
        </p>
      </div>

      {/* Account */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-900">Account</h2>
        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Separator />

      {/* Data Management */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-900">Data Management</h2>
        <div className="p-5 rounded-xl border border-red-100 bg-white">
          <h3 className="text-sm font-medium text-gray-900">Delete All Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Permanently remove all contacts, interactions, embeddings, and
            integration data. This cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={handleDeleteAllData}
            disabled={deleting}
            className="mt-4 gap-2"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete All My Data
          </Button>
        </div>
      </div>

      <Separator />

      {/* Privacy */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-900">Privacy</h2>
        <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm text-gray-900">Email body never stored</p>
              <p className="text-xs text-gray-500">
                Only subject lines and 200-character snippets are saved.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm text-gray-900">Data never shared</p>
              <p className="text-xs text-gray-500">
                Your network data is private to your account. Never used to train AI models.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm text-gray-900">Read-only access</p>
              <p className="text-xs text-gray-500">
                Gmail and Calendar access is read-only. Synapse never sends emails or creates events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/settings/
git commit -m "feat: add settings page with sign-out and data management"
```

---

## Task 19: Final Wiring + Cleanup

**Step 1: Update root layout with Inter font**

Ensure `src/app/layout.tsx` includes Inter font import and proper metadata:

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Synapse — Your network, searchable.",
  description:
    "AI-powered network intelligence. Search your Gmail, Calendar, and LinkedIn contacts using natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Step 2: Verify full app flow**

```bash
npm run dev
```

Test:
1. Landing page at `/` renders correctly
2. Click "Sign In" → goes to `/login`
3. After Google OAuth → redirects to `/dashboard`
4. Dashboard shows search bar and stats
5. Navigate to Integrations → shows Gmail, Calendar, LinkedIn cards
6. Navigate to Contacts → shows empty state or contacts list
7. Navigate to Settings → shows sign out and data management

**Step 3: Build check**

```bash
npm run build
```

Fix any TypeScript errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: wire up root layout, metadata, and verify full app flow"
```

---

## Summary

| Task | Description | Key Files |
|------|------------|-----------|
| 1 | Project scaffold | Next.js, Tailwind, Shadcn, deps |
| 2 | TypeScript types | `src/types/index.ts` |
| 3 | Database schema | `supabase/migrations/001_initial_schema.sql` |
| 4 | Supabase clients | `src/lib/supabase/` |
| 5 | Auth flow | Login page, OAuth callback |
| 6 | OpenAI library | Embeddings, query translation, why-matched |
| 7 | Dashboard layout | Sidebar, topbar, shell |
| 8 | Landing page | Marketing hero, features, CTA |
| 9 | Dashboard home | Search bar, stats |
| 10 | Search API | NL → structured → pgvector → results |
| 11 | Search results page | Contact cards, why-matched UI |
| 12 | Gmail ingestion | API route, email parsing |
| 13 | Calendar ingestion | API route, attendee extraction |
| 14 | LinkedIn CSV | Upload, CSV parsing |
| 15 | Embeddings API | Batch embedding generation |
| 16 | Integrations page | Connect/sync UI |
| 17 | Contacts + Profile | List, timeline, profile detail |
| 18 | Settings page | Sign out, data deletion, privacy |
| 19 | Final wiring | Root layout, build check |
