# Business owner requirement audit

Scope: Phase 1 and the first connected workflow, per the final execution instructions. Audited the existing source before implementing. The existing browser-local modules remain available. The duplicate `/owner` interface has been removed following the integration audit. Its authenticated backend services remain available for reuse by those modules.

| Requirement | Existing evidence | Status before this pass | Phase / action |
|---|---|---|---|
| Executive metrics, financial curves, project health | dashboard.tsx, dashboard-panels.tsx, finance-chart.tsx | Implemented for local cash records | Preserve overview composition and animations |
| Compact five-section CEO overview | dashboard.tsx includes workspace and operations sections; previously removed attention sections | Partial, with user-specific layout edits | Preserve accepted layout; consolidate only in a future overview pass |
| Shared identifiers and relations | models.ts; executive.ts validateExecutive | Partial, local optional links | Phase 1: tenant-scoped persistent records, FK constraints, validated relations |
| Persistent backend | workspace-provider.tsx localStorage; demo-service.ts fixtures | Missing | Local SQLite, versioned migration, transactional repository; no paid/external provider |
| Login and organization isolation | executive-service.ts interface and caller-supplied guard | Missing enforcement | Server sessions, hashed passwords, organization membership and SQL scoping |
| Roles and approvals authorization | executive-service.ts guards, executive-provider.tsx demo decisions | Partial contracts only | Phase 1 roles and owner/admin permission enforcement; operational approval workflows Phase 8 |
| Clients and contacts | executive.ts minimal client id/name import | Partial | Phase 1 directory, contacts, details, linked deals/projects and onboarding |
| Lead conversion | record-inspector.tsx stage editor | Missing | First workflow: won deal → existing/new client → onboarding → linked project and task |
| Task owners, progress, statuses | models.ts; data-table.tsx; record-inspector.tsx | Implemented locally | Persistent workflow task, Phase 2 richer delivery controls |
| Dependencies, subtasks, time entries, milestones, delivery escalations, board/calendar/timeline | only blocker boolean and deterministic risk report | Missing / partial | Phase 2; no placeholder editors |
| HR records, availability, utilization | WorkforceReport, workforceIntelligence | Partial | Phase 3 employee details, attendance capture, shifts, overtime, recognition |
| Leave, delegation | executive approvals include leave dates; no transactional delegation | Partial | Phase 3 approval-driven reassignment and notifications |
| Cash receipts, paid expenses | financialSeries, summarize, Finance module | Implemented locally | Preserve; connected accounting Phase 4 |
| Accrual profit, budgets, invoice aging, break-even | financialIntelligence; executive data import | Partial, correct unavailable states | Phase 4 capture forms, persistent ledger and payments |
| Labor costs, explicit allocation and duplicate prevention | optional project links and direct/indirect ledger flags | Partial | Phase 4 allocation engine and auditable costs |
| CRM stage/source reports | SalesReport, stageHistory | Partial | Phase 1 persistent capture and conversion; Phase 5 follow-up/proposal/forecast depth |
| Marketing analytics and budgets | MarketingReport, campaigns and coverage data | Partial, manual import | Phase 6 content lifecycle, approvals and manual metrics capture |
| Platform lead sync and publishing | no authenticated platform adapter/webhooks | Integration dependent | Keep unavailable; requires credentials and tested adapters |
| Client portal, deliverable review and meetings | client-portal placeholder | Missing | Phase 7; client role denied owner APIs until client-scoped portal exists |
| Assistant and navigation queries | module-page.tsx local lookup, RuleInsights | Partial deterministic demo | Phase 8 authorized query service; live model integration dependent |
| Reports and exports | departmental reports; no dedicated catalog | Partial | Phase 8 report catalog and exports |
| Central approval center | AttentionCenter and ManagementData local decisions | Partial | Phase 8 server approvals with confirmation/history |
| Audit trail | browser events capped at 200 | Partial, device only | Phase 1 server append-only audit entries in transactions |
| Studio, workflow builder, sandbox publishing | planned placeholder routes | Out of scope | No configuration studio work |

## Phase 1 boundaries

Connected mode uses a local SQLite database on the app server. It is a single-server persistence foundation, not a hosted production deployment. Anonymous demo data is never uploaded automatically. Explicit import is owner/admin only, retains IDs, validates relations, and rejects conflicting IDs. Authentication uses server-only password hashes and opaque expiring sessions. All connected queries derive organization/user/role from the stored session, not request input. New organizations have no fabricated operational or financial data.

Future phases retain the existing local reports until their inputs and operational writes move to the persistent repository. Real email delivery, notification delivery, SSO/MFA, account recovery, client portal, remote database operations/backups, calendars, social APIs, payment processors and AI providers remain integration dependent. This pass does not claim to complete phases 2–8.
