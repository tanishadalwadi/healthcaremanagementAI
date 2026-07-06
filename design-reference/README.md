# Handoff: Pulse — Hospital Workflow Coordination Design System

## Overview
Pulse is an AI-assisted workflow coordination platform for hospital teams. It is **not a diagnostic tool** — it shows where every patient is in the care journey, what's blocked, and what should happen next, for nurses, doctors, and care coordinators. This package documents a complete visual design system plus four core screens: nurse dashboard, doctor landing, patient detail (doctor + nurse views), and a component/foundations reference.

Synthetic data throughout — no real patient information.

## About the Design Files
The bundled file (`Pulse.dc.html`, with its runtime `support.js`) is a **design reference built in HTML** — a high-fidelity prototype of look, states, and interaction, not production code to copy verbatim. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, native, etc.), using its established component patterns, state management, and data layer — or, if no frontend environment exists yet, to choose the framework best suited to the project and implement the system there.

Open `Pulse Design System (standalone).html` directly in a browser to explore all screens and states live. A tab bar at the top switches between: **Foundations**, **Components**, **Nurse**, **Doctor**, **Patient detail**.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and copy are final. Recreate pixel-perfectly using the target codebase's component libraries and layout primitives.

## Brand Principle (critical — do not violate)
Purple (`#7C5FAE`) is the brand/identity color: used only for navigation, avatars, and primary actions. It **never** carries clinical urgency meaning. A completely separate status-color system (below) carries urgency. Any implementation must keep these visually distinct — a reviewer should never be able to confuse "this is a Pulse action" with "this patient needs attention."

## Design Tokens

### Color
| Token | Hex | Role |
|---|---|---|
| Background | `#F6F1F1` | Page background (warm lavender-cream, not white) |
| Surface | `#FFFFFF` | Cards, panels |
| Surface alt | `#EFEBEF` | Nested panels, inline detail blocks |
| Primary | `#7C5FAE` | Brand — nav, avatars, primary buttons, active states |
| Primary tint | `#EFE7F7` | Avatar backgrounds, active-nav background |
| Text primary | `#1D1B2E` | Headings, names |
| Text secondary | `#6B6474` | Body text |
| Text muted | `#8A8394` | Metadata, timestamps, placeholders |
| Hover border tint | `#C9BBDF` | Universal hover treatment (see Interactions) |

### Status taxonomy (the core visual language of the product)
| Status | Hex | Badge bg / text | Treatment | Meaning |
|---|---|---|---|---|
| On track | `#4FB5A8` | `#E1F3F0` / `#327A70` | Small dot only, quiet | Progressing normally |
| Delayed | `#E08A4F` | `#FBE9DA` / `#9A6435` | Small dot only, quiet | Behind schedule, still moving |
| Blocked | `#4A4458` (slate, not red-family) | `#EFEBEF` / `#4A4458` | Solid badge + colored left border on card, square corners | Stalled on a dependency (insurance, bed, consent) — administrative, not clinical |
| Critical | `#DC2626` (true red) | `#F8DFDB` / `#A83F2F` | Solid badge + colored left border on card, square corners | Clinically urgent, worsening |

**Hard rule:** On track / Delayed are *only ever* small quiet dots — never badges. Blocked / Critical are *only ever* solid badges with a left-border accent on their parent card — never bare dots. This dot-vs-badge split is the entire "quiet vs. interrupts" grammar and must never be blended (e.g. no "delayed" badge, no bare "critical" dot).

### Typography
Font: Hanken Grotesk (Google Fonts). Sentence case everywhere — no title case, no all-caps except eyebrow/caption labels (which use letter-spacing, not just caps, to read as intentional).

| Name | Size | Weight | Use |
|---|---|---|---|
| Display | 20px | 600 | Page-level headers (patient name on detail page) |
| Heading | 14–15px | 600 | Card titles, section headers |
| Body | 12–13px | 500 | Primary list/card content |
| Body small | 11px | 400 | Secondary metadata |
| Caption | 10px | 600, uppercase, `letter-spacing: 0.14–0.16em` | Eyebrow labels ("Diagnosis", "Care team") |
| Micro | 9px | 400–500 | Dense sub-labels, used sparingly |

Monospace (Spline Sans Mono) is used only for numeric/timestamp values (spacing-scale labels, timeline times) as a quiet "data" signal.

### Spacing scale
4 / 8 / 12 / 16 / 24 / 32 px.

### Radius scale
- 4px — inputs
- 10px — buttons
- 11–14px — avatars (rounded-square, **deliberately not circular**), cards
- 14px — cards
- 18px — panels, modal
- full/pill — status dots, tags, toggle switches

### Elevation
**Zero shadows anywhere** except the confirmation modal. Depth comes only from background-vs-surface contrast (`#F6F1F1` page vs. `#FFFFFF` cards vs. `#EFEBEF` nested blocks). The modal shadow: `0 24px 60px -12px rgba(29,27,46,0.4)`.

### Iconography
Outline-style icons only (Tabler icon font, via CDN `@tabler/icons-webfont`), never filled/solid. 13–15px inline, up to 20–22px for standalone icon buttons/badges. Icons are always paired with a text label — never icon-only (clinical stakes of misreading an icon).

## Interactions & Behavior

- **Hover state = subtle border-color tint shift only** (to `#C9BBDF` or similar), never a background-color change — a bg change would visually compete with the status-color system. Applies universally: buttons, inputs, cards, nav rows.
- **Loading state** = skeleton blocks matching the real layout's shape (rounded-rect placeholders in `#EFEBEF`/`#F0ECF1`), never a spinner.
- **Empty state** = invitation tone, names the space + one-line explanation, no apology copy. Example used: "No patients in Cardiology right now" / "New admissions will appear here as they're registered."
- **Error state** = dashed border (`1.5px dashed #C9BBDF`), reserved *exclusively* for errors — no other component in the system uses a dashed border.
- Expand/collapse (workflow groups, inpatient-care timeline) is a simple open/closed toggle — content is never permanently hidden, only collapsed by default.
- Tapping a patient card/row navigates to Patient detail with the appropriate role (nurse or doctor) pre-selected.

## Screens / Views

### 1. Foundations (reference only, not a product screen)
Documents brand-vs-status separation, core color tokens, the status taxonomy table, type scale, spacing scale, and radius/elevation — as shown live in `Pulse.dc.html`. Useful as the source of truth for tokens above; no need to reproduce this screen itself in the target app unless a living style guide is wanted.

### 2. Components (reference only, not a product screen)
A gallery of every primitive in every state: buttons (primary/secondary/ghost/danger/disabled/loading), search input, select, toggle switch, status dot/badge pair, compact patient card, expandable patient card (workflow-group chips → inline step list), AI summary panel, notifications list, care team list, treatment plan checklist, workflow timeline (3-phase), loading/empty/error states, and the confirmation modal. Use this as the component spec — each should become a reusable component in the target codebase.

**Buttons** — 5 variants, inline style reference:
- Primary: `background:#7C5FAE; color:#fff; border:1px solid #7C5FAE; border-radius:10px; padding:10px 18px;` hover → `background:#6E4FA3`
- Secondary (default choice): `background:#fff; color:#7C5FAE; border:1px solid #C9BBDF;` hover → `border-color:#7C5FAE`
- Ghost: `background:transparent; color:#6B6474; border:1px solid transparent;` hover → `border-color:#E0D8E4`
- Danger: `background:#DC2626; color:#fff; border:1px solid #DC2626;` hover → `background:#C41F1F`
- Disabled: `background:#EFEBEF; color:#B7B0BD; border:1px solid #E5E0E7; cursor:not-allowed;`
- **Rule: max one Primary button per screen.**

**Patient card (compact)** — rounded-square avatar (11px radius, `#EFE7F7` bg, `#7C5FAE` initials, 38×38), name (13px/600), room/dept/day (11px/400, muted), trailing status dot or badge. Card: `border:1px solid #EEE8EF; border-left:3px solid <status border or transparent>; border-radius:14px;`.

**Patient card (expandable)** — same header at larger scale (40×40 avatar), plus three tappable workflow-group chips: "Intake & diagnosis" / "Inpatient care" / "Discharge", each showing its own collapsed status (worst status among its child steps) as a dot or badge + chevron. Tapping toggles an inline list of individual steps (Registered, Vitals, Doctor, Scan, Results, Bed assigned for intake; Meds, Labs, Rounds for inpatient; Discharge planning for discharge), each with its own dot/badge.

**AI summary card** — quiet inset panel (not a full bordered card), `background:#EFEBEF; border-radius:12px; padding:14px 16px;`, sparkle icon + "AI summary" eyebrow label in primary purple, one sentence body text in `#4A4458`. Copy must always cite a specific logged data point/timestamp (e.g. "CT ordered 3h20m ago, still awaiting results — queue backlog in radiology") — never a vague/generic claim.

**Workflow timeline** — vertical, 3 phases sharing one `border-left:2px solid #ECE6EE` guide line with small dots marking each event:
- *Intake & diagnosis*: every step shown directly and linearly (one-time sequence).
- *Inpatient care*: collapsed by default to an event count + any flagged exception (e.g. "18 events logged · 1 flagged" + amber flag row for "Metoprolol 2:00 PM overdue"); "Show all" expands to the full chronological event list.
- *Discharge*: shows planning status as a badge + explicit note; if blocked, states the blocking reason plainly (e.g. "Blocked — awaiting insurance clearance").

**Notifications panel** — flat list, each row: status dot (same palette/meaning as everywhere else — no separate notification color system), one-line description, relative timestamp, whole row tappable through to the patient.

**Confirmation modal** — reserved for destructive/hard-to-reverse actions only (e.g. "Discharge patient…"). Centered overlay on `rgba(29,27,46,0.34)` scrim; card `border-radius:18px`, `box-shadow:0 24px 60px -12px rgba(29,27,46,0.4)` (the **only** shadow in the entire system); danger-colored icon chip, message referencing what's still pending, Secondary "cancel" action + Danger "confirm" action.

**Care team list** — multiple rows, each an avatar + name + role label (e.g. "Attending · Cardiology", "Nurse · Day shift") — never a single "assigned doctor" field.

**Treatment plan list** — ordered checklist; done items show a filled purple-tint check chip + strikethrough-free muted text; pending items show an empty outlined square + full-weight dark text.

### 3. Nurse dashboard/landing
Two-column shell: fixed 212px sidebar (Dashboard/Patients/Departments/Analytics/Notifications nav, active item on `#EFE7F7` bg with `#7C5FAE` text/icon; user chip at bottom) + main content.

Main content, top to bottom:
1. Search/filter bar: search input (icon + placeholder "Search patients, rooms, teams…"), department select, filter button — all same input styling.
2. Greeting line + date/shift context.
3. **KPI row** — 4 equal cards (Total patients, Delayed, Critical, Discharge ready), each: small icon chip in the status tint color, large number (28px/700) in the matching status hex, label below in muted secondary text.
4. **"Needs your attention" action feed (primary content)** — a single white card containing a prioritized, cross-patient list: icon chip + title + patient/room subline + status dot-or-badge + relative time + chevron. This is the primary task-first view — ranked by urgency across all patients, not grouped by patient.
5. **"Roster by department" (one tap away, not default)** — patients grouped under department eyebrow headers (Cardiology, Emergency, Oncology, Neurology, General medicine), each a 3-column grid of compact patient cards. Names are the most prominent element per card.

### 4. Doctor landing page
Fundamentally different shell from the nurse dashboard — **chat-first, not list-first**. Single centered white panel (max-width ~760px), full viewport height minus chrome, three fixed zones:
1. **Header** — "Morning rounds" title + doctor identity line; rounds-progress bar: label "6 of 10 patients reviewed" + remaining count, then a filled track (`height:8px; border-radius:999px; background:#EFEBEF;` filled portion `background:#7C5FAE`, width = percentage complete). A history toggle button (icon + label) sits top-right and swaps the middle zone.
2. **Middle (scrollable)** — today's patient list: compact rows (review-state icon — filled check circle in purple if reviewed, empty outline circle if not; dimmed name text once reviewed) + avatar + name + room/diagnosis + status dot/badge. Toggling history swaps this to previously-treated/discharged patients grouped by recency ("This week" / "Earlier"), each row: avatar, name, brief diagnosis, discharge date.
3. **Footer (fixed/anchored, always visible regardless of scroll)** — suggested-prompt chips (pill buttons, e.g. "Show critical patients", "Who's blocked on discharge?") above an "Ask Pulse" input: sparkle icon + placeholder "Ask about any patient…" + microphone icon button + purple send button.

### 5. Patient detail page
Shared shell for both doctor and nurse views (role switcher in the page header — a segmented control, not a tab in the URL sense; sidebar content changes but the shell doesn't).

**Header**: back button, rounded-square avatar (46×46), patient name (20px/600) + status badge/dot inline, room/department/day-of-stay subline, role switcher (Doctor view / Nurse view) top-right.

**Layout**: two columns — main (wider, ~1fr) + persistent sidebar (fixed ~336px, always visible, not a tab).

**Main column** — "Care journey" card containing the full vertical workflow timeline (see Components spec above), same 3-phase structure, same collapse/expand behavior.

**Sidebar** — always starts with the AI summary panel (same component as elsewhere), then role-specific content:
- *Doctor view*: Diagnosis summary card (eyebrow + one-line diagnosis), Care team list, Treatment plan checklist.
- *Nurse view*: "Tasks & workflow notes" card (next med due — icon chip colored amber if overdue, teal if on schedule; last round completed), separate "Pending orders" card (checklist-style list of outstanding orders + timing).

### Dashboard density test
The nurse dashboard's "Roster by department" section is populated with 14 patients across 5 departments (Cardiology, Emergency, Oncology, Neurology, General medicine) with a realistic status mix (mostly on-track, several delayed, one critical, one blocked) to prove legibility at real density — implement with the same card component, just more instances.

## State Management
- `view`: which top-level screen is active (`foundations | components | nurse | doctor | detail`) — in the target app this is routing, not a single-page tab state.
- `detailId` + `detailRole` (`doctor | nurse`): which patient and which role's sidebar is shown on the detail page.
- Per-workflow-group and per-timeline-phase `expanded` booleans (keyed by patient+group) — default collapsed.
- Doctor landing: `docHistory` boolean toggling today's-list vs. history-list.
- Confirmation modal: simple open/closed boolean, opened only by a destructive action trigger.
- Underlying data model per patient: `id, name, initials, department, room, dayOfStay, status (ontrack|delayed|blocked|critical), diagnosis, aiSummary, workflowGroups[{key, status, steps[{name, status}]}], inpatientEventCount, inpatientFlaggedException, dischargeStatus, dischargeNote`. Status is derived bottom-up: a group's collapsed status = the worst (highest-urgency) status among its child steps.

## Assets
- Font: Hanken Grotesk + Spline Sans Mono, loaded from Google Fonts.
- Icons: Tabler Icons webfont (outline style), loaded from `@tabler/icons-webfont` CDN. No custom/raster icon assets.
- No photography or illustration assets used anywhere in this system.

## Files
- `Pulse Design System (standalone).html` — the full interactive prototype (all 5 views, live), bundled as a single self-contained file. Open it directly in any browser, no server or extra files needed.
