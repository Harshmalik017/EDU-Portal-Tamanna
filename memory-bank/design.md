# Design: refined soft-clay, Tamanna green (palette from the booklet)
> v0.6.0: navigation is a left sidebar (`components/layout/Sidebar.tsx`); content uses `PageHeader` then `Card`s; Inter font; surfaces are `clay` (16px radius, hairline border, soft shadow). Reuse `components/ui` (Button, Card, Badge, StatCard, PageHeader, Input, Select) before adding new styles.
> Colours: page lime `#cadd69`, brand green `#6eaf4d` (buttons use darker `#3f8a2a` for contrast), ink `#25331a`, background gradient `#f7faea` to `#cadd69`. Logo and art: `public/brand/`. Level colours: High green, Average blue, Low amber (always with text labels). Older notes below that mention blue are superseded.
- Background: `#e3eeff → #c9d9ff → #d6cfff` diagonal gradient
- Primary: `#5b9bff → #4b4fe0`; ink text `#1e2a5a`
- Surfaces use `.clay` (soft outer shadows + inner highlights, 28px radius); inputs use `.clay-inset`; buttons `.clay-btn` / `.clay-btn-soft` (in `app/globals.css`)
- Font: Nunito (rounded, matches clay forms)
- Icons: lucide-react only
- Rules: sentence-case copy, visible focus rings, reduced motion respected, tables scroll horizontally on mobile.
- Reuse components from `components/ui` before adding new ones.
