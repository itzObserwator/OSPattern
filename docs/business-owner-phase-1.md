# Business owner backend foundation

The separate Connected operations interface was removed following the existing-module integration audit. `/owner` is no longer an application page or navigation destination. The Executive Overview and existing department layouts remain unchanged.

## Retained infrastructure

- `src/lib/owner/contracts.ts`: validated shared data contracts.
- `src/lib/owner/database.ts`, `migrations/001_owner_foundation.sql`: SQLite persistence and versioned migration.
- `src/lib/owner/auth.ts`: password hashing, expiring server sessions and audit writes.
- `src/lib/owner/repository.ts`: organization-scoped queries, role rules, client deduplication, atomic conversion/delivery, onboarding and task updates.
- `src/app/api/owner/route.ts`: authenticated API and same-origin mutation checks.
- `tests/owner-workflow.mjs`: API-level workflow, integrity and authorization regression checks.

No stored database, account, client or business record was deleted. The default database remains `.data/owner.sqlite`; `BUSINESSOS_DATABASE_PATH` can select another persistent file. Node 24+ is required for the built-in SQLite driver. No external service was added.

## Removed interface

The `/owner` page, `OwnerWorkspace` component, dedicated `owner.css`, sidebar entry and app-shell exception were removed. Tests specific to the removed forms were retired; API coverage was retained, including persistence across authenticated clients.

## Existing module integration

The existing department modules still use their browser-local providers. Removing the duplicate interface does not automatically connect them to the retained backend. The next implementation should adapt those existing providers and forms to the repository, preserving current routes and visual composition. Reuse the conversion and delivery services rather than introduce another workflow UI.

See [the existing module integration audit](existing-module-integration-audit.md) for the five workflow findings and minimum integration sequence. Accounting supplements, timesheets, approved-leave delegation and campaign attribution still need the integrations described there. Live email, calendar, social, payments, AI and secure client-portal integrations remain unconnected.

## Verification commands

- `npm test`: existing domain and calculation checks.
- `npm run typecheck` and `npm run build`: source and route validation.
- `node tests/components.mjs`: existing department UI regression checks.
- `BUSINESSOS_OWNER_URL=http://localhost:3003 npm run test:owner`: retained API tests against a separate test database/server. This creates test organizations; use an isolated database.

After building, an isolated API test server can be started with:

```sh
BUSINESSOS_DATABASE_PATH=/private/tmp/techgy-owner-test/owner.sqlite node node_modules/next/dist/bin/next start -p 3003
```

The normal app remains available at http://localhost:3002/ .
