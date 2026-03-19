# Synapse — Architecture Design Document

**Date**: 2026-02-20
**Status**: Approved
**App Name**: Synapse (SynapseAI.com)
**Tagline**: Your network, searchable.

---

## 1. Overview

Synapse is an AI-powered people-search platform that ingests a user's digital footprint (Gmail, Google Calendar, LinkedIn CSV) and enables natural language search across their unified network. It acts as a "serendipity engine" to uncover hidden connections.

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (Google OAuth) |
| AI | OpenAI GPT-4o-mini + text-embedding-3-small |
| Styling | TailwindCSS v4 + Shadcn UI |
| Language | TypeScript |

## 3. Design Language

- Apple-inspired: modern, minimal, clean
- No gradients — flat colors with subtle borders
- Purple accent color (primary: #7C3AED, light variants for hover/bg)
- White/neutral backgrounds, generous whitespace
- System font stack (Inter as web font)
- Cards with thin borders, minimal shadows
- Search bar as hero element — large, centered, conversational

## 4. Project Structure

```
/SynapseAI.com
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Landing page (public)
│   │   │   ├── page.tsx          # Hero + value prop + CTA
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx    # Google OAuth login
│   │   │   └── callback/page.tsx # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Sidebar + topbar shell
│   │   │   ├── page.tsx          # Dashboard home (search hero)
│   │   │   ├── search/page.tsx   # Search results
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx      # Contacts list
│   │   │   │   └── [id]/page.tsx # Contact profile
│   │   │   ├── integrations/page.tsx  # Connect platforms
│   │   │   └── settings/page.tsx      # Privacy, account
│   │   ├── api/
│   │   │   ├── ingest/
│   │   │   │   ├── gmail/route.ts
│   │   │   │   ├── calendar/route.ts
│   │   │   │   └── linkedin/route.ts
│   │   │   ├── search/route.ts
│   │   │   └── embeddings/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # Shadcn components
│   │   ├── search-bar.tsx
│   │   ├── contact-card.tsx
│   │   ├── why-matched.tsx
│   │   ├── integration-card.tsx
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── openai.ts             # Embeddings + query translation
│   │   └── integrations/
│   │       ├── gmail.ts          # Gmail API parser
│   │       ├── calendar.ts       # Calendar API parser
│   │       └── linkedin.ts       # CSV parser
│   └── types/
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
├── docs/plans/
└── .env.local.example
```

## 5. Database Schema

### users (managed by Supabase Auth)
Extended via `profiles` table:
- id (uuid, FK to auth.users)
- full_name (text)
- avatar_url (text)
- search_count (int, default 0)
- plan (text: 'free' | 'pro', default 'free')
- created_at, updated_at

### contacts
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- full_name (text)
- email (text, nullable)
- phone (text, nullable)
- company (text, nullable)
- title (text, nullable)
- location (text, nullable)
- bio (text, nullable)
- linkedin_url (text, nullable)
- twitter_handle (text, nullable)
- avatar_url (text, nullable)
- tags (text[], default '{}')
- source (text: 'gmail' | 'calendar' | 'linkedin' | 'manual')
- last_interaction_at (timestamptz)
- interaction_count (int, default 0)
- created_at, updated_at
- UNIQUE(user_id, email)

### interactions
- id (uuid, PK)
- contact_id (uuid, FK to contacts)
- user_id (uuid, FK to profiles)
- platform (text: 'gmail' | 'calendar' | 'linkedin' | 'twitter')
- type (text: 'email_sent' | 'email_received' | 'meeting' | 'connection')
- subject (text, nullable)
- snippet (text, nullable — first 200 chars, never full body)
- metadata (jsonb — calendar location, attendees, etc.)
- occurred_at (timestamptz)
- created_at

### contact_embeddings
- id (uuid, PK)
- contact_id (uuid, FK to contacts, UNIQUE)
- user_id (uuid, FK to profiles)
- embedding (vector(1536) — text-embedding-3-small output)
- content_hash (text — to know when to regenerate)
- updated_at

### integrations
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- platform (text: 'google' | 'linkedin')
- access_token (text, encrypted)
- refresh_token (text, encrypted)
- token_expires_at (timestamptz)
- scopes (text[])
- status (text: 'active' | 'expired' | 'revoked')
- last_synced_at (timestamptz)
- created_at, updated_at
- UNIQUE(user_id, platform)

### ingestion_jobs
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- platform (text)
- status (text: 'pending' | 'processing' | 'completed' | 'failed')
- total_items (int)
- processed_items (int)
- error_message (text, nullable)
- started_at, completed_at, created_at

### pgvector index
```sql
CREATE INDEX ON contact_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### RPC: semantic_search
```sql
CREATE FUNCTION semantic_search(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count int DEFAULT 20,
  filter_location text DEFAULT NULL,
  filter_platform text DEFAULT NULL,
  filter_after timestamptz DEFAULT NULL
) RETURNS TABLE (
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
```

## 6. Core Flow — Natural Language Search

```
User: "Founders in Hyderabad I emailed about Web3 last year"
  │
  ▼
[API: /api/search] POST { query: "..." }
  │
  ▼
[OpenAI GPT-4o-mini] → Structured extraction:
  {
    searchText: "Web3 founder startup",
    filters: {
      location: "Hyderabad",
      platform: "gmail",
      dateAfter: "2025-01-01",
      dateBefore: "2025-12-31"
    }
  }
  │
  ▼
[OpenAI text-embedding-3-small] → Embed "searchText"
  │
  ▼
[Supabase RPC: semantic_search] → Hybrid query:
  - pgvector cosine similarity on embedding
  - SQL WHERE on location, platform, date
  - ORDER BY similarity DESC
  - LIMIT 20
  │
  ▼
[OpenAI GPT-4o-mini] → Generate "Why matched" per result:
  "Matched: You emailed about a Web3 project in March 2025.
   LinkedIn: Co-founder at BlockStack, Hyderabad."
  │
  ▼
[Return to frontend] → Render search results with cards
```

## 7. Data Ingestion Pipelines

### Gmail
1. User connects Google → OAuth with gmail.readonly scope
2. POST /api/ingest/gmail → fetch last 500 threads via Gmail API
3. For each thread: extract sender/recipient name + email, subject, snippet, date
4. Upsert contacts (fuzzy match on email), create interactions
5. Batch embed: concatenate contact bio + interaction summaries → embedding
6. Track progress via ingestion_jobs table

### Google Calendar
1. Same OAuth flow, calendar.readonly scope
2. POST /api/ingest/calendar → fetch last 100 events
3. Extract attendees, event title, description, date
4. Upsert contacts, create 'meeting' interactions

### LinkedIn CSV
1. User uploads connections.csv (downloaded from LinkedIn)
2. POST /api/ingest/linkedin → parse CSV
3. Create contacts with name, company, title, connection date
4. Generate embeddings from headline + company + notes

## 8. Privacy Controls

- Granular domain exclusion (e.g., exclude @company-internal.com)
- Toggle per platform (pause Gmail sync, keep Calendar)
- Email body is NEVER stored — only subject + 200-char snippet
- All embeddings are per-user, never shared across accounts
- Data deletion: user can purge all data with one click

## 9. Pages & UX

| Route | Purpose | Key Components |
|-------|---------|---------------|
| `/` | Landing page | Hero, features grid, CTA |
| `/login` | Sign in | Google OAuth button |
| `/dashboard` | Home | Search bar (hero), recent contacts, stats |
| `/dashboard/search?q=...` | Results | Contact cards with "Why matched" |
| `/dashboard/contacts` | All contacts | Filterable list, tags |
| `/dashboard/contacts/[id]` | Profile | Timeline, interactions, edit tags |
| `/dashboard/integrations` | Connect | Platform cards with status |
| `/dashboard/settings` | Account | Privacy toggles, data management |

## 10. Color System

```
Primary:     #7C3AED (purple-600)
Primary-light: #8B5CF6 (purple-500)
Primary-dark:  #6D28D9 (purple-700)
Primary-bg:    #F5F3FF (purple-50)
Background:  #FFFFFF
Surface:     #FAFAFA
Border:      #E5E7EB (gray-200)
Text:        #111827 (gray-900)
Text-muted:  #6B7280 (gray-500)
Success:     #10B981
Warning:     #F59E0B
Error:       #EF4444
```
