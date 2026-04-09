# FloodWatch API

NestJS + TypeScript backend for the FloodWatch flood early warning system.

## Stack

| Concern | Technology |
|---|---|
| Framework | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Queue / Workers | Bull + Redis |
| Auth | JWT (`@nestjs/jwt`) |
| Validation | class-validator + class-transformer |
| Rate limiting | `@nestjs/throttler` |
| Scheduling | `@nestjs/schedule` |
| API docs | `@nestjs/swagger` (Swagger UI) |

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── main.ts                # API bootstrap
│   ├── worker.ts              # Worker process bootstrap
│   ├── nepal-sync.ts          # Nepal sync process bootstrap
│   ├── app.module.ts          # Root application module
│   ├── worker.module.ts       # Root worker module
│   │
│   ├── prisma/                # Global PrismaService
│   ├── auth/                  # JWT guard, roles guard, decorators
│   ├── users/                 # User registration
│   ├── stations/              # Station CRUD
│   ├── rainfall/              # Rainfall reading ingestion
│   ├── river-level/           # River level reading ingestion
│   ├── alerts/                # Alert management
│   ├── subscriptions/         # Alert subscriptions
│   ├── predict/               # Flood risk prediction endpoint
│   ├── admin/                 # Admin: data management + sync status
│   ├── public/                # Public map data (no auth)
│   ├── processing/            # EngineService: risk scoring logic
│   ├── workers/               # Bull processor + interval schedulers
│   └── nepal-sync/            # DHM data sync + Open-Meteo cross-validation
├── .env.example
├── nest-cli.json
└── tsconfig.json
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, REDIS_URL, JWT_SECRET
```

### 3. Run database migrations

```bash
npx prisma migrate dev
# or push schema without migration history:
npx prisma db push
```

### 4. Start development servers

```bash
# API server (port 8000)
npm run start:dev

# Background worker (Bull queue + schedulers) — separate terminal
npm run worker:dev

# Nepal DHM sync daemon — separate terminal
npm run nepal-sync:dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | API server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled API (`dist/main.js`) |
| `npm run worker:dev` | Worker process with ts-node |
| `npm run worker` | Run compiled worker (`dist/worker.js`) |
| `npm run nepal-sync:dev` | Nepal sync process with ts-node |
| `npm run nepal-sync` | Run compiled sync (`dist/nepal-sync.js`) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:push` | Push schema without migration |
| `npm run db:studio` | Open Prisma Studio |

## API Endpoints

All routes are prefixed with `/v1`. The health check is at `/health` (no prefix).

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/login` | — | Login, returns JWT |
| `POST` | `/v1/users` | — | Register new user |

### Stations
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/v1/stations` | any | List all stations |
| `GET` | `/v1/stations/:id` | any | Station detail |
| `POST` | `/v1/stations` | admin/operator | Create station |

### Sensor Data
| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/rainfall` | Submit rainfall reading |
| `GET` | `/v1/rainfall` | Query rainfall (filters: `station_id`, `from`, `to`, `limit`) |
| `POST` | `/v1/river-level` | Submit river level reading |
| `GET` | `/v1/river-level` | Query river levels (filters: `station_id`, `limit`) |

### Alerts & Subscriptions
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/v1/alerts` | any | List alerts (filters: `station_id`, `severity`, `from_date`, `to_date`, `page`, `page_size`) |
| `POST` | `/v1/alerts` | admin/operator | Create manual alert |
| `GET` | `/v1/subscriptions` | any | List subscriptions |
| `POST` | `/v1/subscriptions` | any | Create subscription |

### Prediction & Admin
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/v1/predict/:station_id` | any | Run flood risk prediction |
| `GET` | `/v1/admin/rainfall` | any | Admin: rainfall readings |
| `PATCH` | `/v1/admin/rainfall/:id` | admin/operator | Update reading |
| `DELETE` | `/v1/admin/rainfall/:id` | admin | Delete reading |
| `GET` | `/v1/admin/river-levels` | any | Admin: river level readings |
| `PATCH` | `/v1/admin/river-levels/:id` | admin/operator | Update reading |
| `DELETE` | `/v1/admin/river-levels/:id` | admin | Delete reading |
| `GET` | `/v1/admin/sync-status` | any | Station sync health |

### Public (no auth)
| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/public/map-data` | All active stations with latest readings and risk level |
| `GET` | `/health` | Health check |

## Swagger Docs

Interactive API docs available at `http://localhost:8000/docs` when running in dev.

## Authentication

All endpoints except `POST /v1/auth/login`, `POST /v1/users`, `GET /v1/public/map-data`, and `GET /health` require a Bearer token:

```
Authorization: Bearer <jwt>
```

Tokens are returned by `/v1/auth/login` and `/v1/users`.

### Roles

| Role | Permissions |
|---|---|
| `viewer` | Read-only access |
| `operator` | Create stations, submit data, create alerts, patch readings |
| `admin` | All operator permissions + delete readings |

## Risk Levels

The prediction engine (`EngineService`) computes risk over a configurable time window (default 6 hours):

| Level | 6h Rainfall | River Level | Recommended Action |
|---|---|---|---|
| `NORMAL` | < 30 mm | < 2.5 m | No action required |
| `WATCH` | 30–50 mm | 2.5–3.5 m | Monitor closely |
| `WARNING` | 50–80 mm | 3.5–4.5 m | Issue advisory, prepare teams |
| `CRITICAL` | > 80 mm | > 4.5 m | Immediate evacuation advisory |

Thresholds are per-station and stored in `StationThreshold`. The defaults above are used as fallback.

## Background Workers

The worker process (`npm run worker`) runs two jobs:

- **PredictionProcessor** — Bull queue processor. Triggered whenever a sensor reading is submitted. Runs the prediction engine and creates a deduped alert if risk is elevated.
- **WorkersScheduler** — Two `@Interval` tasks:
  - Every 15 min: enqueue a prediction job for every active station.
  - Every 30 min: mark stations `OFFLINE` if no reading in the last 2 hours.

## Nepal DHM Sync

The sync process (`npm run nepal-sync`) fetches real river levels from Nepal's DHM (Department of Hydrology and Meteorology) via a local proxy, cross-validates with Open-Meteo discharge data, and upserts readings into the database. It runs immediately on startup and repeats every 30 minutes.

Requires the DHM proxy running locally:
```bash
# Set in .env:
DHM_PROXY_URL=http://host.docker.internal:9876/dhm-data
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token expiry (default `24h`) |
| `PORT` | No | API port (default `8000`) |
| `FRONTEND_URL` | No | CORS origin (default `*`) |
| `DHM_PROXY_URL` | No | Nepal DHM proxy URL |
| `TWILIO_*` | No | SMS notification credentials |
| `SENDGRID_API_KEY` | No | Email notification credentials |
