# Techgy Link / OSPattern

Business Owner / CEO demonstration built with Next.js App Router, TypeScript, React, Brutel, Tailwind, Motion, Recharts and TanStack Table. The existing ClauseOS / Quarn inspired royal-blue, light-mode interface and module routes are preserved.

```sh
npm ci
npm run dev
```

Open http://localhost:3002. This independent app lives in `Vectramind/businessos`; the parent marketing site is separate. The uploaded Techgy mark is `public/techgy-link-logo.png`.

## Executive information architecture

The default overview puts primary financial/delivery metrics and Needs Your Attention first. Existing financial momentum and project-health charts follow. Connected folders, priority tasks, a compact workforce summary, executive calendar, device activity, expandable departmental briefing, and rule-based insights remain individually configurable. Supporting reports expand on demand; detailed Finance, Projects, People, CRM and Marketing reports use the existing routes. `/projects/[id]` adds project performance drill-downs without replacing the Projects collection.

The prior illustrative ribbon has been changed to an actual six-month cash receipt / outflow band. Financial momentum defaults to Recorded data; its optional reference profile remains explicitly illustrative.

## Data and calculations

Read [the explicit record map](docs/executive-data-map.md) before integrating another data source. `src/lib/demo-service.ts` remains the initial record adapter; `src/lib/models.ts` retains existing record types and adds optional stable-ID relationships. No records are duplicated or migrated destructively.

`src/lib/executive.ts` centralizes runtime validation and calculations:

- Cash inflow/outflow: Paid legacy invoice/expense records only. Net cash = receipts minus payments.
- Accrual operating profit: earned ledger revenue minus incurred ledger expenses. Margin requires positive earned revenue.
- Issued invoice balances: issued value minus allocated payments through the selected period end. Invoice issuance is never added to cash collections. Aging buckets use the same snapshot date.
- Approved budget utilization: incurred spending divided by a positive budget covering exactly the reporting period. An organization-wide budget supersedes its project budgets to avoid double counting.
- Break-even: classified fixed costs / (1 − variable costs / earned revenue); unavailable without complete cost classification and a positive contribution ratio.
- Project profit: linked recognized revenue minus direct and allocated indirect expenses. Unallocated expenses prevent a profitability estimate. Recorded project amount is not treated as budget.
- Project health: completed state, overdue open work/project deadline, blockers, recorded risk and configurable near-deadline progress rules.
- Workforce utilization: estimated remaining weekly task hours / available weekly capacity. Directory status is never treated as attendance.
- Sales conversion: won leads / leads acquired in the same period; stage history is evaluated at period end. Stage-to-stage rates require historical stage events.
- Marketing CPL and ROAS use explicit campaign relationships. ROAS divides attributed earned revenue by paid campaign expenses categorized Advertising. Missing coverage or zero denominator returns Not available.
- Goal achievement, remaining gap, deadline and comparison use the same underlying calculations. Delivery goals measure completion of projects due in the window, not historical on-time delivery.

## Working controls

- Shared reporting month, trailing one/three/six-month briefing period, department/project/client scope and equal-day previous-period or year comparison. Primary cards remain monthly; cash trend charts remain six-month history. Delivery/workforce remain current snapshots. Scope filters exclude unmapped records.
- Widget show/hide, accessible up/down ordering, reset, KPI selection and configurable workload/delivery thresholds.
- Current cross-department attention queue, severity filter, review links and explicit confirmation before a demonstration approval/rejection. New demo requests can be entered without creating fictitious financial transactions.
- Persistent device activity with category/department filters; timestamp, responsible user and linked record.
- Goals create/edit; executive calendar list/month views with next-30-days/reporting-period, event/priority and shared scope filters.
- Record details support assignment, estimated hours, blockers, client/project/employee relationships, workforce capacity and sales metadata. Project links open the detailed performance page.
- Settings supports export/review/confirmed import of validated executive snapshots. Existing records merge by ID, supplemental datasets replace the snapshot, and invalid foreign keys, duplicate identities, overpayments and inconsistent dates are rejected. Source coverage flags must only be enabled for complete supplied datasets.

## Persistence and integration boundaries

Existing `businessos-demo-v1` records remain intact. Supplemental records, preferences and activity use `executive-data-v1`, `executive-preferences-v1`, and `executive-events-v1` respectively. State restores in dependency order so supplemental links to newly created projects survive reload. Storage failures produce visible session-only / recovery messages. There is no synchronization across devices or users.

No accounting ledger, unpaid invoice, cash account, attendance, timesheet, campaign, organizational target or approval transaction is fabricated. Those collections start empty. The dashboard shows Not available until required sources and relationships are supplied. Only sample business records ship with the app.

`src/lib/executive-service.ts` defines a future server repository contract and fail-closed executive/organization checks. This contract is tested; no production repository or authentication provider is configured. The app's local demo-owner approval controls are simulations, not production authorization. Before handling confidential data, integrate trusted server sessions, tenant-scoped reads/writes, permission-checked mutations, approval policies, financial reconciliation, and durable audit storage. No salary fields are added. AI responses are deterministic rules or the existing local lookup; workflow execution and external approvals are not connected. Client portal, workflow engine and sandbox remain explicit previews.

## Verification

```sh
npm run typecheck
npm test
npm run build
# With the preview running and Playwright/Chrome installed:
BUSINESSOS_URL=http://localhost:3002 npm run test:browser
BUSINESSOS_URL=http://localhost:3002 npm run test:components
BUSINESSOS_URL=http://localhost:3002 npm run test:executive
BUSINESSOS_URL=http://localhost:3002 npm run test:executive-import
```

Domain tests cover financial basis separation, missing coverage, division by zero, invoice aging, balances, budget periods, project allocations, delivery rules, workforce utilization, sales cohorts, scoped relationships, schema validation, preferences, cross-year periods and executive authorization. Browser suites cover approval confirmation/persistence, activity, widget ordering/visibility/reset, goals, calendar, shared dates, project details, record linking, financial snapshot import and restoration, all original workflows, responsive widths and reduced motion.

No 3D dependency is added to these productivity screens. Brutel uses supplied local font files; Next Image serves the supplied logo. Interactive animations respect reduced-motion preferences.
