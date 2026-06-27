# Deploying to Azure & Migrating off Supabase

This guide takes the Task Management Web App from its current setup
(**React/Vite frontend + Express backend + Supabase Postgres/Storage**) to a
fully Azure-hosted deployment with automated CI/CD via GitHub Actions.

## Target architecture

| Component        | Today (Supabase)                     | Target (Azure)                                  |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| Frontend (SPA)   | Run locally / static host            | **Azure Static Web Apps**                       |
| Backend (API)    | Run locally                          | **Azure App Service (Linux, Node 20)**          |
| Database         | Supabase Postgres (via Supabase SDK) | **Azure Database for PostgreSQL – Flexible Server** |
| File attachments | Supabase Storage                     | **Azure Blob Storage**                          |
| Email            | SMTP (Gmail)                         | SMTP or Azure Communication Services Email      |

### Important architectural note

The backend does **not** talk to Postgres with raw SQL. It uses
`@supabase/supabase-js` (`supabase.from('table')…`, 65 call sites) which is the
Supabase **PostgREST data API**, plus `supabase.storage` for attachments.

Azure Database for PostgreSQL gives you the Postgres **engine only** — there is
no PostgREST and no storage. So a complete move off Supabase happens in two
parts:

1. **Infrastructure + data** (Phases 1–4): stand up Azure, host the app, copy
   the schema and data into Azure Postgres. The app keeps running against
   Supabase until you flip over.
2. **Code cutover** (Phase 5): replace the Supabase SDK with `node-postgres`
   (`pg`) and move attachments to Azure Blob Storage. This is an application
   change and is intentionally scoped as a follow-up — the CI/CD added in this
   branch supports both states.

---

## Prerequisites

- An Azure subscription (the [Azure for Students](https://azure.microsoft.com/free/students/)
  plan gives free credit and is enough for this project).
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) installed
  and logged in: `az login`.
- Admin access to the GitHub repo (to add secrets/variables).
- The `psql` and `pg_dump` Postgres client tools (`brew install libpq` on macOS).

Set some shell variables you'll reuse:

```bash
RG=task-manager-rg
LOCATION=australiaeast            # pick the region closest to you
APP_NAME=task-manager-api         # must match AZURE_WEBAPP_NAME in deploy-backend.yml
PG_SERVER=task-manager-db         # globally-unique
PG_ADMIN=tmadmin
PG_PASSWORD='<a-strong-password>'

az group create --name $RG --location $LOCATION
```

---

## Phase 1 — Provision Azure Database for PostgreSQL

```bash
az postgres flexible-server create \
  --resource-group $RG \
  --name $PG_SERVER \
  --location $LOCATION \
  --admin-user $PG_ADMIN \
  --admin-password "$PG_PASSWORD" \
  --tier Burstable --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0   # placeholder; we add real rules below

# Create the application database
az postgres flexible-server db create \
  --resource-group $RG --server-name $PG_SERVER --database-name taskmanager

# Allow your current machine + Azure services to connect
az postgres flexible-server firewall-rule create \
  --resource-group $RG --name $PG_SERVER \
  --rule-name allow-my-ip \
  --start-ip-address "$(curl -s ifconfig.me)" \
  --end-ip-address "$(curl -s ifconfig.me)"

az postgres flexible-server firewall-rule create \
  --resource-group $RG --name $PG_SERVER \
  --rule-name allow-azure-services \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
```

Your connection string will be:

```
postgres://$PG_ADMIN:$PG_PASSWORD@$PG_SERVER.postgres.database.azure.com:5432/taskmanager?sslmode=require
```

---

## Phase 2 — Migrate the schema and data from Supabase

1. **Get the Supabase direct connection string.** In the Supabase dashboard:
   *Project Settings → Database → Connection string → URI*. Use the **direct**
   (port 5432) string, not the pooler.

2. **Dump schema + data from Supabase** (public schema only — skip Supabase's
   internal `auth`, `storage`, etc.):

   ```bash
   pg_dump "<SUPABASE_DIRECT_URL>" \
     --schema=public --no-owner --no-privileges \
     --file=supabase_dump.sql
   ```

3. **Restore into Azure Postgres:**

   ```bash
   psql "postgres://$PG_ADMIN:$PG_PASSWORD@$PG_SERVER.postgres.database.azure.com:5432/taskmanager?sslmode=require" \
     -f supabase_dump.sql
   ```

4. **Apply repo migrations** (these are the source of truth going forward — see
   `server/db/schema.sql` and `server/supabase/migrations/`). Verify the dumped
   schema matches; apply any migrations not yet present.

5. **Validate**: connect with `psql` and spot-check row counts against Supabase
   (`SELECT count(*) FROM tasks;`, etc.).

> Tip: `pg_dump` from Supabase can include `gen_random_uuid()` / `pgcrypto`
> usage. Azure Postgres supports these; if a restore errors on a missing
> extension, run `CREATE EXTENSION IF NOT EXISTS pgcrypto;` first.

---

## Phase 3 — Deploy the backend to Azure App Service

```bash
# App Service plan (Linux). B1 is the cheapest "always-on capable" tier and is
# recommended because the app runs node-cron deadline reminders + WebSockets.
az appservice plan create \
  --resource-group $RG --name task-manager-plan \
  --is-linux --sku B1

az webapp create \
  --resource-group $RG --plan task-manager-plan \
  --name $APP_NAME --runtime "NODE:20-lts"

# The repo has no root package.json; the API lives in server/.
# Tell App Service to start it from there.
az webapp config set --resource-group $RG --name $APP_NAME \
  --startup-file "node index.js" \
  --always-on true \
  --web-sockets-enabled true
```

### Configure backend environment variables (App Service application settings)

These replace the server's `.env` in production — see `server/.env.example`.

```bash
az webapp config appsettings set --resource-group $RG --name $APP_NAME --settings \
  NODE_ENV=production \
  CLIENT_URL="https://<your-swa-name>.azurestaticapps.net" \
  SUPABASE_URL="<supabase-url>" \
  SUPABASE_SERVICE_ROLE_KEY="<supabase-service-role-key>" \
  JWT_SECRET="<long-random>" \
  JWT_REFRESH_SECRET="<different-long-random>" \
  LOGIN_RATE_LIMIT_MAX=30 \
  SMTP_HOST="<smtp-host>" SMTP_PORT=587 \
  SMTP_USER="<smtp-user>" SMTP_PASS="<smtp-pass>" \
  MAIL_FROM="Task Manager <no-reply@example.com>"
```

> Keep `SUPABASE_*` set until Phase 5 is complete. Add `DATABASE_URL` here once
> the code uses `pg` instead.

### Wire up CI/CD for the backend

1. Download the publish profile:

   ```bash
   az webapp deployment list-publishing-profiles \
     --resource-group $RG --name $APP_NAME --xml > publish-profile.xml
   ```

2. In GitHub: **Settings → Secrets and variables → Actions → New repository
   secret** → name it `AZURE_WEBAPP_PUBLISH_PROFILE`, paste the file contents.
3. Confirm `AZURE_WEBAPP_NAME` in `.github/workflows/deploy-backend.yml` matches
   `$APP_NAME`.
4. Push to `main` (or run the workflow manually) — the
   **Deploy Backend** workflow builds, tests, and deploys.

Verify: `https://<app-name>.azurewebsites.net/health` returns `{"status":"ok"}`.

---

## Phase 4 — Deploy the frontend to Azure Static Web Apps

```bash
az staticwebapp create \
  --resource-group $RG --name task-manager-web \
  --location $LOCATION --sku Free
```

1. **Deployment token:** in the Azure Portal open the Static Web App →
   *Overview → Manage deployment token*, copy it. In GitHub add a secret named
   `AZURE_STATIC_WEB_APPS_API_TOKEN`.
2. **API URL:** add a GitHub **repository variable** (not secret) named
   `VITE_API_URL` set to your backend URL,
   e.g. `https://task-manager-api.azurewebsites.net`. The build bakes this in.
3. Push to `main` (or run manually) — the **Deploy Frontend** workflow builds
   the Vite app and uploads `client/dist`. PRs get free preview environments;
   closing the PR tears the preview down.

`client/public/staticwebapp.config.json` provides SPA fallback routing so React
Router deep links resolve to `index.html`.

### CORS

Make sure the backend `CLIENT_URL` app setting equals the Static Web App URL,
otherwise the browser blocks API calls (CORS is configured in
`server/index.js`).

---

## Phase 5 — Code cutover: drop the Supabase SDK (follow-up work)

This is the application change that fully removes Supabase. Do it on its own
branch after Phases 1–4 are stable.

1. **Data access:** add `pg`, create a connection pool from `DATABASE_URL`, and
   rewrite the ~65 `supabase.from(...)` calls in `server/services/` and
   `server/controllers/` into parameterised SQL. Going service-by-service keeps
   it reviewable. `server/utils/supabase.js` is the single import point to
   replace.
2. **Attachments:** replace `supabase.storage` in
   `server/services/attachmentService.js` with the
   [`@azure/storage-blob`](https://learn.microsoft.com/azure/storage/blobs/storage-quickstart-blobs-nodejs)
   SDK against an Azure Blob container. Migrate existing files by copying them
   from the Supabase bucket into Blob Storage.
3. **Switch settings:** add `DATABASE_URL` + the Blob connection string to App
   Service settings; remove `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
4. **Decommission Supabase** once everything is verified in production.

The CI/CD pipelines need no changes for this — they already build/test/deploy
the same workspaces.

---

## GitHub secrets & variables — summary

| Name                              | Type     | Used by              | Value                                         |
| --------------------------------- | -------- | -------------------- | --------------------------------------------- |
| `AZURE_WEBAPP_PUBLISH_PROFILE`    | Secret   | deploy-backend.yml   | Publish profile XML from App Service          |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Secret   | deploy-frontend.yml  | Static Web App deployment token               |
| `VITE_API_URL`                    | Variable | both deploy + ci.yml | Backend URL, e.g. `https://…azurewebsites.net`|

---

## Pipeline reference

- **`.github/workflows/ci.yml`** — on every PR/push to `main`: server tests +
  client lint & build. The required quality gate.
- **`.github/workflows/deploy-backend.yml`** — on push to `main` touching
  `server/**` (or manual): test + deploy API to App Service.
- **`.github/workflows/deploy-frontend.yml`** — on push to `main` touching
  `client/**` (or manual/PR): build + deploy SPA to Static Web Apps, with PR
  preview environments.

## Recommended rollout order

1. Merge this branch → CI starts running on PRs immediately (no Azure needed).
2. Phase 1–2: stand up Azure Postgres and migrate data.
3. Phase 3: deploy backend, add backend secret.
4. Phase 4: deploy frontend, add SWA token + `VITE_API_URL`, fix CORS.
5. Phase 5 (separate branch): code cutover off Supabase, then decommission it.
