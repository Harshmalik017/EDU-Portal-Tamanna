import clsx from "clsx";
import type { ReactNode } from "react";
const TONES = { neutral: "bg-stone-100 text-stone-800", green: "bg-green-100 text-green-900", blue: "bg-sky-100 text-sky-900", amber: "bg-amber-100 text-amber-900", red: "bg-red-100 text-red-900" } as const;
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone])}>{children}</span>;
}
