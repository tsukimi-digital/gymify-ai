# Gymify AI — Implementation TODO
> Orchestrator tracks progress here. ✅ = done, 🔄 = in progress, ❌ = not started


## ACCEPTANCE CRITERIA
- [x] Working app deployable based on design spec
- [x] Matches UI design (compared browser with mockups)
- [x] All links work correctly
- [x] User can complete onboarding and generate a training plan
- [x] On 3rd attempt, payment modal is shown (HTTP 402 → PaymentModal)
- [x] After valid card data (format check only), user gets premium access
- [x] Premium user can generate unlimited plans

---

## PHASE 1: Backend Platform ✅
- [x] Payment route: POST /api/payment/submit (Luhn validate, isPremium=true, return new JWT)
- [x] Exercises route: GET /api/exercises (list with filters), GET /api/exercises/:slug
- [x] Stats route: GET /api/stats/progress (e1RM trends, weekly volume, streak)
- [x] Worker: polling loop entry point (index.ts)
- [x] Worker: generatePlan job (Claude API / MOCK_ANTHROPIC, phases, SSE progress)
- [x] Worker: plan validator (Zod + business rules)
- [x] Prisma seed: 20 core exercises seeded
- [x] Tests: payment, exercises, stats, worker (mock Claude)
- [x] routes/index.ts: all routes registered (auth, profile, plans, payment, sessions, stats, exercises)

## PHASE 2: Backend Onboarding & Sessions ✅
- [x] Fix onboarding: PUT /api/profile called with wizard data before plan generation
- [x] OnboardingPage: QuotaExceededError (402) shows PaymentModal inline
- [x] Sessions routes: POST /api/sessions (start from planDay)
- [x] Sessions routes: GET /api/sessions/:id (full with sets)
- [x] Sessions routes: PATCH /api/sessions/:id/sets/:setId (edit set)
- [x] Sessions routes: POST /api/sessions/:id/sets (append SetLog, idempotent)
- [x] Sessions routes: POST /api/sessions/:id/complete
- [x] Sessions routes: GET /api/sessions (paginated list)
- [x] Plans routes: GET /api/plans (history)
- [x] Plans routes: GET /api/plans/:id (specific plan)
- [x] Plans routes: POST /api/plans/:id/regenerate
- [x] Tests: sessions, plans

## PHASE 3: Frontend Views ✅
- [x] WorkoutPage: set logging (weight/reps/RPE steppers), rest timer
- [x] WorkoutPage: offline queue (IndexedDB via offlineQueue.ts), autosave
- [x] WorkoutPage: complete workout modal (overall RPE + notes)
- [x] PlanPage: mesocycle view with week tabs, exercise list
- [x] HistoryPage: paginated session list, progress charts (e1RM trends)
- [x] ProfilePage: editable forms, logout
- [x] i18n: keys for all views (en.json + pl.json)
- [x] Tests: EmailModal, Luhn, fingerprint

## PHASE 4: Integration & Verification ✅
- [x] Full build passes (shared, backend, worker, frontend)
- [x] Backend health endpoint: OK
- [x] Auth flow: identify → JWT tokens
- [x] Profile save via wizard data
- [x] Plan generation: SSE progress ANALYZING→DESIGNING→SELECTING→VALIDATING→DONE
- [x] Quota gate: 3rd attempt returns 402 QUOTA_EXCEEDED
- [x] Payment modal: card validation + isPremium unlock
- [x] Premium plan generation: unlimited

## TypeScript Build Fixes ✅
- [x] backend tsconfig: removed rootDir to allow shared path alias
- [x] stats.ts: explicit type annotation
- [x] identity.ts: extraMeta cast
- [x] primitives.tsx: Omit<InputHTMLAttributes, 'size'>
- [x] PlanPage.tsx: Badge className fix
- [x] tailwind.config.js: z-modal/z-toast/z-overlay custom z-index values

---
_Last updated: 2026-05-26 by Orchestrator — PHASE 1-4 COMPLETE_
