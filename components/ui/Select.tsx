import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[]; placeholder?: string; hideLabel?: boolean };
export function Select({ label, options, placeholder = "Select", hideLabel = false, className, ...p }: Props) {
  return (
    <label className="block text-sm font-semibold"><span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <span className={clsx("relative block", !hideLabel && "mt-1")}>
      <select className={clsx("clay-inset min-h-11 w-full appearance-none py-3 pl-4 pr-10 outline-hidden focus:ring-2 focus:ring-brand-600", className)} {...p}>
        <option value="">{placeholder}</option>{options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-700" />
      </span>
    </label>
  );
}
