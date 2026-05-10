# Writedown

Writedown is a small full-stack notes application: sign up, edit rich documents in the browser, and share them with invite links backed by a token-safe lookup hash. The UI is a single-page app; the API is a JSON REST service with cookie-based sessions after login.

## Architecture

| Layer | Role |
|--------|------|
| **Frontend** | React SPA: document list, editor (TipTap), auth, and sharing flows. Talks to the API over HTTP with credentials where needed. |
| **Backend** | Express HTTP server: `/auth` (register, login, logout, session), `/documents` (CRUD and share/redeem). Validates input with Zod, persists with Prisma. |
| **Database** | PostgreSQL stores users, documents (JSON content), and optional per-document share metadata. |

Health checks: `GET /health`, `GET /health/db` (DB connectivity).

## Technology stack

### Frontend (`frontend/`)

- **React 19** and **React Router 7**
- **Vite 8** and **TypeScript**
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **TanStack Query** for server state
- **TipTap** (ProseMirror-based rich text)

### Backend (`backend/`)

- **Node.js** (see Dockerfiles: **22**)
- **Express 4**
- **TypeScript** (compiled to `dist/`)
- **Prisma 6** as ORM and migration tool
- **PostgreSQL** (driver via Prisma)
- **JWT** + **cookie-parser** for sessions, **bcryptjs** for passwords, **Zod** for request validation, **CORS** for the SPA origin

### Database

- **PostgreSQL 16** (Alpine image in Docker Compose)

### Containers

- **Docker Compose** runs **Postgres**, the **backend** (build runs migrations on start), and the **frontend** dev server with the repo mounted for live reload.

## Prerequisites

Use either path below.

**Option A — Docker (recommended)**

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2

**Option B — Local Node + Postgres**

- **Node.js 22+** and npm
- **PostgreSQL 16** (or compatible) running locally or in a container

## Quick start with Docker Compose

These steps boot the database, apply migrations, start the API on port **3000**, and the Vite dev server on **5173**.

1. **Clone the repository** (if you have not already).

   ```bash
   git clone <your-repo-url> writedown
   cd writedown
   ```

2. **Create environment file** at the repo root from the example. Compose and the backend read `.env` from this directory.

   ```bash
   cp .env.example .env
   ```

   Edit `.env` if you want different Postgres credentials or a different host port. For Compose, keep `DATABASE_URL` using the **`db`** hostname (the Postgres service name), as in the example:

   `postgresql://user:password@db:5432/dbname`

   Set **`JWT_SECRET`** to a long random string for anything beyond local play. **`CORS_ORIGIN`** should match where you open the SPA (default `http://localhost:5173`).

3. **Start the stack**

   ```bash
   docker compose up --build
   ```

   Wait until Postgres is healthy; the backend entrypoint runs `prisma migrate deploy` before starting the server.

4. **Open the app** at [http://localhost:5173](http://localhost:5173). The API is at [http://localhost:3000](http://localhost:3000) (`/` returns plain `ok`).

5. **Stop** with `Ctrl+C` or:

   ```bash
   docker compose down
   ```

   Add `-v` to remove the named Postgres volume if you want a clean database next time.

## Local development without Compose (optional)

Use this when you prefer to run Postgres in Docker but run Node on your machine, or you already have Postgres installed.

### 1. PostgreSQL

- Start Postgres and create a database (for example matching `POSTGRES_DB` in `.env.example`).
- Note host, port, user, password, and database name for `DATABASE_URL`.

### 2. Backend

```bash
cd backend
npm ci
```

At the **repository root**, copy `.env.example` to `.env` and set:

- **`DATABASE_URL`** → use **`localhost`** (or `127.0.0.1`) as the host, not `db`, for example:

  `postgresql://user:password@localhost:5432/dbname`

- **`JWT_SECRET`**, **`CORS_ORIGIN`** (e.g. `http://localhost:5173`), **`PORT`** (default `3000`).

Apply migrations and generate the Prisma client:

```bash
cd backend
npx prisma migrate dev
```

Build and run:

```bash
npm run build
npm start
```

The server listens on `0.0.0.0` and the port from `PORT`. There is no `npm run dev` script today; after code changes, run `npm run build` again or use your own watch workflow.

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev
```

By default the client calls **`http://localhost:3000`**. To point at another API base URL, set in `frontend/.env` (or `.env.local`):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

(Restart Vite after changing env files.)

## Useful commands

| Command | Where | Purpose |
|---------|--------|---------|
| `npm run dev` | `frontend/` | Vite dev server |
| `npm run build` | `frontend/` | Production build |
| `npm run build` | `backend/` | `prisma generate` + TypeScript compile |
| `npm start` | `backend/` | Run compiled server |
| `npx prisma migrate dev` | `backend/` | Create/apply migrations in development |
| `npx prisma migrate deploy` | `backend/` | Apply migrations (used in Docker entrypoint) |

## Project layout

```
writedown/
├── backend/           # Express API, Prisma schema & migrations
├── frontend/          # Vite + React SPA
├── docker-compose.yml # Postgres + backend + frontend
└── .env.example       # Template for root `.env` (not committed)
```

## Security notes for production

- Replace **`JWT_SECRET`** with a strong secret and keep **`.env`** out of version control.
- Tighten **CORS** to your real frontend origin.
- Run the backend behind HTTPS and set cookie/security flags appropriate for your deployment.
- Use managed Postgres or hardened database credentials and networking.

## Current features

- **Authentication** — Email and password **sign up** and **sign in**; **sign out** clears session and share-access cookies. Sessions use a JWT stored in an HTTP-only cookie; the app checks `/auth/me` for the current user.
- **Documents** — **Create** notes, **list** them (active set ordered by last update), **open** one in the editor, and **rename** from the sidebar. Document body is stored as TipTap JSON.
- **Rich-text editor** — **TipTap** with **StarterKit** (bold, headings, lists, etc.) and a **`/` slash command** menu for headings, paragraph, bullet list, and numbered list. **Debounced autosave** persists title and content to the API.
- **Trash** — **Soft-delete** owned documents, view them under **trash**, and **restore** them. Deletes and restores apply to your own documents only.
- **Sharing** — Document owners can **create a share code** (rotating any previous link), **copy** it from the invite UI, and **revoke** sharing. Signed-in recipients **redeem a code** (with **rate limiting** on failed attempts); after redeem they get a share-access cookie and can **open the shared document**. While sharing is active, invitees can **view and edit** the same document (not owner-only read-only).
- **App shell** — **React Router** with a **protected** main workspace; **TanStack Query** for server state; header shows the signed-in email and sign out; layout supports **light/dark** styling via Tailwind.
