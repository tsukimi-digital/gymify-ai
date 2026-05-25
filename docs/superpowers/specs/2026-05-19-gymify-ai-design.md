# Gymify AI — Design Spec

**Date:** 2026-05-19 (revised after multi-perspective review: UX, architecture, personal trainer)
**Stack:** Node.js + Express + React (Vite) + PostgreSQL + Claude API

---

## 1. Overview

Gymify AI is a **mobile-first** web application for gym users. It collects personal data and objective fitness markers through an onboarding wizard, generates a personalized AI-powered training program (mesocycle-based with progressive overload and a deload week), and lets users execute and log training sessions with full per-set granularity (reps, weight, RPE).

**Primary use context:** users perform sessions on a phone while in the gym — UI must be touch-first, work with sweaty fingers, and tolerate flaky connections.

---

## 2. Architecture

### Project Structure (monorepo, npm workspaces)

```
gymify-ai/
├── packages/
│   ├── backend/        # Express.js + TypeScript (HTTP API)
│   ├── worker/         # Background worker (Claude generation jobs)
│   ├── frontend/       # React + Vite + TypeScript (mobile-first PWA)
│   └── shared/         # shared TS types + Zod schemas (workspace path import)
├── package.json
└── .env.example
```

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL via Prisma ORM (migrations via `prisma migrate deploy`)
- **Job queue:** pg-boss (Postgres-backed; no separate Redis dependency for MVP)
- **Realtime:** Server-Sent Events (SSE) for plan-generation progress, with polling fallback
- **Auth:** JWT — access token (15 min, in-memory) + rotating refresh token (7 days, httpOnly + Secure + SameSite=Strict cookie) with server-side revocation registry
- **AI:** Claude API (Anthropic SDK) with prompt caching, retry + circuit breaker — called only from the worker
- **Validation:** Zod (schemas shared with frontend via `shared` package)
- **Logging:** pino (structured JSON, with PII redaction)
- **Error tracking:** Sentry (backend + worker + frontend)

### Frontend
- **Framework:** React + Vite + TypeScript
- **Mobile-first:** base styles target 360 px width; Tailwind breakpoints `sm`/`md`/`lg`; min touch target 44 × 44 px
- **PWA:** installable; offline-tolerant for the active-workout view (writes queued in IndexedDB until reconnect)
- **Routing:** React Router v6 with `PrivateRoute` for protected pages
- **Server state:** TanStack Query (optimistic updates for set logging)
- **Forms:** React Hook Form + Zod resolvers
- **Styling:** Tailwind CSS, light/dark theme (system + manual toggle)
- **Accessibility:** WCAG 2.2 AA target (EAA compliance, June 2025). Semantic HTML, focus management in wizard, ARIA live regions for the rest timer and SSE progress, color contrast ≥ 4.5:1
- **Units / i18n:** kg/lbs and cm/ft-in toggle per user preference; UI strings in i18n-ready structure (English at MVP, Polish later)

### Local Dev
Docker Compose: PostgreSQL + backend + worker + frontend, wired via `.env`. Template in `.env.example`; secrets never committed.

### Deployment & Operations
- **Migrations:** `prisma migrate deploy` in CI on tag.
- **Secrets:** environment variables injected by the host platform (no `.env` in prod).
- **Logging:** pino → stdout → host log aggregator.
- **Monitoring:** Sentry for errors; uptime check on `/api/health`; weekly review of Anthropic spend dashboard.
- **Backups:** managed Postgres daily snapshots, 30-day retention.
- **CI/CD:** GitHub Actions — lint, typecheck, unit + integration + E2E on PR; deploy on tag.
- **Target host:** see §9 (Open Decisions).

---

## 3. Data Models

All tables include `createdAt` and `updatedAt`. User-deletable entities include `deletedAt` (soft delete).

### User
```
id              UUID, primary key
email           string, unique (indexed)
passwordHash    string
emailVerifiedAt datetime (nullable)
createdAt, updatedAt, deletedAt
```

### AuthToken
Refresh token registry — enables rotation + revocation.
```
id            UUID, primary key
userId        FK → User (indexed)
tokenHash     string (sha256 of refresh token)
expiresAt     datetime
revokedAt     datetime (nullable)
replacedById  FK → AuthToken (nullable; rotation chain)
userAgent     string (nullable)
```

### UserProfile
One per user. Editable from the profile page.
```
id                 UUID, primary key
userId             FK → User (unique)
sex                enum: MALE | FEMALE | OTHER     (used by AI for personalization)
weightKg           float
heightCm           float
age                integer
goal               enum: LOSE_WEIGHT | BUILD_MUSCLE | IMPROVE_ENDURANCE | STAY_FIT
daysPerWeek        integer (1–7)
sessionMinutes     integer (30–120, preferred session length)
fitnessSelfRating  enum: BEGINNER | INTERMEDIATE | ADVANCED   (subjective)
trainingYears      float (objective experience marker)
unitPreference     enum: METRIC | IMPERIAL
parqAcknowledged   boolean (Physical Activity Readiness Questionnaire passed)
medicalDisclaimer  boolean (accepted "consult a doctor" disclaimer)
notes              string (nullable; free text passed to AI, max 500 chars)
```

### EquipmentAvailability
Structured equipment per user (replaces single enum).
```
id           UUID, primary key
userId       FK → User (indexed)
type         enum: BARBELL | DUMBBELL_PAIR | DUMBBELL_ADJUSTABLE | KETTLEBELL |
                    RACK | BENCH_FLAT | BENCH_ADJUSTABLE | PULL_UP_BAR |
                    CABLE_MACHINE | LEG_PRESS | SMITH_MACHINE | HACK_SQUAT |
                    TREADMILL | BIKE | ROWER | RESISTANCE_BAND | BODYWEIGHT_ONLY
maxWeightKg  float (nullable; e.g. heaviest dumbbell available)
```
Unique on `(userId, type)`.

### Injury
Structured records (replaces free-text `injuries`).
```
id           UUID, primary key
userId       FK → User (indexed)
bodyArea     enum: SHOULDER | ELBOW | WRIST | LOWER_BACK | UPPER_BACK |
                    HIP | KNEE | ANKLE | NECK | OTHER
side         enum: LEFT | RIGHT | BOTH | N_A
status       enum: ACUTE | RECOVERING | CHRONIC | RESOLVED
restriction  string (nullable; e.g. "no overhead pressing", max 300 chars)
notes        string (nullable, max 300 chars)
```

### StrengthBenchmark
Objective markers fed to AI (alongside subjective `fitnessSelfRating`).
```
id            UUID, primary key
userId        FK → User (indexed)
exerciseId    FK → Exercise (key lifts: squat, bench, deadlift, OHP, row, pull-up)
estimated1RM  float kg (nullable; can be auto-derived from logged working sets)
recordedAt    datetime
```

### Exercise (catalog)
First-party catalog (MVP seeded with ~150 staple lifts). Structured catalog enables attaching instructions / images / video and reliably attributing logs.
```
id              UUID, primary key
slug            string, unique (e.g. "barbell-back-squat")
name            string
muscleGroup     enum: CHEST | BACK | LEGS | SHOULDERS | ARMS | CORE |
                       GLUTES | CALVES | FULL_BODY | CARDIO
equipmentType   enum (matches EquipmentAvailability.type)
movementPattern enum: SQUAT | HINGE | PUSH_H | PUSH_V | PULL_H | PULL_V |
                       CARRY | LUNGE | CORE | CARDIO_STEADY | CARDIO_INTERVAL
isCompound      boolean
difficulty      enum: BEGINNER | INTERMEDIATE | ADVANCED
instructions    text (form cues, safety notes)
videoUrl        string (nullable)
imageUrl        string (nullable)
isCardio        boolean
```

### WorkoutPlan
AI-generated **mesocycle** (multi-week, with progressive overload and a deload week).
```
id                UUID, primary key
userId            FK → User (indexed)
content           JSONB (full mesocycle structure — see below)
prompt            text (raw prompt sent to Claude, for debugging)
promptVersion     string (e.g. "v1.2.0"; for prompt-quality regression analysis)
modelId           string (e.g. "claude-opus-4-7")
weeksTotal        integer (e.g. 4)
deloadWeekIndex   integer (nullable; e.g. 4 = week 4 is deload)
isActive          boolean (one active per user; enforced by partial unique index)
generationJobId   FK → PlanGenerationJob
```
Indexes: `(userId, isActive)`; partial unique `(userId) WHERE isActive = true`.

**Plan JSON structure (`content`):**
```json
{
  "mesocycle": {
    "weeks": 4,
    "deloadWeekIndex": 4,
    "schedule": [
      {
        "weekIndex": 1,
        "days": [
          {
            "dayIndex": 1,
            "focus": "Upper body — push",
            "exercises": [
              {
                "exerciseSlug": "barbell-bench-press",
                "sets": 4,
                "repsTarget": "8-10",
                "rpeTarget": 7,
                "restSeconds": 90,
                "progression": "+2.5 kg next week if all sets at RPE ≤ 7",
                "notes": "Keep elbows at 45°"
              }
            ]
          }
        ]
      }
    ]
  },
  "generalNotes": "Rest at least 48 h between sessions targeting the same muscle group."
}
```

### WorkoutPlanDay
Denormalized row per `(plan × week × day)`. Lets `WorkoutSession` reference an exact day and enables direct queries (e.g. "how often did user do leg day?") without unpacking JSON.
```
id           UUID, primary key
planId       FK → WorkoutPlan (indexed)
weekIndex    integer
dayIndex     integer
focus        string
plannedJson  JSONB (the day's exercises — immutable snapshot)
```
Unique on `(planId, weekIndex, dayIndex)`.

### PlanGenerationJob
Tracks async Claude generation; drives SSE updates and idempotent retries.
```
id              UUID, primary key
userId          FK → User (indexed)
status          enum: QUEUED | RUNNING | SUCCEEDED | FAILED | CANCELLED
reason          string (nullable; for regeneration, max 300 chars)
previousPlanId  FK → WorkoutPlan (nullable; for regeneration context)
progress        integer (0–100)
phase           enum: ANALYZING_PROFILE | DESIGNING_SCHEDULE |
                       SELECTING_EXERCISES | VALIDATING | DONE
errorCode       string (nullable)
errorMessage    string (nullable)
inputTokens     integer (nullable)
outputTokens    integer (nullable)
costUsd         float (nullable)
startedAt       datetime (nullable)
finishedAt      datetime (nullable)
```

### WorkoutSession
Represents one execution of a planned day.
```
id            UUID, primary key
userId        FK → User (indexed)
planId        FK → WorkoutPlan
planDayId     FK → WorkoutPlanDay
scheduledDate date
status        enum: SCHEDULED | IN_PROGRESS | COMPLETED | SKIPPED | CANCELLED
startedAt     datetime (nullable)
completedAt   datetime (nullable)
overallRpe    integer (nullable, 1–10; session-level fatigue)
notes         string (nullable)
```
Indexes: `(userId, scheduledDate)`, `(userId, status)`, `(planId)`.

### SessionExercise
Per-exercise instance within a session. Supports on-the-fly substitution.
```
id                UUID, primary key
sessionId         FK → WorkoutSession (indexed)
exerciseId        FK → Exercise (actually performed)
plannedExerciseId FK → Exercise (nullable; original planned exercise if substituted)
orderIndex        integer
notes             string (nullable)
```

### SetLog
**Per-set log** — fundamental change vs. the original spec. One row per set performed; supports straight sets, drop sets, AMRAP, warm-up sets, and cardio.
```
id                UUID, primary key
sessionExerciseId FK → SessionExercise (indexed)
setIndex          integer (1, 2, 3 …)
setType           enum: WARMUP | WORKING | DROP | AMRAP | BACKOFF
reps              integer (nullable; null for cardio)
weightKg          float (nullable; null for bodyweight / cardio)
rpe               float (nullable, 1–10, half-points allowed)
restSeconds       integer (nullable; actual rest taken before the next set)
durationSec       integer (nullable; cardio)
distanceM         integer (nullable; cardio)
avgHeartRate      integer (nullable; cardio)
notes             string (nullable)
```
Index: `(sessionExerciseId, setIndex)`.

### AiUsageMeter
Per-user and global counters for plan-generation rate limit (5/h) and daily project-wide AI budget cap.

---

## 4. API Endpoints

All endpoints except `/api/auth/*` and `/api/health` require a valid JWT access token.
All state-changing endpoints require a CSRF token (double-submit cookie pattern).
All list endpoints support cursor pagination: `?cursor=<id>&limit=<n>`.
All write endpoints return the consistent error envelope (§7).

### Auth
```
POST /api/auth/register             — create account; sends verification email
POST /api/auth/verify-email         — confirm email with token
POST /api/auth/login                — access token + refresh cookie; rate-limited (5/15min per IP+email)
POST /api/auth/logout               — clear refresh cookie + revoke token
POST /api/auth/refresh              — rotate refresh, issue new access token
POST /api/auth/forgot-password      — send reset email
POST /api/auth/reset-password       — apply reset with token
```

### Profile
```
GET  /api/profile                   — profile + injuries + equipment + benchmarks
PUT  /api/profile                   — update basic profile fields
PUT  /api/profile/equipment         — replace equipment list
PUT  /api/profile/injuries          — replace injuries list
PUT  /api/profile/benchmarks        — upsert strength benchmarks
```

### Plans
```
POST  /api/plans/generate                       — enqueue generation job → { jobId }
POST  /api/plans/:id/regenerate                 — enqueue regeneration (reason + previousPlanId)
GET   /api/plans/jobs/:jobId                    — poll status (SSE fallback)
GET   /api/plans/jobs/:jobId/stream             — SSE stream of progress events
GET   /api/plans/active                         — current active plan
GET   /api/plans/:id                            — specific (historical) plan
GET   /api/plans                                — paginated history
PATCH /api/plans/:id/exercises/:slot            — quick-swap one exercise (no full regeneration)
```

### Sessions
```
GET    /api/sessions                            — paginated; filter by status, date range
POST   /api/sessions                            — start a session from a planDay
GET    /api/sessions/:id                        — full session (sessionExercises + setLogs)
PATCH  /api/sessions/:id                        — update notes, status, overallRpe
POST   /api/sessions/:id/sets                   — append SetLog (also for editing past sessions)
PATCH  /api/sessions/:id/sets/:setId            — edit a set log
DELETE /api/sessions/:id/sets/:setId            — delete a set log
POST   /api/sessions/:id/complete               — mark COMPLETED + finalize
PATCH  /api/sessions/:id/exercises/:seId/substitute — substitute one exercise on the fly
```

### Exercises (catalog)
```
GET /api/exercises                  — list (filters: muscle, equipment, search)
GET /api/exercises/:slug            — single exercise with instructions / image / video
```

### Stats
```
GET /api/stats/progress             — e1RM trend per key lift, weekly volume per muscle group, streak
```

### Health
```
GET /api/health                     — liveness + DB ping + AI budget headroom
```

---

## 5. AI Integration (Claude API)

### Async generation
- `POST /api/plans/generate` and `/regenerate` enqueue a `PlanGenerationJob` (pg-boss) and immediately return `{ jobId }`.
- The worker calls Claude and updates `phase` + `progress` on the job.
- Frontend subscribes via SSE (`/api/plans/jobs/:jobId/stream`) or polls (`/api/plans/jobs/:jobId`).
- The HTTP request never blocks on Claude → no 504s, no proxy timeout issues.

### Prompt design
- System prompt + JSON schema + exercise-catalog summary are cached with Anthropic's `cache_control` (~50–80 % input-token savings).
- User-specific block (profile, equipment, injuries, benchmarks, previous plan + regeneration reason where applicable) is appended uncached.
- `promptVersion` stored on each plan for cross-iteration quality tracking.

### Output validation
- Response validated with Zod against the plan schema **and** business rules:
  - Every `exerciseSlug` must exist in the Exercise catalog.
  - Each exercise's `equipmentType` must be present in the user's `EquipmentAvailability`.
  - No banned exercises given the user's `Injury` restrictions (e.g. no overhead pressing if shoulder restriction).
  - Sanity bounds: sets 1–10, repsTarget within reasonable range, RPE 5–10, restSeconds 30–600.
  - Mesocycle 3–6 weeks; deload (if present) must be the final week.
- Validation failure → worker retries up to 2 times with a corrective follow-up message; persistent failure marks the job FAILED with a user-friendly error.

### Reliability
- HTTP retry with exponential backoff for Anthropic 429 / 500 / 529.
- Circuit breaker (opens after 5 consecutive failures in 60 s) — fail fast, avoid burning budget.
- Per-job wall-clock timeout (90 s).

### Cost controls
- **Per user:** max 5 plan generations / hour (express-rate-limit on HTTP + DB-backed counter for accuracy across instances).
- **Global:** daily AI spend cap; when exceeded, return 503 with "AI temporarily unavailable" and alert via Sentry.
- **Input length caps:** `notes` 500 chars, `regenerationReason` 300 chars, `injury.notes` 300 chars.

---

## 6. Frontend — Views and User Flow

### User Flow
```
Register → Email verification → Login
      ↓
Onboarding Wizard (new users only) — 6 steps:
  Step 1: Goal (4 options) — emotional hook first
  Step 2: Basic data (sex, weight, height, age, unit preference)
  Step 3: Availability (days/week, session minutes, training years, fitness self-rating)
  Step 4: Equipment (multi-select, structured types)
  Step 5: Health (PARQ checklist, structured injuries, medical disclaimer)
  Step 6: Strength benchmarks (optional — "skip if unknown"; brief quiz to estimate)
      ↓
Plan generation loading screen (async; SSE-driven progress with named phases)
      ↓
Dashboard
```

The wizard supports back navigation on every step, persists progress in `localStorage` (so it survives reload), and validates step by step.

### Views

**Dashboard (mobile-first)**
- "Today" card with the planned day for today's date (if any) — primary CTA "Start workout".
- Mini week strip (Mon–Sun) with status dots (completed / scheduled / skipped).
- Streak counter.
- Links to History, Plan, Profile.

**Plan View**
- Full mesocycle with week tabs.
- Per-exercise quick-swap (`PATCH /plans/:id/exercises/:slot`) — substitute one exercise without regenerating the whole plan.
- "Regenerate plan" button — opens a reason form; shows remaining rate-limit budget.
- Surfaces current week and progression rules ("+2.5 kg if RPE ≤ 7").

**Workout (Session View) — designed for sweaty fingers, one-handed**
- Large per-exercise card. Exercise name + tap-target for instructions modal (form cues, image / video from the Exercise catalog).
- Per-set row:
  - Big +/- stepper for weight (long-press for fast scrub).
  - Big +/- stepper for reps.
  - RPE chip selector (6, 7, 8, 9, 10 — half-points via long-press).
  - "Repeat last set" pre-fills from the prior set.
  - Inputs use `inputMode="decimal"` for the OS numeric keypad.
- **Rest timer** auto-starts on set completion using `restSeconds`; visible at top, dismissible; vibration + sound on completion. ARIA live region for screen readers.
- Autosave per set (optimistic UI + retry queue on network loss).
- "Substitute exercise" affordance per exercise.
- Offline-tolerant: writes queued in IndexedDB until reconnect.
- "Complete workout" button finalizes the session; prompts for overall RPE + notes.

**History**
- Paginated list of past sessions (date, focus, overall RPE, notes).
- Progress sub-page: e1RM trend chart per key lift; weekly volume per muscle group.

**Profile**
- Editable forms for basic data, equipment, injuries, benchmarks, unit preference, theme.
- Account section: email verification status, password change, GDPR data export, account delete.

### Cross-cutting UI requirements
- **Mobile-first** at 360 px base, scales up.
- **Touch targets** ≥ 44 × 44 px.
- **Dark mode** with system + manual toggle.
- **Accessibility:** WCAG 2.2 AA. Visible focus ring; screen-reader labels on all controls; ARIA live regions for the rest timer and SSE progress.
- **Empty states:** no plan yet, no sessions yet, no benchmarks, no equipment configured.
- **Error states:** AI generation failed, offline ("your data is saved locally"), session not found, network error during set logging.
- **PWA:** installable; offline shell for the active-workout view.
- **Push notifications** (post-MVP): scheduled-day reminders, rest-timer completion.

### Plan lifecycle behavior
- A plan covers a **mesocycle** (default 4 weeks; final week is a deload).
- After completion the dashboard prompts "Ready for your next mesocycle?" → generate a new plan, using logged data from the prior cycle as context.
- If the user edits training-relevant profile fields (sex, equipment, injuries, benchmarks), the active plan is **not** auto-regenerated; instead a banner appears: "Your profile changed — regenerate plan?" with a one-click action.
- Skipped sessions are **not** auto-rescheduled in MVP — they're marked SKIPPED in history.

---

## 7. Security and Error Handling

### Authentication
- Passwords hashed with bcrypt (cost factor 12).
- Access token: JWT, 15-min TTL, in-memory on the frontend.
- Refresh token: 7-day TTL in httpOnly + Secure + SameSite=Strict cookie. Rotated on every refresh; previous token stored in `AuthToken.replacedById` for reuse detection (any reuse revokes the entire chain).
- Login rate-limit: 5 failures / 15 min per IP+email.
- Email verification + password reset flows.

### CSRF
- Double-submit cookie pattern for state-changing endpoints (CSRF token from a non-httpOnly cookie echoed in a request header).

### Input Validation
- Zod schemas in the `shared` package, used by both frontend (RHF resolvers) and backend.
- Wizard validates step by step before advancing.
- Hard length caps on free-text fields (see §5).

### Sanity guardrails
- Weight inputs clamped to 0–500 kg; reps to 0–100; durations to 0–7200 s.
- AI output bounded by the same rules (§5).

### Error Handling
- Backend error envelope: `{ error: { code: string, message: string, details?: object } }`.
- TanStack Query handles global HTTP errors → toast for transient failures, inline for form errors.
- AI failures return user-friendly messages without leaking provider details.
- All unhandled errors → Sentry (backend + worker + frontend).

### Rate Limiting
- `/api/plans/generate|regenerate`: 5/h per user (DB-backed counter).
- `/api/auth/login`: 5/15 min per IP+email.
- Global daily AI spend cap with circuit-breaker behavior.

### GDPR / privacy
- Health data (weight, injuries, sex) is sensitive — explicit consent on signup, privacy policy, data export endpoint, account-delete endpoint that hard-deletes within 30 days.
- PII excluded from logs via pino redact list.

---

## 8. Testing

**Backend**
- Unit tests for prompt construction, plan validation, progression math.
- Integration tests (Vitest + Supertest) — each test runs inside a transaction rolled back at teardown; single shared dockerized Postgres in CI.
- Worker tests: Claude SDK mocked at the SDK boundary (MSW or stub). A separate gated CI job runs a smoke test against the real Anthropic API once per deploy.

**Frontend**
- Component tests for wizard steps (React Testing Library).
- Component tests for the workout view (set logging, rest timer, offline queue).
- a11y smoke test (axe-core) on each major view.

**E2E (Playwright)**
- Critical path: register → verify email (mocked) → onboarding → plan generation (mocked Claude) → session → complete → history.
- Runs on PR.

---

## 9. Open Decisions

These are deferred pending product input; none block scaffolding the codebase, but each should be resolved before its respective feature ships:

1. **Exercise catalog source:** our own (~150 staples, MVP default) vs. ExerciseDB / wger integration (richer, but adds dependency + licensing review). Default: own catalog for MVP; revisit before public launch.
2. **Mesocycle default length:** 4 weeks with deload in week 4. Confirm with target-user research.
3. **Deployment host:** Railway / Fly.io / Render / VPS. pg-boss is portable across all of them; if we migrate to BullMQ later (Redis), the host choice matters more.
4. **Push notifications:** Web Push API in PWA (post-MVP).
5. **`shared` package distribution:** workspace path (simpler — default) vs. published artifact.
6. **i18n rollout:** English at MVP, Polish locale planned.
7. **Auto-rescheduling skipped sessions:** post-MVP.

---

## Appendix A — Summary of revisions vs. original spec

The original 2026-05-19 spec was reviewed from three perspectives (UX, software architecture, personal trainer). This revision applies:

**All UX suggestions** — onboarding restructured (goal first, then basic data, sex added, units preference); skeleton/progress for AI loading via SSE phases; mobile-first + dark mode + a11y (WCAG 2.2 AA); rest timer surfaced in UI; per-set steppers + autosave + offline queue; explicit empty/error states; exercise instructions / images / video via Exercise catalog; quick-swap exercise; PWA + push notifications planned; GDPR endpoints; plan lifecycle (mesocycle prompt after cycle ends, profile-change banner).

**All architecture suggestions** — async plan generation via pg-boss + SSE; `Exercise` catalog; split `ExerciseLog` into `SessionExercise` + `SetLog` (per-set granularity with RPE/cardio fields); `WorkoutPlanDay` for session→day mapping; structured `EquipmentAvailability` and `Injury`; soft delete + `updatedAt`; indexes; pagination; retry + circuit breaker; prompt caching + version tracking + global budget cap + input length caps; email verification + password reset + login rate-limit + refresh-token rotation/revocation + CSRF; structured logging (pino), Sentry, CI/CD outline, migrations, backups.

**Personal-trainer suggestions explicitly applied (per user request):**
- (1) Per-set granularity — `SetLog` with reps, weight, RPE, rest, and cardio fields (durationSec / distanceM / avgHeartRate).
- (3) Mesocycles with progressive overload and a deload week (`weeksTotal`, `deloadWeekIndex`, `progression` per exercise).
- (5) Objective strength markers — `StrengthBenchmark` (estimated 1RM for key lifts) alongside subjective `fitnessSelfRating`.

**Shared cross-cutting recommendations applied** — per-set log, async generation, plan lifecycle, exercise catalog with instructions, granular inputs (sex / equipment list / structured injuries / benchmarks / session minutes / training years / PARQ + medical disclaimer).

Other trainer suggestions (substitution as first-class feature is included; form cues delivered via Exercise catalog; profile auto-adaptation deferred behind an explicit user prompt) are absorbed into other sections or listed under §9 Open Decisions.
