# BusinessOS existing module integration audit

> Follow-up: The redundant Connected operations navigation entry, `/owner` page, dedicated component and stylesheet were removed after this audit. The authenticated API, repository, migrations and existing database were retained for integration into the current modules. References to the separate UI below describe the audited state before its removal.

The existing department screens share browser-local records and several working calculation functions. They do not use the authenticated SQLite repository behind `/owner`. Consequently, none of the five requested workflows is fully connected across the existing modules, persistence layer, and authorization boundary.

The minimum architectural correction is to connect the existing providers and forms to the existing server services. A second set of departmental screens is unnecessary. The Executive Overview layout and the current visual design can remain unchanged.

## Workflow classifications

| Workflow | Classification | Working portion | Incomplete portion |
|---|---|---|---|
| CRM → Client → Project | Partially implemented | Existing record editor accepts client/project IDs; server conversion and delivery transactions work in `/owner` | Existing CRM stage changes do not invoke conversion, create clients, or hand off projects |
| Projects → Timesheets → Finance | Partially implemented | Linked ledger expenses affect project and business profit; timesheets can be imported | Timesheets do not produce labor costs; no rate, allocation, or posting connection |
| HRMS → Leave → Project availability | Partially implemented | Approved leave contributes to the leave count; task estimates contribute to utilization | Leave does not reduce availability or capacity; manager-approved delegation is missing; current approval decisions are browser simulations |
| Marketing → CRM | Partially implemented | Explicit campaign IDs drive lead counts, CPL, attributed revenue and ROAS | Campaign/lead relationships require snapshot import; operational capture, attribution propagation and platform synchronization are incomplete |
| Finance → Executive Overview | Partially implemented | Paid receipts/outflows update cash metrics consistently within the browser workspace | Invoice settlement, cash receipts and accrual entries require separate inputs; main financial cards do not expose accounting profit; SQLite data does not reach the overview |

No entire workflow is classified as fully working and tested. Individual successful paths and missing subflows are distinguished below. Existing calculations are real calculations over local records; the presence of sample inputs does not make every report a purely visual mock.

## Architecture and sources of truth

| Layer | Existing files | Data and behavior |
|---|---|---|
| Route composition and initial data | `src/app/layout.tsx`, `src/app/[module]/page.tsx`, `src/app/page.tsx`, `src/lib/demo-service.ts` | Root layout loads the sample adapter. Existing department pages render `ModulePage`; the overview renders `Dashboard`. |
| Core business records | `src/lib/models.ts`, `src/components/business/workspace-provider.tsx` | `BusinessRecord` covers project, employee, task, lead, invoice and expense. React context restores `businessos-demo-v1` from localStorage. Creation, edits and task completion save the core array in that browser. |
| Supporting operational and accounting records | `src/lib/executive.ts`, `src/components/business/executive-provider.tsx` | `ExecutiveData` holds clients, departments, ledger entries, issued invoices with payment allocations, budgets, balances, attendance, timesheets, campaigns, approvals, goals and events. Separate localStorage keys hold this data, preferences and device activity. |
| Existing module creation and editing | `create-record-dialog.tsx`, `record-inspector.tsx`, `data-table.tsx`, `executive-management.tsx` under `src/components/business/` | Basic creation uses UUIDs and limited fields. The record editor adds selected relationships and stage history. Supporting collections are mainly supplied through validated snapshot import in Settings. |
| Shared calculations and filters | `src/lib/models.ts`, `src/lib/executive.ts`, `src/components/business/executive-controls.tsx` | `summarize`, `financialSeries`, `financialIntelligence`, `projectPerformance`, `workforceIntelligence`, `salesIntelligence`, `marketingIntelligence`, `scopeRecords`, `scopeData` and `useExecutiveScope` derive reports from the two local contexts. |
| Existing module and overview rendering | `module-page.tsx`, `executive-panels.tsx`, `dashboard.tsx`, `dashboard-panels.tsx`, `finance-chart.tsx` | Department reports and overview consume these local contexts. No calls to `/api/owner` occur in these components. |
| Persistent server foundation | `src/lib/owner/contracts.ts`, `database.ts`, `auth.ts`, `repository.ts`; `src/app/api/owner/route.ts`; `migrations/001_owner_foundation.sql` | SQLite stores organizations, users, memberships, sessions, clients, core records, conversions, onboarding, audit events and authentication attempts. Queries and mutations derive organization and role from a stored server session. |
| Separate server consumer | `src/components/owner/owner-workspace.tsx`, `src/app/owner/page.tsx`, `src/components/business/app-shell.tsx:57` | Only the separate owner workspace consumes the owner API. The app shell explicitly branches for `/owner`; existing modules keep using their local providers. |

### Persistence and authorization

Existing module mutations have client-side validation but no authenticated server authorization. `ExecutiveFilters` are report filters, not access controls. `executive-service.ts` defines guarded repository contracts, but those contracts are not the persistence path used by `WorkspaceProvider` or `ExecutiveProvider`. Approval decisions label the actor as a demo owner and are stored on the device.

The owner API does enforce sessions, roles, organization-scoped queries, same-origin POST requests and transactional mutations. Composite foreign keys protect its client/project/employee/deal references; unique keys protect conversions and normalized client emails. These protections apply to API records, not to the existing local module state.

A same-session test created a project through the authenticated API, then opened the existing `/projects` route. The API returned the new project; the existing table still contained the six sample projects and did not contain the new project. The integration gap is observable even while signed in.

Browser import into the server is an explicit, one-way copy of core records and minimal clients. It is not synchronization. Existing IDs are rejected on re-import; accounting supplements, timesheets, campaigns, approvals and other supporting collections are not persisted by that adapter. Campaign/department-linked imports are explicitly rejected pending adapters.

## CRM to client to project

**Classification: Partially implemented.**

**Files and models:** `models.ts:5` defines lead stage, history, source and optional client/project IDs. `record-inspector.tsx:13` implements editing. `executive.ts:119` calculates stage reports. Clients are minimal `{id,name}` records in the local `ExecutiveData`; project records may reference `clientId`. The persistent equivalents are `ownerRecordSchema`, the SQL clients/conversions/records tables, and `repository.ts` functions `createLead`, `convertLead`, `startDelivery`.

**Creation and update trace:** Existing CRM creates a core lead through `CreateRecordDialog` and `WorkspaceProvider.save`. Editing its stage to Won updates that same record, adds dated history and sets `closedDate`. It does not call a conversion service or create a client. Client IDs are selected manually from supplemental imported clients. A project can then be linked to an existing client through its record editor; the project report and detail page resolve that ID to the client name.

The separate server conversion transaction normalizes and reuses client email, records one conversion per lead and creates onboarding once. Its delivery transaction creates the project/task with the same client and originating lead. Repeating either operation does not duplicate the handoff. These functions are reusable, but the existing CRM and Projects forms do not invoke them.

**Verified behavior:** A browser-created lead was changed to Won through the existing editor. Stored stage became Won, `clientId` remained absent, client count stayed zero, and project count remained six. A subsequent validated import of a client/project association made the existing project detail show the linked client and ledger-derived profit. Server workflow tests passed for conversion, email deduplication, linked delivery, retries and cross-organization denial.

**Gaps:** There is no existing-module conversion handoff, stable originating-deal field in the legacy model, or transactional client/project creation from CRM. Conversion does not propagate campaign attribution into a new project. In both the old editor and server conversion, the generic lead status can remain Active after stage becomes Won; overview active-lead counting uses generic status while sales reports exclude Won/Lost stages. That allows inconsistent active-lead totals.

**Minimum changes:** Invoke the existing server conversion and delivery services from the existing CRM record action and Project form. Reuse one client identity and add/preserve the existing server `originLeadId` relationship in the shared model. Align active-lead calculation with terminal stages. Retire the duplicate workflow UI only after its existing services are connected and tested in the current modules.

## Projects to timesheets to finance

**Classification: Partially implemented. The timesheet-to-labor-cost subflow is missing.**

**Files and models:** `executive.ts:17` defines timesheets with employee ID, optional project ID, date, hours and overtime. Core employees have optional weekly capacity and tasks have estimated hours. `projectPerformance` at line 90 calculates project finances from `ExecutiveData.ledger`; `financialIntelligence` at line 63 calculates organization finances from the same ledger. `WorkforceReport` reads timesheet overtime. `ManagementData` imports these collections.

**Creation and update trace:** Core projects/tasks use the standard creation and editing path. Timesheet entries currently enter through the supplemental snapshot. Financial calculations consume explicitly posted ledger entries, not timesheet hours. A ledger expense with project ID and direct/indirect allocation contributes to project cost; a ledger expense in the reporting period contributes to organization cost. There is no hourly-rate model or service that turns approved hours into one attributable expense.

**Verified behavior:** With recognized revenue of $1,000 and a direct project expense of $200, project and organization profit were $800. Adding an eight-hour timesheet did not change that profit; doubling its hours to 16 through snapshot import also left the rendered project profit at $800. The timesheet's two overtime hours did reach the workforce calculation. Adding a further $100 allocated ledger expense reduced both project and organization profit to $700.

**Gaps:** Labor-rate inputs, timesheet approval/posting, resource-cost calculation and deduplication are missing. Salary, contractor and overhead allocation are not inferred. The persistent migration has no timesheet or ledger tables; its generic record import does not persist these supplemental collections. Project cost reporting is therefore connected to manually supplied ledger data, not the operational source of labor costs.

**Minimum changes:** Persist the existing timesheet and ledger models in the shared backend. Add rate/effective-date inputs and approved-timesheet posting inside the existing Projects/HR/Finance interfaces. Store a unique source reference on generated labor entries so retries and salary allocations cannot double count costs. Keep existing profitability functions and unavailable-data states.

## HRMS to leave to project availability

**Classification: Partially implemented. Manager-approved task delegation is missing; the current approval action is a local simulation.**

**Files and models:** `executive.ts:20` defines approvals, including employee ID and leave dates. `workforceIntelligence` at line 105 joins active employees to open tasks, using employee IDs where present and matching owner names otherwise. `executive-provider.tsx` implements local `decide`; `executive-management.tsx` renders decision controls. `RecordEditor` supplies weekly capacity and remaining task estimates.

**Creation and update trace:** Leave approvals can be provided through the snapshot. An `AttentionCenter` request form also exists in source, but its overview section has been removed from the active layout; it is not a substitute for a complete leave-management path. Approving a pending request changes the supplemental approval status and records a browser event. The workforce calculation counts approved leave covering today when attendance does not override it.

Resource availability is calculated separately as utilization below 100%. Utilization divides estimated open-task hours by weekly capacity. Neither calculation subtracts approved leave or removes unavailable employees. The approval action does not create a reassignment proposal, change tasks, check project access, or notify participants.

**Verified behavior:** In a controlled one-person calculation, approved leave increased the leave count to one while available resources stayed at one and the employee retained the task. In the browser, a fixture with 12 employees and known capacity displayed one employee on leave and 12 available resources. Ownership was unchanged.

**Gaps:** Leave-aware dated capacity, conflict detection for deadlines during leave, delegation approval records and notification delivery are absent. Name-based employee matching is a fallback, not a reliable shared identity. Server account IDs (`assigneeUserId`) are separate from the employee IDs used by local timesheets and leave.

**Minimum changes:** Use stable employee/account relationships, apply approved leave to availability for the relevant dates, and expose conflicting tasks in the existing HR/Project views. Store manager-approved delegation as an audited transaction that updates the existing task record. Preserve current ownership until a permitted manager approves. Reuse the existing notification entry rather than create another dashboard.

## Marketing to CRM

**Classification: Partially implemented.**

**Files and models:** Core leads and paid expenses have optional `campaignId` and `source`. Supplemental campaigns and revenue ledger entries also carry stable IDs. `validateExecutive` checks campaign references. `marketingIntelligence` at line 176 joins campaign IDs to leads, paid marketing expenses and earned revenue. `SalesReport` and `MarketingReport` render derived results.

**Creation and update trace:** Campaigns, their attribution links and coverage flags primarily enter through snapshot import. Lead source and dated stage can be edited in the existing CRM editor. Basic creation does not ask for a campaign, and `RecordEditor` has no campaign selector. Marketing does render a real campaign comparison report; it has no operational campaign/lead capture bridge or authenticated advertising-platform adapter.

**Verified behavior:** With $100 of attributed Advertising expense and one campaign-linked lead, the report showed one lead and $100 CPL. Linking a second existing lead through a validated snapshot changed it to two leads and $50 CPL. $1,000 of campaign-linked earned revenue produced 10× ROAS. Results changed in the actual Marketing page, not just a standalone calculation.

**Gaps:** Link capture is incomplete in ordinary forms; generated leads are not created by a campaign action. Attribution is manually assigned by single campaign ID, with no recorded attribution rule/history or automatic propagation through won deal, client and project. ROAS is implemented; complete campaign ROI and non-ad cost attribution are not. Platform synchronization is absent. Server import rejects campaign-linked snapshots, so this working browser calculation cannot yet run on the persistent source.

**Minimum changes:** Persist the existing campaign model and expose a campaign selector in existing CRM/expense forms. Preserve campaign/deal references during conversion and project handoff; require explicit revenue attribution rather than infer revenue from deal value. Continue using the current marketing calculation functions. Add external integrations only after this manual path works.

## Finance to Executive Overview

**Classification: Partially implemented. The local cash-record-to-overview path is fully working and tested.**

**Files and models:** In `models.ts`, core `kind:"invoice"` with Paid status represents a cash receipt, not an issued invoice. `summarize` and `financialSeries` sum paid core records. Separately, `ExecutiveData.invoices` models issued invoices with payment allocations, while `ledger` models recognized revenue and incurred expenses. `FinancialIntelligence` renders these metrics; `Dashboard` uses the core cash summary and project health.

**Creation and update trace:** Finance's Received payments / Paid expenses tabs create paid core records through the shared browser provider. Navigating to the overview reads the same provider, so those changes affect the selected month's amount and trend. Issued invoices, payments and accrual ledger entries are imported separately. Payment allocations settle receivables only; they intentionally do not get summed again as cash receipts. That prevents automatic double counting, but no service links settlement and the corresponding receipt as one economic event.

**Verified behavior:** Creating a $321 paid receipt in Finance changed October's overview cash received from $54,000 to $54,321. With a separate $1,000 issued invoice, adding a $250 payment allocation reduced outstanding invoices to $750, while overview cash received stayed $54,321. A paid receipt alone did not change accounting profit. Linked ledger expenses changed both project and business profit consistently.

**Gaps:** No atomic payment-posting service updates invoice allocation and cash records together, and there is no shared cash transaction reference between them. Accrual revenue/costs are not inferred from cash. Main overview financial charts show cash movement; the performance badge is net cash divided by receipts, not operating profit margin. A profitability answer can be available in the Finance report while absent from the main overview cards. The overview and Finance pages do not read the server repository.

The overview's primary financial card uses the selected month; Finance report totals can use the selected trailing reporting range. Project profitability uses linked ledger entries through today. These different time bases must be aligned before comparing figures; a difference is not automatically an arithmetic defect.

**Minimum changes:** Connect existing providers to the authenticated persistent source. Add an idempotent payment-posting operation with a stable economic transaction ID so settlement and cash receipt reconcile without counting both as income. Preserve the separation between accounting and cash. Supply an accounting-profit value or explicit unavailable state inside an existing overview metric without changing its layout or adding another chart.

## Data integrity findings

1. **Separate stores are the primary integration defect.** Existing modules and `/owner` have different persistence, update and retrieval paths. A shared identifier in two stores does not provide synchronization.
2. **Seed relationships are absent.** The adapter returns 58 records, including six projects and seven tasks. Zero sample tasks have `projectId`; zero sample records have client or campaign IDs. Names such as Acme or Atlas suggest relationships that the data does not declare. No duplicate seed IDs were found.
3. **Duplicate core IDs are accepted by some validation paths.** Restoring the core list validates individual records but does not enforce ID uniqueness. `validateExecutive` initializes a Set from core IDs, so two core records with the same ID are also accepted there. The import UI rejects duplicate incoming core IDs; this does not cover every restore/write path.
4. **Different client identity rules exist.** Local clients enforce unique case-insensitive names; SQL clients enforce unique normalized email. Import preserves IDs but does not reconcile the two identity policies or synchronize later edits.
5. **Relationship existence is not full consistency.** Local validation checks referenced IDs exist, but does not enforce matching client IDs between a task and its project. The server repository checks this when both client values are supplied. Required linkage and consistency rules need one canonical mutation boundary.
6. **Lead lifecycle totals can disagree.** Won/Lost stages and generic Active status are independent; the overview and sales report use different definitions of an active lead.
7. **Financial representations are not automatically reconciled.** Core cash receipts, issued-invoice payment allocations and accrual ledger entries are distinct. The design avoids blindly summing them, but independent entry can leave missing or inconsistent records.
8. **Browser writes are not database transactions.** Core records and supplemental data are stored under separate keys. Shared React state provides same-session updates; it does not provide organization-wide synchronization or transactional durability across those keys.

## Test evidence

All browser fixtures were created in fresh test contexts. Server tests used an isolated temporary SQLite database and test organization on port 3003. The ordinary app stayed on port 3002. No existing user snapshot was replaced.

| Check | Result |
|---|---|
| Existing `npm test` suite | 23 passed: cash/accrual distinctions, project costs, invoice allocations, budgets, scope, leave counts, marketing attribution and validator behavior |
| Existing `tests/executive-import.mjs` | Passed: import, project/task links, project and finance profit, invoice balances, budget utilization, reload and invalid-reference rejection |
| Existing `tests/owner-workflow.mjs` against the isolated database | Passed: login/session flags, role and tenant denial, conversion, deduplication, delivery, task updates, import rollback, CSRF rejection and browser form journey |
| Additional existing-module browser audit | Passed its behavioral assertions: Won without conversion; Finance receipt updates overview; imported client appears on project; leave count without availability change; campaign changes update Marketing; doubled timesheets leave profit unchanged; invoice settlement does not post cash |
| Existing-module API observation | Zero `/api/owner` requests during CRM, Finance, Settings, Projects, HR, Marketing and Overview visits/mutations in the additional browser audit |
| Same authenticated session across server and existing Projects | Server project present in API; absent from existing table, which still showed six sample projects |
| Browser runtime errors in the additional module audit | None |
| Core source preservation | Source, migration, existing test and package-file hashes checked before/after; application code and visual assets unchanged |

The test suite passing means its specified behaviors hold. It does not make missing operational integrations complete. In particular, an approved-leave counting test does not establish leave-aware availability, and a project-profit calculation test does not establish timesheet cost posting.

## Minimum integration sequence

1. **Use one persistence boundary behind existing providers.** Adapt `useWorkspace` and `useExecutive` to the existing authenticated repository, preserving their component-facing APIs and the current routes. Persist supplemental models through versioned migrations. Keep sample data explicitly separate from authenticated organization data. Use explicit reviewed migration of browser snapshots and refresh/invalidate shared state after mutations.
2. **Reuse the existing CRM conversion services.** Connect them to existing CRM and project forms, preserve client/deal references and unify lead terminal-state counting. Do not retain two competing conversion interfaces.
3. **Complete financial source posting.** Link invoice settlement to a single cash transaction, then add approved timesheet labor posting and explicit cost allocation with unique source references. Reuse existing finance/project calculations and their unavailable-data guards.
4. **Make availability and delegation use approved leave.** Adjust capacity for the relevant dates; require an authorized manager for reassignment and retain an audit record. Do not automatically reassign tasks on request submission.
5. **Capture campaign attribution in current forms.** Persist campaigns, add the missing selectors and carry explicit attribution through the existing lead/client/project relationships. Keep API synchronization honestly marked as unconnected.
6. **Apply integrity and authorization centrally.** Enforce unique record IDs, relationship types, client/project consistency, employee/account mappings and organization/role checks on every existing-module mutation. Add regression tests for each dependency update before retiring the separate `/owner` workflow UI.

These are backend, provider and existing-form integrations. They require no new module, duplicate dashboard, or Executive Overview layout change. No implementation changes were made during this audit.
