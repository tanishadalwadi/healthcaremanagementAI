# Pulse

AI-powered Healthcare Workflow Coordinator.

Pulse helps nurses and healthcare staff monitor patient workflows, identify bottlenecks, and receive AI-powered summaries of patient progress.

## Quick Start

```bash
git clone https://github.com/tanishadalwadi/healthcaremanagementAI.git
cd healthcaremanagementAI
```

| Role | Start here |
| ---- | ---------- |
| **Frontend developer** | [Frontend Guide](./docs/FEReadme.md) → `cd frontend` |
| **Backend developer** | `backend/` (API scaffold — docs coming soon) |
| **New to the project** | [Project Overview](./docs/PROJECT_OVERVIEW.md) → [Contributing](./docs/CONTRIBUTING.md) |

## Monorepo Structure

| Package | Description |
| ------- | ----------- |
| [`frontend/`](./frontend/) | React + Vite + TypeScript client |
| [`backend/`](./backend/) | Node.js + Fastify + Prisma API server |
| [`shared/`](./shared/) | Common types, schemas, and constants |
| [`docs/`](./docs/) | Architecture, API, and team documentation |

```
healthcaremanagementAI/
├── frontend/     # Client application
├── backend/      # API server
├── shared/       # Shared types and schemas
└── docs/         # Documentation
```

## Tech Stack

**Frontend:** React, Vite, TypeScript, TailwindCSS, shadcn/ui, Zustand, TanStack Query, React Router, Framer Motion

**Backend:** Node.js, TypeScript, Fastify, Prisma, PostgreSQL, OpenAI, Supabase Storage

## Documentation

- [Frontend Guide](./docs/FEReadme.md) — architecture, workflow, and coding standards for FE devs
- [Project Overview](./docs/PROJECT_OVERVIEW.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Database](./docs/DATABASE.md)
- [API](./docs/API.md)
- [Roadmap](./docs/ROADMAP.md)
- [Contributing](./docs/CONTRIBUTING.md)

## Status

This repository is in **scaffold phase** — folder structure and configuration are in place. Implementation is starting with the frontend.

## License

TBD
