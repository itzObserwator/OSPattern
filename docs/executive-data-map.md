# Executive dashboard: data map and implementation contract

The existing browser-local demonstration remains the source of truth. No database or destructive migration is introduced. Existing IDs and the `businessos-demo-v1` storage key are retained. The active product name is Techgy Link / OSPattern.

| Existing record | Existing meaning | Relationships / limits |
|---|---|---|
| project | Delivery record; date is deadline; amount is an unspecified recorded value | Do not reinterpret amount as approved budget or recognized revenue. Optional clientId, departmentId and project facts are explicit. |
| task | Assigned work; date is due date; owner is a display name | Optional projectId, employeeId, estimatedHours and blocker. Historical owner-name matching is only a fallback for task assignments. |
| employee | Directory entry; owner is team | Optional departmentId and weeklyCapacityHours. No salary fields. |
| lead | Opportunity; amount is recorded pipeline value; date is creation date | Optional clientId, stage, stageHistory, source, closedDate and campaignId. Legacy Active has no known sales stage. |
| invoice | Historical paid receipt; date is cash receipt date | Preserve this meaning. Issued invoices live separately; never add an issued invoice to cash revenue. |
| expense | Historical paid outflow; date is payment date | Optional projectId, category and campaignId. This does not prove an accrual expense. |

## Additive executive records

`executive-data-v1`: clients, departments, issued invoices with allocated payments, earned revenue / incurred expense ledger entries, approved budgets, cash account balances, attendance, leave dates on management requests, timesheets, campaigns, management approvals, scheduled events, and goals. All start empty; no fabricated financial transactions are seeded. Records are runtime-validated, use stable IDs and are checked for foreign-key integrity. Payments in this supplement settle invoice balances only; legacy cash receipts remain the exclusive cash-flow source until a backend replaces the adapter. Avoid entering the same cash payment twice.

Project → task / employee / client; lead → client / campaign; invoice → client / project → allocated payments; accounting entry → project / campaign; attendance / leave / timesheet → employee. IDs are persisted; no duplicate client IDs or case-insensitive names are accepted.

`executive-preferences-v1`: device-local filters, widget order / visibility, chosen financial KPIs and workforce / delivery thresholds. Filters are shared by overview and reports. Scope filters affect related records; unrelated/unmapped records are excluded when a scope is selected. Dates affect financials, sales cohorts, marketing and calendar; delivery and workforce are explicitly current snapshots. Comparisons use equal-length previous periods or previous-year ranges. Six-month trend charts show the six months ending at the chosen end date and remain labeled as such.

## Information architecture

Overview: existing header, connected folders and financial / delivery metrics; prominent Needs Your Attention; existing cash trend and delivery ring; existing task / workload / milestones / activity areas; expandable Executive briefing (financial intelligence, project performance, sales, marketing, goals); existing assistant and quick actions. Deep analytics are on existing Finance, Projects, People, CRM and Marketing routes. No duplicated cash trend chart is added to the homepage.

## Security boundary

All shipped and locally entered records are demonstration data. Browser approval controls simulate an organization-owner role; they are not production authorization. No confidential production data, API or real multi-user claims are introduced. The server service contract requires a verified executive principal and matching organization, fails closed otherwise, and has no configured production adapter. Production integration must supply authenticated server sessions, tenant-scoped queries, protected mutations, durable audits, and reconciliation. Local events describe this device only.
