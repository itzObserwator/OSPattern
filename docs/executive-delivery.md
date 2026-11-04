# Executive dashboard delivery

## Changed files

- `src/lib/models.ts`: additive optional relationships, sales stages/history, capacity, workload and blocker metadata; Paid-only cash totals.
- `src/lib/executive.ts`: schemas, ID validation, financial/project/workforce/sales/marketing calculations, attention rules, goals, periods, preferences and scoping.
- `src/lib/executive-service.ts`: typed future server repository, fail-closed executive role and organization checks.
- `src/components/business/executive-provider.tsx`: validated executive datasets, device preferences, event persistence, confirmed decisions, non-destructive workspace enrichment, storage recovery.
- `src/components/business/executive-controls.tsx`: shared filters, widget order/visibility, KPI selection, thresholds and reset.
- `src/components/business/executive-panels.tsx`, `executive-management.tsx`, `executive-charts.tsx`: attention queue, financial and departmental reports, rule-based insights, goals, calendar, activity and snapshot controls.
- `src/components/business/record-inspector.tsx`, `src/app/projects/[id]/page.tsx`: project drill-down and record assignment/relationship/capacity/sales editing.
- Existing `dashboard.tsx`, `dashboard-panels.tsx`, `finance-chart.tsx`, `module-page.tsx`, `data-table.tsx`, `workspace-provider.tsx`: integrated enhancements while retaining routes, record collections, task completion, forms, local lookup, navigation and folder interactions.
- `src/app/layout.tsx`, `src/app/executive.css`: shared executive styling in Brutel / #0022FF with responsive and keyboard/reduced-motion handling.
- README, package scripts and domain/browser tests. The prior Techgy Link logo and OSPattern subtitle remain intact.

## Implemented

Daily financial and delivery metrics, current cross-department attention queue, review/drill-down and confirmed device approval/rejection; compact workforce overview; financial profitability/category/aging/budget reports; project performance and profit table; scoped sales acquisition cohorts and stage histories; campaign cost/attribution measures; organizational goals; next-30-days or reporting-period executive calendar; persistent device activity; deterministic executive insight prompts; widget/KPI/layout preferences and shared filters. Supporting reports use progressive disclosure and existing department routes.

## Calculations and interactions

See README and `executive.ts` for exact financial bases and denominator guards. Cash is kept separate from earned/incurred accounting and issued invoices. Missing source coverage returns Not available. Project budgets are explicit, never inferred from recorded value. Budget utilization matches expense scope/period. Revenue/cost project attribution must be explicit. Sales transitions use the same acquisition cohort and intersection of historical prior/next-stage events. Unrelated time cohorts are not combined. Workforce hours and capacity are required for utilization. Goal dial/gap/comparison uses these same calculations.

Snapshot import checks duplicates, ID references, source coverage, dates and payment balances before committing a reviewed payload. Existing workspace records merge by ID and cannot be deleted or change kind through import. Supplemental records replace their reviewed snapshot. Invalid saved executive data is archived under `executive-data-recovery-v1` when storage permits. State restoration waits for existing saved workspace records before resolving executive relationships.

## Demonstration-only and unresolved integrations

All data and decisions remain on this device. Existing records are centralized samples. Accounting, issued invoices, balances, budgets, attendance, timesheets, campaigns, approvals and goals start empty; none were fabricated to populate visualizations. Enter a demo request, configure a goal, enrich records, or import validated sample accounting data to exercise the implemented paths.

No identity provider or production server adapter is connected. The service authorization boundary is tested but is not a replacement for a trusted server session. Before confidential data can be used, implement organization-scoped queries, verified executive identity/roles, protected mutation endpoints, durable audit storage, approval policies and reconciliation against accounting/HR/CRM providers. Local owner permissions are explicitly a demo simulation. No employee salaries are exposed.

No live multi-user feed, LLM, prediction model, ad-platform connector, workflow execution, customer portal security or runtime isolation is claimed. Original planned modules keep their explicit integration state. Imported supplemental invoice payments settle balances and must not be duplicated as additional cash receipts.
