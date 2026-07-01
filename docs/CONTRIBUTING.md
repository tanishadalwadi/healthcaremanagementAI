# Contributing to Pulse

Thank you for joining the Pulse project. This guide helps you get set up and start contributing quickly.

## Repository

```bash
git clone https://github.com/tanishadalwadi/healthcaremanagementAI.git
cd healthcaremanagementAI
```

## Who Works on What

| Area | Folder | Guide |
| ---- | ------ | ----- |
| Frontend UI | `frontend/` | [FEReadme.md](./FEReadme.md) |
| Backend API | `backend/` | Coming soon |
| Shared types | `shared/` | Coordinate with both teams |

**Frontend developers:** read [FEReadme.md](./FEReadme.md) before writing code.

**Backend developers:** work in `backend/` — do not modify frontend unless coordinating on shared types.

## Branch Naming

Use descriptive branch names:

```
feature/dashboard-layout
feature/patient-list
fix/sidebar-responsive
docs/api-reference
```

## Workflow

1. Pull the latest `main`
2. Create a branch from `main`
3. Make focused changes in the right package (`frontend/`, `backend/`, or `shared/`)
4. Test locally
5. Commit with a clear message
6. Open a pull request

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# ... make changes ...

git add .
git commit -m "Add patient dashboard layout"
git push -u origin feature/your-feature-name
```

## Commit Messages

Write short, descriptive messages in the imperative mood:

- `Add patient card component`
- `Scaffold workflow feature folder`
- `Fix mobile sidebar toggle`

## Code Standards

- **TypeScript everywhere** in `frontend/`, `backend/`, and `shared/`
- **Feature-based architecture** on the frontend — see [FEReadme.md](./FEReadme.md)
- **Small, focused components** — one responsibility per file
- **No duplicate code** — extract shared logic into hooks, utils, or `shared/`
- **No secrets in git** — use `.env` files (already gitignored)

## Pull Requests

- Keep PRs small and focused on one feature or fix
- Link related issues if applicable
- Add a short description of what changed and why
- Request review from a teammate before merging

## Questions?

Open a GitHub issue or reach out to the team lead. For frontend-specific questions, start with [FEReadme.md](./FEReadme.md).
