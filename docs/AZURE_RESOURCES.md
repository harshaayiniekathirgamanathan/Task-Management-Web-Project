# Provisioned Azure Environment (live)

This records the actual Azure resources provisioned for this project. It is the
companion to [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) (the generic how-to).

> No secrets are stored here. The DB password lives in the App Service settings
> and your local notes; the publish profile and SWA token live in GitHub Actions
> secrets.

## Subscription & region

| Item | Value |
| --- | --- |
| Subscription | Azure for Students |
| Resource group | `task-manager-rg` |
| Region (compute + DB) | `southeastasia` (Singapore) |
| Region (Static Web App) | `eastasia` |

> Note: this subscription enforces an "Allowed resource deployment regions"
> policy limited to: `indonesiacentral`, `uaenorth`, `eastasia`,
> `southeastasia`, `malaysiawest`. Central India is **not** allowed, so Southeast
> Asia (closest permitted region to Sri Lanka) was used.

## Resources

| Resource | Name | URL / Endpoint |
| --- | --- | --- |
| App Service (backend API) | `task-manager-api-cfe737` | https://task-manager-api-cfe737.azurewebsites.net |
| App Service plan | `task-manager-plan` | B1 Linux |
| Static Web App (frontend) | `task-manager-web-cfe737` | https://orange-mushroom-072c7d500.7.azurestaticapps.net |
| PostgreSQL Flexible Server | `task-manager-db-cfe737` | `task-manager-db-cfe737.postgres.database.azure.com:5432` |
| Database | `taskmanager` | Postgres 16, Burstable B1ms |
| Storage account (attachments) | `taskmgrattachcfe737` | `attachments` container, public blob read |

Backend runtime: **Node 22 LTS**, startup `node index.js`, Always On + WebSockets
enabled (for Socket.IO). DB admin user: `tmadmin`.

## CI/CD wiring (GitHub: praveen-madawalage/Task-Management-Web-Project)

| Secret / Variable | Type | Consumed by |
| --- | --- | --- |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | secret | `deploy-backend.yml` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | secret | `deploy-frontend.yml` |
| `VITE_API_URL` | variable | `deploy-frontend.yml`, `ci.yml` |

`VITE_API_URL` = `https://task-manager-api-cfe737.azurewebsites.net`

## Verified working (initial manual deploy)

- Backend `/health` → `200 {"status":"ok"}`
- Backend `/api/auth/login` (bad creds) → `401` (proves App Service → Supabase works)
- Backend `/api/docs/` → `200` (Swagger UI)
- Frontend root + deep-link `/login` → `200` (SPA fallback routing works)
- Backend `CLIENT_URL` set to the SWA URL (CORS)

Going forward, pushes to `main` redeploy automatically via the workflows.

## Deployment gotchas (resolved — keep for reproducibility)

Two things had to be fixed before the pipelines went green on `main`:

1. **Node 22 in CI.** `@supabase/supabase-js` requires native WebSocket and
   throws "Node.js 20 detected without native WebSocket support" at
   `createClient()`. The integration test imports the real client at module
   load, so the server test job must run on **Node 22** (which also matches the
   App Service runtime). Workflows pin `node-version: 22`.
2. **SCM basic auth.** The publish-profile deploy failed with "Publish profile
   is invalid" because App Service ships with SCM basic auth **disabled**. It
   was enabled with:
   ```
   az resource update -g task-manager-rg --namespace Microsoft.Web \
     --resource-type basicPublishingCredentialsPolicies --name scm \
     --parent sites/task-manager-api-cfe737 --set properties.allow=true
   ```
   After enabling, the publish profile was re-fetched and the
   `AZURE_WEBAPP_PUBLISH_PROFILE` secret updated.

Also: the backend deploy job installs full deps, runs tests, then
`npm prune --omit=dev` so the test gate works while the deployed package stays
production-only.

## Database status & migration note

The `taskmanager` database was **migrated from Supabase** (Phase 2) and the
application code has now been **cut over off Supabase (Phase 5 done)**:

- Data access uses `pg` (node-postgres) via `server/utils/db.js` — the
  `@supabase/supabase-js` dependency and `utils/supabase.js` are removed.
- Attachments upload to **Azure Blob Storage** (`@azure/storage-blob`,
  `taskmgrattachcfe737`/`attachments`) instead of Supabase Storage.
- App Service settings: `DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`,
  `AZURE_STORAGE_ATTACHMENTS_CONTAINER` added; `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` removed.

CI now runs the integration test suite against an ephemeral `postgres:16`
service container (schema loaded from `db/schema.sql` + the refresh-tokens
migration), so the SQL data layer is exercised on every push.

Local development: your network blocks outbound 5432 to Azure, so `server/.env`
points `DATABASE_URL` at a local Postgres (`brew services start postgresql@16`,
`createdb taskmanager`, load `db/schema.sql` + the migration).

How the migration was run: the local machine could not reach port 5432 (ISP
blocks outbound Postgres — both Supabase and Azure timed out identically), and
Azure Cloud Shell now blocks `sudo` and ships only PG16 (too old to dump from
Supabase's PG17.6). It was done from a throwaway **Azure Container Instance**
(`postgres:17` image) in `southeastasia`, which reaches Supabase over the
internet and the Azure DB via the "Allow Azure services" firewall rule. The
container was deleted afterward.
