# Module: UI
Layout: `components/layout/Sidebar` (left menu with non-technical teacher labels, drawer on mobile), `components/layout/TopBar`, `app/admin/layout.tsx`. Shared: `components/ui` (Button, Card with header slots, Badge, StatCard, PageHeader, Input, Select, Skeleton), `Toast` (useToast), `CameraCapture`, `DemoBanner`, `VersionBadge`.
Routes: `/admin` dashboard, `/admin/results` (student reports), `/admin/students/[id]`, `/admin/scan` (check answer sheets), `/admin/verify` (hand check 10–20 sheets), `/admin/key` (answer key), `/admin/logs` (key notes about the portal + recent sheet activity).
Pending: dark mode, Hindi labels, auto-capture in camera, service worker (offline).
