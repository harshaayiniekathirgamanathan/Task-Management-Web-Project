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

## Database status & migration note

The Azure Postgres server and `taskmanager` database are provisioned and ready,
but **empty** — the app still uses Supabase (see AZURE_DEPLOYMENT.md Phase 5 for
the eventual code cutover).

When migrating data (Phase 2): connecting to the Azure DB directly from the
local machine failed because the ISP uses **CGNAT** (the IP Azure sees differs
from the IP web-based checkers report), so a local firewall-rule allow on the
detected IP does not match. Run the migration from **Azure Cloud Shell**
instead (it connects over the Azure backbone and is covered by the
"allow Azure services" rule), or add a firewall rule for the actual egress IP.
