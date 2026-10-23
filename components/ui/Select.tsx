import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[]; placeholder?: string };
export function Select({ label, options, placeholder = "Select", className, ...p }: Props) {
  return (
    <label className="block text-sm font-semibold">{label}
      <select className={clsx("clay-inset mt-1 w-full px-4 py-3 outline-hidden focus:ring-2 focus:ring-brand-600", className)} {...p}>
        <option value="">{placeholder}</option>{options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}
