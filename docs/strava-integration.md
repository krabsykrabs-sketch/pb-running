# Strava Integration — Design Proposal

## Overview

Runners connect their Strava account. When they complete a run and it syncs to Strava, the app automatically pulls the activity data, matches it to the planned workout by date, and marks the workout as completed with the actual metrics filled in. The runner can still edit the auto-filled data. Each synced workout includes a link back to the original Strava activity.

**Sync direction**: Strava -> App only (read-only integration).

## Important: Strava API Policy (November 2024)

Strava updated their API agreement with a critical restriction: **activity data from a user can only be displayed to that same user** in your application. Showing Runner A's Strava data to Coach B would technically violate the API terms.

**Our approach**: Strava acts as an **auto-fill/import tool**. When a Strava activity is synced, it populates the runner's `WorkoutLog` record (our own schema). The coach sees the workout log data — which is *our* data that happens to have been auto-filled from Strava. We don't display raw Strava data or Strava-branded content on the coach's views. The Strava activity link is only visible to the runner.

This is the same pattern most coaching platforms use (TrainingPeaks, Final Surge, etc.).

### Single-Player Mode

New Strava API apps start with a **1-athlete limit**. To support multiple runners, we need to apply through the [Strava Developer Program form](https://developers.strava.com). This is a manual review process — apply early. In the meantime, we can build and test with 1 connected runner.

---

## User Experience

### Runner: Connect Strava

1. Runner goes to their **Profile** page
2. Clicks **"Connect Strava"** button (orange, uses Strava brand guidelines)
3. Redirected to Strava's OAuth page — they authorize the app
4. Redirected back to the app — sees "Strava Connected" with their Strava athlete name
5. A **"Sync Now"** button appears + auto-sync happens on connect

### Runner: Ongoing Sync

**Phase 1 (Manual)**:
- "Sync Strava" button on the runner dashboard and profile page
- Pulls activities from the last 30 days (or since last sync)
- Shows a brief summary: "Synced 3 activities. 2 matched to planned workouts."

**Phase 2 (Webhook — later)**:
- Activities are synced automatically within seconds of being saved on Strava
- Runner sees their workout auto-completed when they open the app
- Small "Synced from Strava" indicator on the workout log

### Runner: Auto-Matching

When activities are pulled from Strava:
1. Match each activity to a planned workout on the **same date** (using `start_date_local`)
2. Only match running activities (`sport_type` = `Run`, `TrailRun`) to running workouts
3. If multiple activities on the same date, match the one closest in distance to the planned workout
4. If no planned workout exists for that date, store the activity as unlinked (visible in history but not tied to plan)
5. When matched, auto-create/update the `WorkoutLog`:
   - `completed` = true
   - `actualDistanceKm` = Strava distance (meters / 1000)
   - `actualPace` = formatted from Strava `average_speed` (m/s -> min:sec/km)
   - `actualDurationMin` = Strava `moving_time` / 60
   - `avgHeartRate` = Strava `average_heartrate` (if available)
   - `stravaActivityId` = Strava activity ID (for the link)

### Runner: Disconnect

- "Disconnect Strava" button on profile
- Calls Strava deauthorization endpoint
- Clears stored tokens
- Existing workout logs remain (they're our data now)

### Coach: What Changes

- Coach sees workout logs as before — the data just gets filled in automatically
- Coach does NOT see the Strava link or Strava branding (API policy)
- Compliance % updates automatically as workouts are synced
- Coach can see in the workout log that data was auto-synced (subtle indicator)

---

## Technical Design

### Schema Changes

Add `stravaTokenExpiresAt` to User model (tokens expire every 6 hours):

```prisma
// In User model — add:
stravaTokenExpiresAt Int?  @map("strava_token_expires_at")  // Unix timestamp
```

The existing schema already has everything else we need:
- `User.stravaAccessToken`, `stravaRefreshToken`, `stravaAthleteId`
- `StravaActivity` model (stores raw activity data)
- `Workout.stravaActivity` relation
- `WorkoutLog.stravaActivityId` field

### Environment Variables

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
# For webhook (Phase 2):
STRAVA_WEBHOOK_VERIFY_TOKEN=a_random_secret_string
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/strava/authorize` | GET | Generate Strava OAuth URL, redirect runner |
| `/api/strava/callback` | GET | Handle OAuth callback, exchange code for tokens, store on User |
| `/api/strava/sync` | POST | Pull recent activities, match to workouts, create logs |
| `/api/strava/disconnect` | POST | Deauthorize + clear tokens |
| `/api/strava/webhook` | GET | Webhook subscription validation (Phase 2) |
| `/api/strava/webhook` | POST | Receive webhook events (Phase 2) |

### Token Refresh Helper

```
lib/strava.ts
  - getValidToken(userId): checks expiry, refreshes if needed, returns access token
  - fetchStravaActivities(token, after?, before?): calls Strava API
  - matchAndSyncActivities(runnerId, activities[]): matching + WorkoutLog creation
  - formatPace(avgSpeedMs): convert m/s to "X:XX/km"
```

Before every Strava API call, check `stravaTokenExpiresAt`. If expired (or within 5 min of expiry), call the refresh endpoint and update stored tokens. This is critical because tokens only last 6 hours.

### Matching Algorithm

```
For each Strava activity:
  1. Skip if sport_type not in [Run, TrailRun, Walk, Hike]
  2. Skip if already imported (check StravaActivity.stravaId)
  3. Find planned Workout on same date (start_date_local -> date)
  4. If multiple candidates, pick closest by distance
  5. If match found:
     - Create StravaActivity record (store raw data)
     - Create or update WorkoutLog with actual metrics
     - Set completed = true
  6. If no match:
     - Create StravaActivity record (unlinked)
     - Optionally show in runner's history
```

### Rate Limits

Strava allows 100 requests per 15 minutes, 1000 per day (default tier). For ~15-20 runners:
- Manual sync: 1 API call per sync (list activities) + 0-5 detail calls = ~6 calls per runner sync
- With 20 runners syncing once/day = ~120 calls/day — well within limits
- Webhooks (Phase 2): Only fetch details when notified = minimal API calls

---

## Implementation Plan

### Phase 1: Manual Sync (Core)

**Step 7a: OAuth + Connect/Disconnect**
- Add `stravaTokenExpiresAt` to schema, migrate
- Create `lib/strava.ts` with token management helpers
- Create `/api/strava/authorize` — builds OAuth URL, redirects to Strava
- Create `/api/strava/callback` — exchanges code, stores tokens + athlete ID
- Create `/api/strava/disconnect` — deauthorizes, clears tokens
- Add "Connect/Disconnect Strava" UI to runner profile page
- Show connection status (connected athlete name or "Not connected")

**Step 7b: Sync + Auto-Match**
- Create `/api/strava/sync` — fetches activities since last sync (or last 30 days)
- Implement matching algorithm (date + activity type + distance proximity)
- Auto-create WorkoutLog entries with Strava data
- Store raw activity in StravaActivity table
- Add "Sync Strava" button to runner dashboard
- Add "Synced from Strava" indicator on workout logs
- Add Strava activity link (runner-facing only)
- Show sync summary ("3 activities synced, 2 matched")

### Phase 2: Webhook (Enhancement)

**Step 7c: Real-Time Sync**
- Create `/api/strava/webhook` GET (validation) + POST (event handler)
- On `activity.create` event: fetch activity, run matching, update logs
- On `athlete.update` with `authorized: false`: clear tokens (deauth)
- Register webhook subscription (requires public URL)
- For development: use ngrok or similar tunnel
- For production: use the deployed app URL

---

## Strava API Setup Instructions

1. Go to https://www.strava.com/settings/api
2. Create a new application:
   - **Application Name**: PB Running
   - **Category**: Training
   - **Website**: http://localhost:3000 (update for production)
   - **Authorization Callback Domain**: localhost (update for production)
3. Note your **Client ID** and **Client Secret**
4. Add to `.env`:
   ```
   STRAVA_CLIENT_ID=12345
   STRAVA_CLIENT_SECRET=abc123...
   STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
   ```
5. The app starts in "Single Player Mode" (1 athlete). To support multiple runners, submit the [Developer Program application](https://developers.strava.com) — describe the coaching use case.

---

## UI Mockups (Text)

### Runner Profile — Strava Section

```
┌─────────────────────────────────────────────┐
│  Strava                                     │
│                                             │
│  [Not connected]                            │
│                                             │
│  [ Connect with Strava ]  (orange button)   │
│                                             │
└─────────────────────────────────────────────┘
```

After connecting:

```
┌─────────────────────────────────────────────┐
│  Strava                          Connected  │
│                                             │
│  Sarah Mitchell (strava.com/athletes/123)   │
│  Last synced: 2 hours ago                   │
│                                             │
│  [ Sync Now ]        [ Disconnect ]         │
│                                             │
└─────────────────────────────────────────────┘
```

### Workout Log — Strava Indicator

```
┌─────────────────────────────────────────────┐
│  Thu 26 Feb — Easy Run (Knee Adjustment)    │
│  ✓ Completed     ⟳ Synced from Strava      │
│                                             │
│  Planned    →  Actual                       │
│  6 km          5.8 km                       │
│  5:45/km       5:48/km                      │
│  —             34 min                       │
│  —             141 bpm                      │
│                                             │
│  View on Strava ↗  (runner-only link)       │
└─────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files
- `src/lib/strava.ts` — Token management, API helpers, matching logic
- `src/app/api/strava/authorize/route.ts` — OAuth start
- `src/app/api/strava/callback/route.ts` — OAuth callback
- `src/app/api/strava/sync/route.ts` — Manual sync trigger
- `src/app/api/strava/disconnect/route.ts` — Disconnect + deauth
- `src/app/api/strava/webhook/route.ts` — Webhook handler (Phase 2)

### Modified Files
- `prisma/schema.prisma` — Add `stravaTokenExpiresAt` to User
- `src/app/runner/profile/_components/runner-profile-view.tsx` — Add Strava connect/disconnect section
- `src/app/runner/page.tsx` — Add "Sync Strava" button if connected
- Workout detail/log components — Add "Synced from Strava" indicator + link

### Environment
- `.env` — Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI

---

## Open Questions

1. **Strava branding**: Strava requires using their brand assets ("Connect with Strava" button, "Powered by Strava" logo). Need to download from https://developers.strava.com/guidelines/
2. **Non-running activities**: Should we also sync cycling, swimming, hiking? Or only running? (Current plan: Run + TrailRun only, expand later if needed)
3. **Conflict resolution**: If a runner manually logs a workout AND a Strava activity syncs for the same date — should Strava overwrite, merge, or skip? (Current plan: skip if already logged)
4. **Historical import**: On first connect, pull last 30 days? Or just going forward? (Current plan: last 30 days)
