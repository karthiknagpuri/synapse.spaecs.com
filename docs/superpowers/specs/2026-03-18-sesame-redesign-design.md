# Synapse AI Landing Page Redesign — Sesame Style

## Overview

Redesign the SynapseAI.com landing page to match Sesame.com's editorial, minimal design language combined with NeoSapien's bold product imagery energy. Built as a **new project** to preserve the current site.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Layout | Sesame-style: sticky left sidebar nav + right content area |
| Color | Light gray bg (#F5F5F3), black text, no accent color |
| Typography | Large serif headlines (DM Serif Display), sans-serif body (Geist) |
| Structure | Hero → 3 Numbered Goals → Join Section → Footer |
| Goals | 01 Hardware, 02 Voice, 03 Infrastructure |
| Energy | Bold product imagery per goal section (NeoSapien style) |
| Pages | Home (single page), /research, /team |
| Build | New Next.js project, separate from current SynapseAI.com |

## Page Structure

### Navigation (Left Sidebar, Sticky)

- Synapse logo icon (small)
- **Synapse** (bold, current page)
- Research (muted gray, links to /research)
- Team (muted gray, links to /team)
- — thin separator —
- Try Demo (muted gray)
- Join Waitlist (muted gray)

Mobile (< 768px): Collapses to horizontal top bar — logo left, hamburger right. Hamburger opens full-screen overlay with nav links stacked vertically. Logo stays visible in all breakpoints.

### Hero Section

**Headline** (large serif, ~60-80px, black, line-broken for rhythm):
```
Relationships are
the infrastructure
of progress
```

**Mission paragraph** (muted gray, ~18px sans-serif, max-width ~520px):
> We believe every meaningful connection deserves intelligence behind it. Synapse builds the hardware, voice, and infrastructure layer that makes relationships programmable, memorable, and alive.

**Bridge line** (black, medium weight, ~18px):
> To start, we have three goals.

Followed by a thin horizontal rule separator.

### Goal 01 — Hardware

**Number**: "01" (muted gray, small)

**Heading** (serif, bold, ~28px): "Wearable companions"

**Description** (muted gray, ~16px):
> Discreet devices designed to be worn all day — a pendant that captures conversations and spectacles that surface context in real time.

**Right side**: Single combined product shot showing both pendant and spectacles together. Placeholder: gray rounded rectangle (aspect ratio 4:3, max 400px wide) with "Product Shot" text centered. Will be replaced with real imagery later. On mobile, image stacks below text.

### Goal 02 — Voice

**Number**: "02" (muted gray, small)

**Heading** (serif, bold, ~28px): "A proactive relationship agent"

**Description** (muted gray, ~16px):
> An ever-present companion that remembers every conversation, anticipates who you should reach out to, and helps you show up prepared.
> Try our research [preview](link).

**Right side**: Link card to research content (like Sesame's "Crossing the uncanny valley" card — thumbnail image, title text, arrow icon). Clickable, navigates to /research. Card: white bg, subtle border (#E5E5E3), 16px padding, rounded corners (8px). Arrow icon from lucide-react.

Note: /research page is a placeholder for now — simple page with heading "Research" and a paragraph about Synapse's work on relationship intelligence. No blog CMS needed.

### Goal 03 — Infrastructure

**Number**: "03" (muted gray, small)

**Heading** (serif, bold, ~28px): "The relationship layer for AI apps"

**Description** (muted gray, ~16px):
> APIs and SDKs that give any application access to relationship intelligence — contact enrichment, network graphs, and interaction memory at scale.

**Right side**: Styled code block showing a sample API call (TypeScript/curl). Dark bg (#1A1A1A), monospace font (Geist Mono), ~8 lines max, rounded corners (8px), 16px padding. Not interactive — static display only. Example content:

```typescript
const synapse = new Synapse({ apiKey: "sk_..." });

const contact = await synapse.contacts.enrich({
  email: "jane@company.com"
});
// → { name, company, score, lastInteraction, ... }
```

### Join Section

**Heading** (serif, bold, ~28px): "Join Synapse"

**Description** (muted gray, ~16px):
> Synapse is an interdisciplinary team building the relationship layer for human connection. Learn more about our [team and mission](/team).

**Visual elements**:
- Two team photo placeholders (gray rectangles, 280x200px, second offset 20px down-right, overlapping). On mobile: stacked, no overlap.
- "Careers at Synapse" link with arrow-up-right icon (lucide-react)

### Footer

**Layout**: Full-width, light background, separated by thin rule.

**Left**: Synapse logo icon

**Center**: Nav links — Home, Research, Team, Contact us (mailto:)

**Right**: Social icons — X (Twitter), LinkedIn, Discord

**Bottom**: Copyright line + Privacy | Terms links

## Technical Specifications

### New Project Setup

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 + custom CSS
- **Fonts**: DM Serif Display (serif headlines), Geist (sans body), Geist Mono (code)
- **Dependencies**: Minimal — React, Next.js, Tailwind, lucide-react (icons)
- **No Supabase/auth/API** needed for landing page — pure static marketing site

### File Structure

```
synapse-sesame/
├── src/
│   ├── app/
│   │   ├── layout.tsx          (root layout, fonts, metadata)
│   │   ├── page.tsx            (landing page — all sections)
│   │   ├── globals.css         (Tailwind + custom properties)
│   │   ├── research/
│   │   │   └── page.tsx        (research page)
│   │   └── team/
│   │       └── page.tsx        (team page)
│   └── components/
│       ├── sidebar-nav.tsx     (sticky left nav)
│       ├── hero-section.tsx    (headline + mission)
│       ├── goal-section.tsx    (reusable goal component)
│       ├── join-section.tsx    (team CTA)
│       └── footer.tsx          (footer)
├── public/
│   ├── pendant.png             (product shot placeholder)
│   ├── spectacles.png          (product shot placeholder)
│   └── synapse-icon.svg        (logo icon)
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── tailwind related config
```

### Color Palette

```css
--bg: #F5F5F3;           /* Light warm gray background */
--text-primary: #1A1A1A;  /* Near-black for headlines */
--text-secondary: #888888; /* Muted gray for body/nav */
--text-muted: #AAAAAA;    /* Lighter gray for numbers */
--border: #E5E5E3;        /* Subtle rule lines */
--white: #FFFFFF;          /* Card backgrounds */
```

### Typography Scale

```css
/* Headlines — DM Serif Display */
h1: 64px / 1.1 line-height (mobile: 40px)
h2: 28px / 1.3 line-height (mobile: 24px)

/* Body — Geist */
body: 16px / 1.6 line-height
large-body: 18px / 1.6 line-height
small: 14px / 1.5 line-height
nav: 15px / 1.4 line-height
```

### Responsive Breakpoints

- **Desktop** (1024px+): Sidebar nav left, content right (~60% max-width)
- **Tablet** (768-1023px): Sidebar collapses to top horizontal nav
- **Mobile** (< 768px): Stacked layout, full-width content

### Animations

- Fade-in on scroll: each goal section fades from opacity 0, translateY(20px) to opacity 1, translateY(0). Triggered when element enters 80% viewport. Duration: 600ms, ease-out. Use CSS `@keyframes` + Intersection Observer.
- Nav links: opacity 0.5 → 1.0 on hover, 200ms transition.
- CTA links: underline appears on hover, 200ms transition.
- No animation libraries — pure CSS transitions + one small Intersection Observer script.

## Copy Reference

All copy is placeholder and can be refined. The tone should be:
- **Minimal**: Short sentences, no marketing fluff
- **Confident**: Declarative statements, not questions
- **Poetic**: Rhythm in headlines, editorial feel
- **Technical enough**: Show credibility without jargon overload

## Out of Scope

- Authentication / login flows
- Dashboard UI
- API integrations (Supabase, OpenAI)
- Pricing section
- Testimonials / social proof
- FAQ section
- Dark mode (can be added later)
- Blog/content CMS

## Success Criteria

1. Landing page loads and matches Sesame's editorial layout
2. Three numbered goal sections with product imagery placeholders
3. Responsive across desktop, tablet, mobile
4. Sidebar nav with smooth page scrolling
5. Clean, minimal code — no over-engineering
6. Runs independently from the existing SynapseAI.com project
