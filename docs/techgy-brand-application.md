# Techgy brand application

Source: user-provided Techgy Brand Guidelines.pdf, pages 31–40. Applied through `src/app/techgy-brand.css`, imported after the established component styles. Geometry, layout, existing data and interactions are unchanged.

- Electric blue: #0022FF, hover #001BCC, pale tint #E6E9FF (primary ramp, p.32).
- Primary text: #111625, secondary #414551 (charcoal ramp, p.34).
- Structural navy: #0F1A34 (detailed structural ramp, p.33). The summary on p.31 prints #0F3A34 while visually showing navy; the detailed ramp resolves this discrepancy.
- Canvas: #F8F9FA (p.35), surface white, dividers/borders #E2E8F0 and controls #C0CAD6 (p.36).
- Brutel remains the primary face for headlines and display figures, with bold headings. Inter provides supporting copy, forms, navigation and chart labels (pp.38–40).

The exact vivid blue folder gradient is protected: #3956FF → #0022FF. Its SVG stop values, selected-folder geometry and hover behavior are unchanged. Existing vivid blue gradients on workspace marks, lookup nodes and related feature motifs are also preserved. Cash-chart fill and timeline gradients are retained. The uploaded Techgy logo is used without modifying or recreating its artwork.

Other cards use neutral brand surfaces, structural gray/navy, and the primary color ramp. The navy insight card uses #0F1A34. Delivery bars retain blue primary bars with blueprint-gray secondary bars. Chart annotations use the brand tint; project-health sectors use the primary, structural and schema ramps. Semantic warning/error states retain their functional meaning.

Files changed: `src/app/techgy-brand.css`, `src/app/layout.tsx`, `src/components/business/finance-chart.tsx`, and `src/components/business/delivery-pulse-chart.tsx`. No removed sections are reintroduced and no business calculations or storage schemas change.
