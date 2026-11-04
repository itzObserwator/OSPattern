# BusinessOS

An independent Next.js App Router application inside the Vectramind repository. The existing marketing site keeps its own dependencies, routes, styling, and build.

```sh
cd businessos
npm ci
npm run dev
```

Open http://localhost:3002. Run `npm run build`, `npm run typecheck`, and `npm test` for validation. The parent repository's TypeScript configuration excludes this independent app.

With the app running, `npm run test:browser` checks the production UI using the parent repository's installed Playwright and local Chrome. It covers forms, persistence, table interactions, every module route, the mobile drawer, and overflow at five viewport sizes. Screenshots are saved in `/tmp/businessos-qa`.

`npm run test:components` checks shared surfaces and all eleven module routes at 320, 768, 1024, and 1440px. It exercises validation focus, record creation, filter resets, selection clearing, finance tabs, assistant suggestions, manual lookup, new-session controls, mobile dialogs, and fresh-page reduced-motion behavior. Use `BUSINESSOS_URL` to select the running preview; the component suite defaults to port 3003.

## First delivery

- Responsive shell with sidebar collapse, mobile navigation drawer, record search, notifications, and workspace profile.
- Overview with six record-derived KPIs, monthly financial selector, lazy-loaded Recharts analytics, accessible chart data table, project health, tasks, deadlines, project summaries, and quick creation.
- Shared TanStack Table with filtering, search, sorting, pagination, and selection for projects, employees, tasks, leads, and financial payments.
- Radix-based shadcn-style button and dialog primitives, Lucide icons, React Hook Form and Zod validation, Tailwind v4 theme tokens, and Motion transitions that respect reduced motion.
- AI screen with explicit local record lookup; planned modules have honest scope descriptions.

## Data and integration boundaries

`src/lib/demo-service.ts` supplies typed sample records. `src/lib/models.ts` defines validation and calculations. UI state lives in the workspace provider; changed records are stored under `businessos-demo-v1` in localStorage. Storage is browser-specific and contains demo data only; remove that key to reset. If storage is unavailable, mutations last for the session.

Financial values use USD. Revenue totals received invoice payments and expenses total paid outflows in the selected month. Their difference is net cash movement, not accounting profit. Operational KPIs show the current workspace records regardless of the financial reporting month. Chart data covers six months through the selected month. Project progress is sample record data, not inferred from task completion. No attendance or campaign metrics are fabricated.

The user-supplied Brutel OTF assets live in `public/fonts/brutel/`. All nine static weights (100–900) are configured through `next/font/local` in `src/app/layout.tsx`, without preloading unused weights. CSS uses the supplied static weights; local Inter remains a fallback. The browser regression check verifies that Brutel Regular actually loads.

## Overview visual redesign

The overview uses a 12-column editorial composition: a royal-blue financial feature, a navy delivery summary, two compact supporting metrics, custom expense bars and revenue area chart, and a segmented project-health panel. The operations desk combines actionable tasks, recorded team assignments, delivery milestones, an honest approval-integration state, and activity observed during the current overview visit. The AI command card uses a dotted context map, connected nodes, and working links to the existing local lookup interface. Its connectors follow node positions as the layout resizes; it does not represent an execution engine.

`dashboard.tsx` composes the view; `dashboard-panels.tsx` contains its reusable panels and numeric transitions. `finance-chart.tsx` owns the custom chart and tooltip. `app-shell.tsx` provides command search (Cmd/Ctrl+K), animated active navigation, the workspace dialog, profile, and notifications. `globals.css` centralizes the refreshed tokens, shell, overview, and responsive layouts. Existing routes, models, service adapter, storage key, and module content are preserved. Activity is in-memory feedback for this overview visit, not a server audit trail.

The Behance pages initially returned 403 errors. The user subsequently supplied the ClauseOS and Quarn reference PNGs, which were inspected directly. Their spatial depth, translucent folder layers, floating pill controls, dotted canvases, connection ports, and restrained typography inform an original light-mode, royal-blue BusinessOS interpretation. Their artwork and logos are not used. `workspace-canvas.tsx` provides selectable record folders, category filters, previous/next controls, and a record inspector; `spatial.css` owns these visual treatments and their responsive layouts.

## Shared component design

`src/app/components.css` extends the same visual system across every existing surface: collection summaries, module headers, record tables, sorting and search controls, status filters, pagination, row selection, avatars, badges, forms, validation messages, overlays, notifications, search results, record details, empty states, loading skeletons, and recovery pages. Module content remains within the implemented demo scope.

The AI workspace separates local record context from conversation, supports fresh lookups, and labels every response as a browser-local result. Settings groups workspace information and connection status into coordinated panels. Planned modules use a layered folder empty state and explicitly describe the functionality that is not yet connected. Shared controls retain their original data contracts and accessible names. Route and entrance animations use hydration-stable initial markup and respect reduced motion.

No authentication, tenant isolation, backend persistence, OS Pattern integration, AI provider, workflow execution, secure client portal, or isolated sandbox is implemented. This app must not be used with sensitive production records before those boundaries are implemented and tested.

## Animation and future modules

Motion provides restrained KPI entrances and a shared reduced-motion policy. CSS covers hover, sidebar, overlay, and loading transitions. The chart loads only on the dashboard. Heavy 3D is deliberately absent from productivity screens. Add Three.js / React Three Fiber / Drei behind a client dynamic-import boundary when a concrete onboarding or illustration experience is developed; provide a static fallback and handle WebGL context failure. React Flow belongs in the workflow module when its local editor is implemented. Zustand, TanStack Query, and GSAP are unnecessary for this first phase; introduce them when shared UI state, real API synchronization, or complex timeline animation warrants them.

Next step: confirm the supported backend contract, authentication, tenancy, and role matrix, then implement an end-to-end project/task workflow against that contract. Marketing, client portal, workflows, and sandbox currently have routed scope pages rather than simulated functionality.
