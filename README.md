# Eubric AI Sales Roleplay Platform

A production-ready platform for AI-powered sales roleplay training. Trainees practice
live conversations against configurable AI-simulated buyer personas and receive
rubric-based coaching feedback, enabling sales teams to rehearse objection handling,
discovery, and closing technique in a safe, repeatable environment.

## Project Status

**Initialization phase.** This repository currently contains the project scaffolding
only — folder structure, build tooling, and empty service shells. No AI logic, API
routes, prompts, personas, or voice features have been implemented yet. See
`docs/` for the full system architecture.

## Monorepo Structure

```
eubric-ai-sales-roleplay/
├── frontend/     # React + Vite + TypeScript client application
├── backend/      # Node.js + Express + TypeScript API server
├── prompts/      # Versioned persona / system prompt / rubric definitions (data, not code)
├── configs/      # Tenant and environment configuration
├── docs/         # Architecture decisions and documentation
├── .gitignore
├── .env.example
└── README.md
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast dev server, type safety, industry-standard SPA tooling |
| Backend | Node.js + Express + TypeScript | Lightweight, widely supported API framework with strong typing |
| Prompts | Versioned data files (JSON/YAML) | Keeps AI behavior editable without code deploys |

Further technology rationale is documented in `docs/architecture/`.

## Getting Started

### Prerequisites
- Node.js (LTS)
- npm

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs the Vite dev server (default: http://localhost:5173).

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs the Express server in watch mode (default: http://localhost:4000).

### Environment Variables

Copy `.env.example` to `.env` and fill in real values before running services that
require configuration:

```bash
cp .env.example .env
```

## Repository Conventions

- **`prompts/`** holds AI persona, system prompt, and rubric definitions as versioned
  data — never hardcoded into application code.
- **`configs/`** holds tenant-specific and environment configuration, kept separate
  from source code so behavior can change without a deploy.
- **`docs/`** holds architecture documentation and decisions.

## License

Proprietary — internal project.
