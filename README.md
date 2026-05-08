# Minimal EMR Platform

A full-stack electronic medical records demo — Express REST API, Supabase (PostgreSQL) backend, and a modular vanilla-JS frontend.

[![CI](https://github.com/mugalal/minimal-emr-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/mugalal/minimal-emr-demo/actions/workflows/ci.yml)
[![Docker](https://github.com/mugalal/minimal-emr-demo/actions/workflows/cd.yml/badge.svg)](https://github.com/mugalal/minimal-emr-demo/actions/workflows/cd.yml)


---

## Features

- Patient administration — create, search, and update demographics
- Scheduling — create and manage appointments per patient
- Clinical chart — allergies, medications, encounters, labs, and vitals
- Operations view — care team, clinical alerts, and abnormal lab watchlist
- Structured JSON logging (NDJSON in production, colourised in dev)
- Enhanced `/api/health` with uptime, memory, and data-source status
- Production security headers (CSP, HSTS-ready, X-Frame-Options, etc.)
- In-process rate limiting with automatic store pruning
- UUID path-parameter validation on all routes
- Graceful SIGTERM/SIGINT shutdown

---

## Architecture

```
Browser (Vanilla JS SPA)
        │  HTTP
        ▼
Express Server  ──► /api/health, /api/dashboard, /api/patients, …
        │
        ▼
Supabase (PostgreSQL)
```

The frontend is served as static files by the same Express process — no separate web server needed.

---

## Quick Start

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/mugalal/minimal-emr-demo.git
cd minimal-emr-demo
npm ci
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
```

### 3. Run in development

```bash
make dev          # auto-reloads on file changes
# OR
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running with Docker

```bash
# Build the image
make docker-build

# Run with your .env file
make docker-run

# Or use docker compose (recommended for local dev)
make docker-compose-up
```

---

## Testing

```bash
make test
# OR
npm test
```

Tests use Node's built-in test runner — no external test framework needed. The suite covers health checks, UUID validation, unknown route handling, and graceful degradation when Supabase is unconfigured.

---

## CI / CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** | Push / PR to `main` | Installs deps, runs `npm audit`, runs tests, lints Dockerfile |
| **CD** | Push to `main` or version tag | Builds multi-stage Docker image, pushes to `ghcr.io` |

Docker images are tagged as `main`, `sha-<short>`, and `v<semver>` on tagged releases.

---

## Deployment

### Railway (recommended — free tier)

1. Push this repo to GitHub
2. Create a new project at [railway.app](https://railway.app) → "Deploy from GitHub repo"
3. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`
4. Railway uses `railway.toml` to configure the build — deploys automatically on every push to `main`

### Manual (any Linux server)

```bash
# Pull the latest image built by CD
docker pull ghcr.io/mugalal/minimal-emr-demo:main

# Run it
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  --restart unless-stopped \
  ghcr.io/mugalal/minimal-emr-demo:main
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Application health, uptime, memory |
| `GET` | `/api/dashboard` | Aggregated metrics snapshot |
| `GET` | `/api/patients?search=` | List / search patients |
| `POST` | `/api/patients` | Create patient |
| `PATCH` | `/api/patients/:id` | Update patient demographics |
| `GET` | `/api/patients/:id/chart` | Full patient chart |
| `POST` | `/api/patients/:id/appointments` | Book appointment |
| `PATCH` | `/api/appointments/:id` | Update appointment |
| `POST` | `/api/patients/:id/allergies` | Add allergy |
| `PATCH` | `/api/allergies/:id` | Update allergy |
| `POST` | `/api/patients/:id/encounters` | Create encounter |
| `POST` | `/api/patients/:id/medications` | Add medication |
| `PATCH` | `/api/medications/:id` | Update medication |
| `GET` | `/api/doctors` | List doctors |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes* | — | Anon key (read-only workflows) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | — | Service role key (write workflows) |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `PORT` | No | `3000` | HTTP port |
| `CORS_ORIGIN` | No | — | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | No | `120` | Max requests per IP per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds |

*At least one of `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is required.

---

## License

MIT
