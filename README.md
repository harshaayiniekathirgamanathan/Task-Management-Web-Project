# Task-Management-Web-Project

A task management system with projects, tasks, comments, file attachments, labels,
and real-time notifications. **Backend:** Node.js + Express + Supabase (Postgres).
**Frontend:** React + Vite + react-bootstrap.

## Setup

### 1. Backend (`/server`)

```bash
cd server
npm install        # required after pulling — installs deps like multer, node-cron, nodemailer
cp .env.example .env
```

Fill in `server/.env`:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — two long random strings
- `CLIENT_URL` — the frontend URL (e.g. `http://localhost:5173`)
- `NODE_ENV` — `development` locally; set to `production` on the deployed server
  (this also turns on `Secure` / `SameSite=None` on the refresh-token cookie)
- **SMTP** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) — used to
  email new users their temporary password. Without these, the temp password is
  printed to the server console (dev fallback only).

Then:

```bash
npm run dev        # starts the API on http://localhost:8000
npm test           # runs the Jest test suite
```

### 2. Database (Supabase)

- Run `server/db/schema.sql` in the Supabase SQL editor to create the tables/enums.
- Run the migrations in `server/supabase/migrations/` (e.g. the `refresh_tokens` table,
  required for login/logout session handling).
- In **Storage**, create a **public** bucket named **`attachments`** — file uploads
  fail without it.

### 3. Frontend (`/client`)

```bash
cd client
npm install
cp .env.example .env     # set VITE_API_URL to the backend URL
npm run dev              # starts the app on http://localhost:5173
```

## API docs

With the backend running, interactive Swagger docs are at `http://localhost:8000/api/docs`.
