# Gymify AI — Implementation TODO
> Orchestrator tracks progress here. ✅ = done, 🔄 = in progress, ❌ = not started

## ACCEPTANCE CRITERIA
- Working app deployable based on design spec
- Matches UI design (compare browser with mockups)
- All links work correctly
- User can complete onboarding and generate a training plan
- On 3rd attempt, payment modal is shown
- After valid card data (format check only), user gets premium access
- User can generate unlimited plans as premium

---

## PHASE 1: Backend Platform (Backend Platform Developer)
- [ ] ❌ Payment route: POST /api/payment/submit (Luhn validate server-side, set isPremium=true, return new JWT)
- [ ] ❌ Exercises route: GET /api/exercises (list with filters), GET /api/exercises/:slug
- [ ] ❌ Stats route: GET /api/stats/progress (e1RM trends, weekly volume, streak)
- [ ] ❌ Worker: pg-boss setup + index.ts entry point
- [ ] ❌ Worker: generatePlan job (Claude API with prompt caching, retry, circuit breaker)
- [ ] ❌ Worker: plan validator (Zod + business rules)
- [ ] ❌ Prisma seed: ~150 exercises across muscle groups
- [ ] ❌ Tests: payment, exercises, stats, worker (mock Claude)
- [ ] ❌ Update /api/routes/index.ts to register new routes

## PHASE 2: Backend Onboarding & Sessions (Backend Developer 2)
- [ ] ❌ Fix onboarding flow: PUT /api/profile called with wizard data before plan generation
- [ ] ❌ Sessions routes: POST /api/sessions (start from planDay)
- [ ] ❌ Sessions routes: GET /api/sessions/:id (full with sets)
- [ ] ❌ Sessions routes: PATCH /api/sessions/:id (update notes/status/RPE)
- [ ] ❌ Sessions routes: POST /api/sessions/:id/sets (append SetLog)
- [ ] ❌ Sessions routes: PATCH /api/sessions/:id/sets/:setId (edit set)
- [ ] ❌ Sessions routes: DELETE /api/sessions/:id/sets/:setId
- [ ] ❌ Sessions routes: POST /api/sessions/:id/complete
- [ ] ❌ Sessions routes: GET /api/sessions (paginated list)
- [ ] ❌ Plans routes: POST /api/plans/:id/regenerate
- [ ] ❌ Plans routes: GET /api/plans (history)
- [ ] ❌ Plans routes: GET /api/plans/:id (specific plan)
- [ ] ❌ Plans routes: PATCH /api/plans/:id/exercises/:slot (quick swap)
- [ ] ❌ Tests: sessions, plans completion

## PHASE 3: Frontend Views (Frontend Developer)
- [ ] ❌ WorkoutPage: set logging (weight/reps/RPE steppers), rest timer, per-exercise cards
- [ ] ❌ WorkoutPage: offline queue (IndexedDB via offlineQueue.ts), autosave
- [ ] ❌ WorkoutPage: complete workout modal (overall RPE + notes)
- [ ] ❌ PlanPage: mesocycle view with week tabs, exercise list, quick-swap
- [ ] ❌ PlanPage: regenerate plan button + reason modal
- [ ] ❌ HistoryPage: paginated session list, progress charts (e1RM trends)
- [ ] ❌ ProfilePage: editable basic data, equipment, injuries, benchmarks
- [ ] ❌ i18n: add missing keys to en.json and pl.json
- [ ] ❌ Tests: WorkoutPage (set logging, rest timer), OnboardingPage

## PHASE 4: Integration & Verification (Orchestrator)
- [ ] ❌ Run full app: verify landing page matches design
- [ ] ❌ Verify onboarding wizard: all 6 steps, email modal, profile save
- [ ] ❌ Verify plan generation: SSE progress, navigate to dashboard
- [ ] ❌ Verify quota gate: 3rd attempt shows payment modal
- [ ] ❌ Verify payment modal: Luhn check, valid card → premium
- [ ] ❌ Verify dashboard: real data, start workout link
- [ ] ❌ Verify all navigation links work
- [ ] ❌ Fix any visual discrepancies vs design

---
_Last updated: 2026-05-26 by Orchestrator_
