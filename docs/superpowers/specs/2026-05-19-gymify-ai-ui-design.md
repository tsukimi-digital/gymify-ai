# Gymify AI — UI Design Spec

**Date:** 2026-05-19
**Companion to:** `2026-05-19-gymify-ai-design.md` (architecture / data / API)
**Mockup artifacts:** `.superpowers/brainstorm/58751-1779199233/content/*.html`

This document captures the visual language and screen-by-screen UI patterns agreed during brainstorming. It is the source of truth for the React + Tailwind implementation.

---

## 1. Design language

**Mood:** **Bold & Energetic.** Dark-mode-first, high contrast, orange accent. Atletic but not screaming — the orange is used as a precise accent, not flooded across the UI. Inspirations: Nike Training Club, Linear.

**Personality cues:**
- Encouraging, not patronising. Polish copy uses second-person ("Twój plan", "Rozpocznij trening") and avoids exclamation marks except in genuinely celebratory contexts.
- Confident hierarchy: one primary CTA per screen, supported by quieter outlined / ghost actions.
- Information dense where useful (workout view, history), spacious where motivating (dashboard hero, onboarding).

---

## 2. Visual tokens

### Color palette

| Token | Hex | Usage |
| --- | --- | --- |
| `bg/base` | `#0F1115` | App background |
| `bg/elevated` | `#1A1D24` | Cards, surfaces |
| `bg/raised` | `#2A2D35` | Inner surfaces, set cells |
| `border/subtle` | `#2A2D35` | Card outlines, dashed states |
| `accent/500` | `#FF6B35` | Primary accent (CTAs, highlights, active states) |
| `accent/400` | `#FF8559` | Gradient start (top-left of CTA gradient) |
| `accent/tint` | `rgba(255,107,53,0.10)` | Soft accent backgrounds (selected chips, badges) |
| `accent/ring` | `rgba(255,107,53,0.25)` | Selection ring / glow |
| `text/primary` | `#FFFFFF` | Headings, primary text |
| `text/secondary` | `#9CA3AF` | Body, subtitles |
| `text/tertiary` | `#6B7280` | Labels, meta |
| `text/disabled` | `#4A4D55` | Disabled, upcoming states |
| `danger` | `#EF4444` | Destructive actions ("Wyloguj się", delete) |

Light theme is supported (per architecture spec) — token semantics stay; concrete hex values flip. Light theme is **not** designed in this round; defer to follow-up.

### Primary gradient

`linear-gradient(135deg, #FF8559 0%, #FF6B35 100%)`
Shadow under primary CTA: `0 8px 24px rgba(255, 107, 53, 0.28)`.
Used only for the main CTA on a given screen.

### Typography

- **Font family:** Inter, system fallback.
- **Sizes (mobile):**
  - Display: 26 px / 800 / -0.6 letter-spacing (hero titles, wizard step titles)
  - Title L: 22 px / 800 / -0.5 (section heros, big stat values)
  - Title M: 20 px / 800 / -0.5 (exercise names)
  - Title S: 17 px / 800 / -0.4 (profile name)
  - Body M: 15 px / 600 (CTA text, primary body)
  - Body S: 14 px / 700 (card titles, set-cell values)
  - Body XS: 13 px / 600 (subtitles, secondary text)
  - Caption: 12 px / 600 (meta)
  - Label: 11 px / 700 / 1.3 letter-spacing / UPPERCASE (section labels)
  - Micro: 10 px / 700 / 1.4 letter-spacing / UPPERCASE (step indicators, table headers)
- **No uppercase for buttons or main copy** — uppercase is reserved for labels and step markers only.

### Spacing & radii

- Base unit: 4 px.
- Outer screen padding: 16–18 px.
- Card radius: 18 px (default), 22 px (hero), 24 px (large surfaces).
- Button radius: 16 px (default), 18 px (primary CTA).
- Tile/icon radius: 10–14 px.
- Inner controls: 10 px.
- Pill: 999 px (chips, streak counter, nav-bar items when active inside a rounded container).

### Elevation

Minimal. Single shadow used: the primary CTA glow.
Cards rely on background contrast (`bg/elevated` on `bg/base`) instead of shadows.

### Iconography

- Outlined / monoline glyphs.
- Emoji used sparingly for **categorical visual anchors** (goal cards, equipment chips, profile rows) — never as primary decoration.
- Functional icons are simple unicode for now (`→`, `✓`, `↻`, `▶`, `⋯`, `←`, `ⓘ`); to be replaced with Heroicons or Lucide in implementation.

---

## 3. Component patterns

### Primary CTA (button)

```
bg: linear-gradient(135deg, #FF8559, #FF6B35)
color: #0F1115
font: 15 / 700 / -0.3
padding: 16 22
border-radius: 18
shadow: 0 8px 24px rgba(255,107,53,0.28)
layout: flex, space-between
left: optional mini-tile (26×26 / radius 8 / bg rgba(15,17,21,0.15)) + label
right: meta text or arrow
```

States: pressed (no shadow, scale 0.98), disabled (replace with `bg/elevated`, text `text/disabled`, no shadow).

### Outline / secondary CTA

```
bg: transparent
color: #FF6B35
border: 1px solid rgba(255,107,53,0.35)
padding: 12 14
border-radius: 14
font: 13 / 700
```

### Ghost button (compact action)

```
bg: #0F1115
border: 1px solid #2A2D35
color: #9CA3AF
padding: 11 8
border-radius: 12
font: 12 / 700
```

### Cards

- Container: `bg/elevated`, radius 18–24, padding 14–22.
- Selected state (single- or multi-select): tint background `rgba(255,107,53,0.08)`, border 2 px `#FF6B35`, optional 4-px outer ring `rgba(255,107,53,0.10)`.

### Stepper input (weight / reps in active set)

```
container: bg #1A1D24, border 1px #FF6B35, radius 10, height 44
columns: 30px (−) | 1fr (value) | 30px (+)
− / + : color #FF6B35, font 16 / 800
value : color #fff, font 15 / 800, centered
```

`inputMode="decimal"` for weight; tapping the central value opens the native numeric keypad. Tap `+`/`−` increments by 2.5 kg (weight) or 1 rep. Long-press on `+`/`−` fast-scrubs by 5 (both weight and reps).

### Chip selectors

- Multi-select: tile with icon + label, 2-col grid, selected = orange border + tint background.
- Single-select RPE: chip row 6 / 7 / 8 / 9 / 10, long-press for half-points (e.g. 6.5, 7.5). Selected = filled orange.

### Progress indicators

- Wizard dots: 7-segment row of 4-px-tall pills, gap 4. `done` and `active` both `#FF6B35`; `pending` `#2A2D35`.
- Plan / mesocycle bar: 6 px tall, `bg/raised` base, filled with gradient `accent/400 → accent/500`.

### Status dots (week strip)

- Done: orange fill 6 × 6.
- Today: orange filled tile background with dark inner dot.
- Rest day: dark gray dot.
- Upcoming: empty ring `1px solid text/tertiary`, dashed tile border.

### Bottom navigation

- Floating pill at bottom of dashboard / persistent screens.
- 4 items: Dziś · Plan · Historia · Profil.
- Active item: filled orange tile, icon + label in `bg/base`.
- Inactive: transparent, icon + label in `text/secondary`.
- Container: `rgba(26,29,36,0.9)` with `backdrop-filter: blur(20px)`, radius 24.

### Top bar (in-screen / detail views)

- Left + right tiles: 36–40 px, radius 10–12, `bg/elevated`, single glyph.
- Center: two-line title (main + meta UPPERCASE micro-label).

---

## 4. Screen specifications

All screens target a **390 px reference width** (iPhone Pro class), base text at 14 px, fluid scaling up for ≥ 640 px.

### 4.1 Onboarding Wizard

6 steps with the same chrome:

- Top bar: 36-px back tile + 6-segment progress row.
- Step label (`Krok N z 6` micro-label) + display title + subtitle (15 px / `text/secondary`).
- Body (varies per step).
- Bottom: primary CTA + optional skip link in `text/tertiary`.

**Step 1 — Goal** (single-select)
- 4 stacked goal cards: icon tile (48 × 48, radius 14) + title + 1-line description + radio circle on the right.
- Selected card: tinted bg, orange border, ring; icon tile flips to filled orange.

**Step 2 — Basic data**
- Form: sex (3 chips MALE/FEMALE/OTHER), weight (kg/lbs toggle), height (cm/ft toggle), age, unit preference radio.
- Compact stacked fields with floating labels.

**Step 3 — Availability**
- `daysPerWeek` slider 1–7, `sessionMinutes` chip row (30 / 45 / 60 / 75 / 90 / 120), `trainingYears` number, `fitnessSelfRating` 3-card single-select.

**Step 4 — Equipment** (multi-select)
- 2-col grid of equipment chips (icon + label), variable count visible on CTA ("Dalej · 5 wybrane").
- Skip link "Mam tylko ciężar ciała" auto-selects `BODYWEIGHT_ONLY` and skips.

**Step 5 — Health**
- PARQ-style checklist (4–6 yes/no rows) — any "yes" surfaces a warning banner but does not block.
- Medical disclaimer card with explicit accept toggle.
- Structured injuries: "+ Dodaj kontuzję" reveals body area + side + status + free-text restriction.

**Step 6 — Strength benchmarks** (optional)
- 5 key lifts as rows: name + weight stepper + reps stepper + `≈ e1RM XX kg` hint.
- "Nie znam" toggle per row marks unknown; "Pomiń wszystko" skip link.

### 4.2 Plan generation loading

- Pulsing concentric orange glow with a centered 56-px gradient tile + glyph 🤖 (or running figure).
- Display title "Tworzymy Twój plan" + subtitle "To zajmie 30–60 sekund".
- Linear progress bar (gradient fill).
- Phase checklist in elevated card:
  - `done` rows: orange filled dot ✓
  - `active` row: ringed dot, accent text, 700 weight
  - `pending` rows: muted dot, secondary text
- Phases (mapped from `PlanGenerationJob.phase` enum):
  1. Analizujemy Twój profil — `ANALYZING_PROFILE`
  2. Projektujemy harmonogram tygodnia — `DESIGNING_SCHEDULE`
  3. Dobieramy ćwiczenia pod Twój sprzęt — `SELECTING_EXERCISES`
  4. Weryfikacja i bezpieczeństwo — `VALIDATING`
- Fed by SSE stream `/api/plans/jobs/:jobId/stream`; polling fallback (5s interval) when SSE unavailable.
- Error state: `danger` color icon, "Coś poszło nie tak. Spróbuj ponownie.", retry button, "Wróć do profilu" link. Triggered when `PlanGenerationJob.status = FAILED` (with `errorCode` mapped to a user-friendly message).

### 4.3 Dashboard

Order top to bottom:
1. **Greeting header** — date label + name + streak pill on the right (🔥 + day count).
2. **Hero card "Dzisiejszy trening"** — focus name + muscle groups + primary CTA. If no plan: "Wygeneruj plan" CTA replaces hero content. If today is a rest day: "Dzisiaj odpoczywaj" muted card + secondary "Pokaż plan" link.
3. **Week strip** — 7 day tiles Mon–Sun with status dots; header label "Ten tydzień" + completed-of-planned count in accent.
4. **Quick stats (2-col)** — last-session volume and key-lift e1RM, each with trend (↗ / ↘).
5. **Mezocycle progress** — title "Mezocykl · Tydzień N z M", progress bar, meta (split name · deload week info), tap → Plan view.
6. **Bottom nav** (floating).

Empty states:
- No plan: hero replaced by "Stwórz swój plan" full-width card with primary CTA → loading flow.
- No sessions yet: week strip shows all-upcoming; stats card shows "Zaloguj pierwszy trening".

### 4.4 Workout (Session View)

Sticky **top bar**: close (✕) + center "{focus} · {elapsed} · {n} z {total}" + overflow menu (⋯ — opens substitute, edit notes, abandon session).

**Rest timer band** (only when rest is running):
- Full-width orange gradient pill, height ~80 px.
- Left: timer tile (⏱) + label "Odpoczynek" + countdown (22 px / 800).
- Right: "Pomiń" ghost-dark button.
- Vibrates + plays soft tone at completion. ARIA live region announces "Odpoczynek zakończony" for screen readers.

**Active exercise card**:
- Header: micro-label "Ćwiczenie N z M", display title, muscle subtitle, info-tile (ⓘ) opens instructions modal pulling `instructions`, `imageUrl`, `videoUrl` from the `Exercise` catalog (`GET /api/exercises/:slug`).
- Target pill: "Plan · 4 × 8-10 @ RPE 7   ·   Odpoczynek 90s" in accent tint.
- Sets table (5-col grid: index | weight | reps | RPE | check):
  - `done` rows: dimmed, no inputs, ✓ chip.
  - `active` row: stepper inputs, RPE chip selector, large filled-orange ✓ button (44 × 44) commits the set and starts the rest timer.
  - `upcoming` rows: dashed cells with em-dash, hollow ○ circle.
- Action row below: "Powtórz ostatnią" (outline primary) · "+ Drop set" · "⇄ Zamień" (substitute exercise modal).

**Next exercises** list — `bg/elevated` cards, name + meta + numeric badge. Tap → that exercise becomes active (current pauses, can be resumed).

**Sticky bottom CTA** — "Zakończ trening →" (primary gradient). Opens a finalization sheet asking overall RPE (1–10) and free-text notes.

Offline / network states:
- Network loss: subtle pill near top "Offline — zapisujemy lokalnie" in `text/tertiary` background.
- Sync resumes silently on reconnect.

### 4.5 Plan View

- Top bar: back, center "Mezocykl · {goalLabel}" + meta (`{split} · {N} tygodni`), right "↻" (regenerate shortcut).
- Week tabs row: T1 / T2 / T3 / T4… with deload week marked "D" suffix on a dashed background.
- Day cards (one per day in selected week):
  - Day tile (Mon shorthand `PN`), name, focus subtitle.
  - Right: status badge (DONE / SKIPPED) or meta ("5 ćw · 45m"), or nothing if rest day.
  - Tap → day detail (sheet) with full exercise list and per-exercise quick-swap.
- Footer: outlined "↻ Wygeneruj plan ponownie" → opens reason modal (`reason` field, max 300 chars) → enqueues regeneration job.

Rest days: muted opacity, no metadata, label "Odpoczynek · Regeneracja, mobilność".

### 4.6 History

Tab switcher at the top: **Lista** / **Postęp**.

**Lista tab:**
- Cursor-paginated list of past sessions.
- Each card: date block (day of week + day number) + body (name + meta "{n} ćw · {n} serii · {duration}") + RPE chip.
- Tap → session detail (read-only by default, edit affordance in overflow).
- Empty: "Twoja historia treningowa pojawi się tutaj."

**Postęp tab:**
- For each tracked lift (configurable): e1RM mini-chart (8-bar) with trend chip "↗ +5 kg".
- 7-day rollup tile: total volume + total sets, trend.
- Volume per muscle group (collapsible).

### 4.7 Profile

- Header: avatar tile (gradient orange, initial), display name, email.
- Section "Dane treningowe": Profil · Sprzęt · Kontuzje · Benchmarki siłowe (each row: icon tile + title + meta summary + chevron). Tap opens an editor sheet.
- Section "Ustawienia": Tryb ciemny (toggle), Jednostki, Język.
- Section "Konto" (collapsed by default): Zmień hasło · Eksport danych (GDPR) · Usuń konto.
- Bottom: "Wyloguj się" centered, danger color.

---

## 5. Mobile-first + responsive

- Base styles target 360–390 px width.
- Touch targets: ≥ 44 × 44 px for all interactive elements.
- Form inputs that take numbers (weight, reps, age, height) use `inputMode="decimal"` (numeric keypad on iOS / Android).
- Hover states are designed but not required for tap interactions; focus-visible rings (orange, 2 px) are mandatory for keyboard / a11y.
- `≥ 640 px` (sm): layouts add side margins, content stays single-column.
- `≥ 768 px` (md): dashboard can adopt 2-column hero (weekly strip side-by-side with hero card); workout view stays single-column for thumb reach.
- `≥ 1024 px` (lg): not designed in this round; defer.

---

## 6. Accessibility

- **WCAG 2.2 AA** target (consistent with architecture spec).
- Color contrast: white on `bg/elevated` = 12.7:1; `text/secondary` on `bg/base` = 5.7:1; orange CTA text (`bg/base` on `#FF6B35`) = 6.1:1 — all pass AA.
- Focus ring: 2 px `#FF6B35`, 2-px offset; never relies on color alone — buttons / chips also gain a subtle outline.
- Wizard advances on `Enter`; back is always available; progress is announced as `aria-valuenow` on the progress bar.
- Rest timer is in an `aria-live="polite"` region; completion announces "Odpoczynek zakończony".
- Set logging uses semantic `<table>` with `<th>` for column headers; per-set inputs are labelled.
- Emoji used as decoration carry `aria-hidden="true"`; categorical emoji (goal icons) carry an accessible name on the parent option.

---

## 7. Motion

Restrained, purposeful:

- CTA press: scale to 0.98, 100 ms.
- Card selection (wizard): border / ring transition 120 ms, no movement.
- Rest timer numbers tick with no easing.
- Loading screen: subtle pulse on hero glow (3 s ease-in-out, infinite); progress bar fill animates in 400 ms whenever phase advances.
- Page transitions: 200 ms cross-fade, no slide.
- Respect `prefers-reduced-motion: reduce` — disable pulse, replace all transitions with instant state changes.

---

## 8. Mapping to architecture spec

| UI element | Backend field / endpoint |
| --- | --- |
| Hero "Dzisiejszy trening" | `WorkoutSession` for today + `WorkoutPlanDay` it maps to |
| Streak counter | derived from contiguous `COMPLETED` sessions ending today |
| Week strip | sessions in `(monday … sunday)` with `status` |
| Quick stats | `/api/stats/progress` (volume last session, key-lift e1RM) |
| Mezocycle progress | `WorkoutPlan.weeksTotal` + current week index |
| Loading phases | `PlanGenerationJob.phase` enum (4 phases + DONE) |
| Plan View week tabs | `WorkoutPlan.content.mesocycle.schedule[weekIndex]` |
| Set logging UI | `POST /api/sessions/:id/sets` (one row per set) |
| RPE chip | `SetLog.rpe` |
| Rest timer | `restSeconds` from plan; on commit, persist actual into `SetLog.restSeconds` |
| Substitute exercise | `PATCH /api/sessions/:id/exercises/:seId/substitute` |
| Regenerate plan | `POST /api/plans/:id/regenerate` with `reason` |
| History "Lista" | `GET /api/sessions` cursor-paginated |
| Progress chart | `GET /api/stats/progress` per-lift e1RM series |
| Profile rows | `GET /api/profile` aggregate (profile + equipment + injuries + benchmarks) |

---

## 9. Open UI questions (deferred)

1. **Light theme palette.** Tokens are abstract; concrete light-mode hex set not designed this round.
2. **Onboarding microcopy.** Final copy will go through one editorial pass when implementing.
3. **Empty-state illustrations.** Currently text-only; consider light spot illustrations later (out of MVP).
4. **Notification UI** (rest-timer push, scheduled-day reminders) — deferred per architecture spec §9.
5. **Icon system.** Unicode glyphs in mockups; pick Heroicons or Lucide at implementation time.
6. **Charting library.** Bars currently mocked with divs; pick Recharts or Visx (or build minimal SVG inline) at implementation.

---

## Appendix — Decisions made during brainstorming

- **Visual direction:** Bold & Energetic over Calm & Focused, Modern Sport, Friendly & Warm. Reason: matches the gym training context and motivates action without being childish.
- **Primary CTA style:** Variant B — squircle (18 px radius) with subtle gradient + inline meta-tile + duration on the right. Rejected variants: pill (too Apple-soft), ghost (too minimal for primary action), tall dual-line (too busy for repeated use).
- **Dashboard structure:** hero-first, then week strip, then stats, then mesocycle — moves user from immediate action to broader context.
- **Workout interaction:** big steppers + RPE chip + single large commit ✓ — works with sweaty fingers and supports the per-set log structure required by the trainer review.
