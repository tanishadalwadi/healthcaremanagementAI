# Pulse Frontend

Welcome to the Pulse frontend. Pulse is an AI-powered Healthcare Workflow Coordinator that helps nurses and healthcare staff monitor patient workflows, identify bottlenecks, and receive AI-powered summaries of patient progress.

This README is your starting guide for architecture, workflow, and coding standards.

---

## Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| **React** | UI library for building component-based interfaces |
| **Vite** | Fast dev server and build tool |
| **TypeScript** | Type safety and better developer experience |
| **TailwindCSS** | Utility-first styling for consistent layouts |
| **shadcn/ui** | Accessible, customizable UI primitives built on Radix |
| **React Router** | Client-side routing between pages |
| **Zustand** | Lightweight global state management |
| **TanStack Query** | Server state, caching, and async data fetching |
| **Framer Motion** | Subtle, purposeful UI animations |

We chose this stack for speed, maintainability, and a modern SaaS-quality user experience.

---

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/tanishadalwadi/healthcaremanagementAI.git
   cd healthcaremanagementAI
   ```

2. **Open the frontend folder**

   ```bash
   cd frontend
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Visit [http://localhost:5173](http://localhost:5173)

### Other useful commands

```bash
npm run build      # Production build
npm run preview    # Preview production build locally
npm run typecheck  # Run TypeScript checks
npm run lint       # Run ESLint
```

---

## Folder Structure

```
frontend/
├── public/              # Static files served as-is (favicon, etc.)
└── src/
    ├── assets/          # Images, icons, fonts
    ├── components/      # Reusable UI components (not feature-specific)
    │   ├── ui/          # shadcn/ui primitives (Button, Card, Dialog, etc.)
    │   ├── layout/      # App shell (Sidebar, Header, PageLayout)
    │   └── shared/      # Cross-feature reusable components
    ├── features/        # Business-specific modules (see Architecture below)
    ├── pages/           # Route-level page components
    ├── hooks/           # Shared custom React hooks
    ├── services/        # Shared API communication layer
    ├── store/           # Global Zustand stores
    ├── router/          # Route definitions and navigation config
    ├── lib/             # Third-party client setup (query client, utils)
    ├── utils/           # Pure helper functions
    ├── types/           # Shared TypeScript types and interfaces
    └── styles/          # Global styles and Tailwind entry points
```

### Feature folder structure

Each feature under `src/features/` follows the same pattern:

```
features/<feature-name>/
├── components/    # UI components used only in this feature
├── hooks/         # Hooks specific to this feature
├── services/      # API calls for this feature
└── types/         # Types used only in this feature
```

---

## Frontend Architecture

We use **feature-based architecture**. Each major area of the product owns its own code.

| Feature | Responsibility |
| ------- | -------------- |
| `dashboard` | Overview of active workflows and key metrics |
| `patients` | Patient lists, profiles, and detail views |
| `workflow` | Workflow timelines, tasks, and bottlenecks |
| `ai` | AI summaries and insight panels |
| `analytics` | Charts, trends, and reporting views |
| `notifications` | Alerts and notification center |

### Key rule

**Feature-specific code stays inside its feature folder.**

- `PatientCard` → `features/patients/components/`
- `WorkflowTimeline` → `features/workflow/components/`
- `Button`, `Card`, `Sidebar` → `components/ui/` or `components/layout/`

Only put components in the global `components/` folder when they are reused across multiple features.

---

## Component Guidelines

- **Keep components small** — one component, one responsibility.
- **Compose, don't inflate** — build complex UIs from smaller pieces.
- **Name clearly** — `PatientCard`, `PatientTimeline`, `TaskList`, `NotificationCard`.
- **Avoid giant files** — aim for under ~200 lines per component when possible.

```tsx
// Good: focused, reusable
<PatientCard patient={patient} />
<PatientTimeline events={events} />

// Avoid: one component doing everything
<PatientDashboardWithEverything />
```

---

## State Management

Use the right tool for the job:

### Local state (`useState`, `useReducer`)

For UI-only state that lives in one component — toggles, form inputs, open/closed modals.

```tsx
const [isOpen, setIsOpen] = useState(false);
```

### Zustand (`store/`)

For global client state shared across the app — sidebar visibility, active filters, user preferences.

```tsx
const { sidebarOpen, toggleSidebar } = useAppStore();
```

### TanStack Query (`services/` + feature hooks)

For server data — patient lists, workflow status, AI summaries. Handles loading, caching, and refetching.

```tsx
const { data, isLoading } = usePatients();
```

**Rule of thumb:** if it comes from an API, use TanStack Query. If it's UI state, keep it local or use Zustand.

---

## Styling Guidelines

- Use **TailwindCSS** utility classes for layout, spacing, and typography.
- Use **shadcn/ui** components whenever possible — don't reinvent buttons, dialogs, or forms.
- Keep spacing consistent (stick to Tailwind's scale: `p-4`, `gap-6`, `space-y-4`).
- Avoid inline `style={{ }}` — use Tailwind classes or CSS variables instead.
- Global styles and Tailwind config live in `styles/`.

---

## Animations

Use **Framer Motion** only when animation improves UX — page transitions, list reveals, panel slides.

- Prefer subtle motion (short duration, ease-out).
- Avoid animating everything — too much motion is distracting in a clinical workflow tool.
- Respect `prefers-reduced-motion` for accessibility.

---

## Development Workflow

Follow this order when building a new feature:

1. **Create the feature folder** under `src/features/<name>/`
2. **Build reusable components** inside `components/`
3. **Connect mock data** locally while designing the UI
4. **Connect backend APIs later** through `services/` (APIs will be provided separately)
5. **Test** in the browser — check responsive layout and basic interactions
6. **Commit** with a clear message

---

## Git Workflow

Create a branch per feature or fix:

```bash
git checkout -b feature/dashboard
# ... make your changes ...
git add .
git commit -m "Create patient dashboard layout"
git push -u origin feature/dashboard
```

Open a pull request when ready for review. Keep commits focused and messages descriptive.

---

## Coding Standards

- **TypeScript everywhere** — no `.js` or `.jsx` files in `src/`.
- **Reusable components** — extract repeated UI into shared or feature components.
- **Meaningful naming** — files and variables should describe what they do.
- **No duplicate code** — if you copy-paste twice, extract a component or hook.
- **Keep components small** — under ~200 lines when possible.
- **Import from `@/`** — use path aliases instead of deep relative paths (`@/components/ui/button`).

---

## Current Frontend Scope

The frontend team should focus on:

- Dashboard
- Patient pages
- Workflow timeline
- AI panels
- Analytics
- Notifications
- Responsive layout

**Do not build backend functionality.** Backend APIs will be provided separately.

---

## Future Integration

The backend will expose REST APIs. The frontend consumes them through the **services layer**.

```
Component → Hook → Service → API
```

- Put API calls in `services/` (global) or `features/<name>/services/` (feature-specific).
- **Never call `fetch()` directly inside components.**

Example pattern:

```tsx
// features/patients/services/patientService.ts
export async function getPatients() {
  return api.get("/patients");
}

// features/patients/hooks/usePatients.ts
export function usePatients() {
  return useQuery({ queryKey: ["patients"], queryFn: getPatients });
}

// features/patients/components/PatientList.tsx
const { data } = usePatients();
```

---

## AI Development Prompt

Copy this prompt when using Cursor, Claude, or Figma Make to generate frontend code:

---

You are helping build the frontend for Pulse.

Only generate frontend code.

Use React + TypeScript + TailwindCSS + shadcn/ui.

Follow the existing folder structure.

Keep components modular.

Reuse components whenever possible.

Do not generate backend code.

Do not generate mock APIs.

Use feature-based architecture.

Every page should feel like a modern SaaS product similar to Linear, Vercel, or Stripe.

Use beautiful spacing, accessibility, responsive layouts, and subtle animations.

Always prefer composition over large monolithic components.

---

## Questions?

See [Architecture](./ARCHITECTURE.md), [Contributing](./CONTRIBUTING.md), and the other docs in this folder, or ask the team in your onboarding channel.
