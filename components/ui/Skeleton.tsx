export function Skeleton({ rows = 4 }: { rows?: number }) {
  return <div aria-busy="true" className="space-y-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="clay-inset h-10 animate-pulse" />)}</div>;
}
