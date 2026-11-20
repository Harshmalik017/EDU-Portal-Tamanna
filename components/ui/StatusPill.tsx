import clsx from "clsx";
import type { HTMLAttributes } from "react";

const tones = {
  green: "bg-green-100 text-green-900",
  blue: "bg-blue-100 text-blue-900",
  violet: "bg-violet-100 text-violet-900",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-900",
  slate: "bg-slate-100 text-slate-700",
} as const;

export function StatusPill({ children, tone = "slate", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold", tones[tone], className)} {...props}>{children}</span>;
}
