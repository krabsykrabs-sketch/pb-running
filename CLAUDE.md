# PB Running — Coaching Platform

## What This Is

A web app for a running coach ("PB Running") to manage ~15-20 active runners. Single coach, no multi-coach features needed. The coach creates training plans, runners log workouts, and both sides communicate through the app.

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript 5**
- **Prisma 7** with PostgreSQL (PrismaPg adapter for connection pooling)
- **NextAuth 5** (v5 beta.30) — JWT sessions, Credentials provider
- **Tailwind CSS v4** (CSS-based config, not tailwind.config.js)
- **bcryptjs** for password hashing (12 rounds)

## Key Architecture

### Auth
- JWT sessions with role encoded in token (`COACH` or `RUNNER`)
- `src/lib/auth.config.ts` — edge-safe config (no Node APIs), used by middleware
- `src/lib/auth.ts` — full auth with Credentials provider, uses Prisma + bcrypt
- Middleware (`src/middleware.ts`) enforces role-based route protection:
  - `/coach/*` requires COACH role
  - `/runner/*` requires RUNNER role
  - `/api/*` is public at middleware level (each route handler does its own auth via `api-utils.ts`)

### API Conventions
- `src/lib/api-utils.ts` provides `requireCoach()`, `requireCoachOrSelf(runnerId)`, `apiSuccess()`, `apiError()`, `isErrorResponse()`
- Next.js 15 params are `Promise` — always `await params` in route handlers
- All API routes return JSON; middleware lets `/api/*` through without redirect

### Database
- `src/lib/prisma.ts` — singleton Prisma client with PrismaPg adapter
- Full schema defined in `prisma/schema.prisma` (18 models, all enums)
- Coach account seeded via script (`npm run seed`), no create-coach UI

### UI Patterns
- Client components use `"use client"` directive
- Controlled form state (no form library) — see login/join pages for pattern
- Consistent styling: white cards, blue-600 primary buttons, gray borders, ring focus states
- Coach layout: sidebar nav (gray-900) + main content area
- Runner layout: header + bottom tab navigation (mobile-friendly)
- When passing Prisma data to client components, serialize with `JSON.parse(JSON.stringify(data))` to handle Date/Decimal objects

### Workout Type Colors (CSS variables in globals.css)
- Easy: green (#22c55e), Long: blue (#3b82f6), Tempo: amber (#f59e0b)
- Interval: red (#ef4444), Race Pace: purple (#a855f7), HR Training: pink (#ec4899)
- S&C: teal (#14b8a6), Rest: gray (#9ca3af), Cross-training: cyan (#06b6d4), Race: orange (#f97316)

## Project Structure

```
src/
  app/
    page.tsx              # Root redirect (→ /coach or /runner by role)
    layout.tsx            # Root layout with SessionProvider
    login/page.tsx        # Login form
    join/page.tsx         # Runner signup form (requires signup code)
    coach/
      layout.tsx          # Sidebar nav (Dashboard, Runners, Templates, Sessions)
      page.tsx            # Dashboard — runner list table (server component)
      runners/
        new/page.tsx      # Intake form (7 sections, client component)
        [id]/
          page.tsx        # Server wrapper — fetches runner data via Prisma
          _components/    # Client tab components
            runner-detail.tsx   # Tab navigation + content switching
            overview-tab.tsx    # Summary cards (read-only)
            profile-tab.tsx     # Inline edit form → PUT /api/runners/[id]/profile
            pbs-tab.tsx         # Table with add/edit/delete
            goals-tab.tsx       # List with status badges, add/edit/delete
            health-tab.tsx      # Timeline with add entry
            nutrition-tab.tsx   # Inline edit form
    runner/
      layout.tsx          # Header + bottom tabs
      page.tsx            # Placeholder (Step 4)
    api/
      auth/
        [...nextauth]/route.ts
        signup/route.ts
      runners/
        route.ts                    # GET (list), POST (intake)
        [id]/
          route.ts                  # GET (detail), PUT (update)
          profile/route.ts          # GET, PUT
          pbs/route.ts              # GET, POST
          pbs/[pbId]/route.ts       # PUT, DELETE
          goals/route.ts            # GET, POST
          goals/[goalId]/route.ts   # PUT, DELETE
          health/route.ts           # GET, POST
          nutrition/route.ts        # GET, PUT (upsert)
  lib/
    auth.ts               # NextAuth setup
    auth.config.ts         # Edge-safe auth config
    prisma.ts              # Prisma client singleton
    api-utils.ts           # Auth helpers + response helpers
  middleware.ts            # Route protection
```

## Implementation Status

### Done
- **Step 1**: Auth system, Prisma schema (all 18 models), middleware, login/join pages, coach/runner layouts
- **Step 2**: Runner management — intake form, dashboard table, runner detail page with 6 tabs (overview, profile, PBs, goals, health, nutrition), 9 API route files

### Next Steps

**Step 3: Plan Structure + Session Catalogue**
- Session catalogue CRUD (coach builds library of cross-training sessions)
- Plan creation (assign to runner, set race/goal/dates)
- Block management within plans (create, reorder, edit)
- Week management within blocks (week_number, description, target_km, intensity)
- Workout creation within weeks (from scratch or from catalogue)
- Weekly summary fields (planned km, intensity label, paces focus)

**Step 4: Runner Views**
- Runner dashboard (current week — 7-day card view)
- Full plan calendar (scrollable, far-out weeks show summary only)
- Availability markers (runner can flag dates with notes)
- Workout detail page (view planned session, coach notes, nutrition)
- Race day countdown on dashboard

**Step 5: Workout Logging + Feedback**
- Runner logs actual data (completed, distance, pace, HR, RPE, notes)
- Planned vs. actual comparison view (side by side)
- Coach comments on workout logs
- Coach weekly summary notes at week level
- Unread feedback indicator for runners

**Step 6: Coach Dashboard + Reviews**
- Batch overview of all runners (compliance %, last reviewed, conflicts, injuries)
- Review cycle tracking (configurable interval, "Needs Review" sorted by urgency)
- Availability conflict alerts
- Active injury indicators from health log

**Step 7: Templates + Plan Generator**
- Save week/block as template (name + JSON)
- Plan templates (full plan skeletons)
- Apply template → generates editable structure
- Plan generator wizard (lower priority, can be Phase 1.5)

### Phase 2 (Not Yet)
- Strava integration (columns exist in schema but unused)

## Important Notes

- Personal Bests are coach-managed only — runners cannot edit
- Session catalogue is private to coach — runners only see sessions placed in their plans
- Strava columns exist in User model as nullable — do NOT build integration yet
- The week intensity field (e.g. "High (42)") comes from Excel TOTAL PLANNED column
- `npm run build` must pass cleanly before considering a step complete
