import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, description, icon: Icon, actions, meta }: { title: string; description?: string; icon?: LucideIcon; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shadow-[inset_2px_2px_5px_rgba(60,90,20,.10),inset_-2px_-2px_5px_rgba(255,255,255,.8)]"><Icon size={20} aria-hidden="true" /></span>}
        <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-0.5 max-w-2xl text-sm text-ink/80">{description}</p>}</div>
      </div>
      {(actions || meta) && <div className="flex flex-wrap items-center gap-2">{meta}{actions}</div>}
    </header>
  );
}
