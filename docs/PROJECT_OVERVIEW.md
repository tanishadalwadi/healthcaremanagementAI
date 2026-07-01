# Project Overview

## What is Pulse?

Pulse is an AI-powered Healthcare Workflow Coordinator. It helps nurses and healthcare staff:

- Monitor patient workflows in real time
- Identify bottlenecks before they become problems
- Receive AI-powered summaries of patient progress

## Repository

**GitHub:** [github.com/tanishadalwadi/healthcaremanagementAI](https://github.com/tanishadalwadi/healthcaremanagementAI)

## Monorepo Packages

| Package | Purpose |
| ------- | ------- |
| `frontend/` | Web application for nurses and staff |
| `backend/` | REST API, database, and AI services |
| `shared/` | Types and schemas used by both frontend and backend |
| `docs/` | Project documentation |

## Current Phase

The project is in **scaffold phase**:

- Folder structure and configuration are set up
- Frontend development is the primary focus
- Backend APIs will be integrated as they become available

## Team Roles

### Frontend Team

Builds the user interface — dashboard, patient pages, workflow timelines, AI panels, analytics, and notifications.

**Start here:** [FEReadme.md](./FEReadme.md)

### Backend Team

Builds APIs, database models, and AI integrations. Works in `backend/` and `shared/`.

**Start here:** `backend/` (detailed backend guide coming soon)

## Key Features (Planned)

1. **Dashboard** — overview of active workflows and metrics
2. **Patients** — patient lists and detail views
3. **Workflow** — timelines, tasks, and bottleneck detection
4. **AI** — summaries and clinical insight panels
5. **Analytics** — trends and reporting
6. **Notifications** — alerts for staff

## Design Direction

The UI should feel like a modern SaaS product — clean, accessible, and responsive. Think Linear, Vercel, or Stripe in terms of polish and spacing.

## Next Steps

1. Clone the repo and read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Frontend devs: follow [FEReadme.md](./FEReadme.md)
3. Pick a feature branch and start building
