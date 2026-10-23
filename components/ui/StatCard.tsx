import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

type Tone = "green" | "blue" | "amber" | "violet" | "red";
const tones: Record<Tone, { card: string; icon: string; label: string }> = {
  green: { card: "bg-brand-50 border-brand-200", icon: "bg-brand-100 text-brand-700", label: "text-brand-800" },
  blue: { card: "bg-sky-50 border-sky-200", icon: "bg-sky-100 text-sky-700", label: "text-sky-800" },
  amber: { card: "bg-amber-50 border-amber-200", icon: "bg-amber-100 text-amber-700", label: "text-amber-800" },
  violet: { card: "bg-violet-50 border-violet-200", icon: "bg-violet-100 text-violet-700", label: "text-violet-800" },
  red: { card: "bg-red-50 border-red-200", icon: "bg-red-100 text-red-700", label: "text-red-800" },
};

export function StatCard({ label, value, hint, icon: Icon, tone = "green" }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: Tone }) {
  const t = tones[tone];
  return (
    <div className={clsx("clay flex items-center gap-4 p-5", t.card)}>
      {Icon && <div className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", t.icon)}><Icon size={22} /></div>}
      <div><p className="text-2xl font-bold leading-none">{value}</p><p className={clsx("mt-1 text-sm font-medium", t.label)}>{label}</p>{hint && <p className="text-xs text-ink/70">{hint}</p>}</div>
    </div>
  );
}
