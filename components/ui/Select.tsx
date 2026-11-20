import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[]; placeholder?: string; hideLabel?: boolean; description?: string; error?: string };
export function Select({ label, options, placeholder = "Select", hideLabel = false, description, error, className, id, name, autoComplete = "off", ...p }: Props) {
  const generatedId = useId();
  const key = id ?? generatedId;
  const descriptionId = description ? `${key}-description` : undefined;
  const errorId = error ? `${key}-error` : undefined;
  const describedBy = [p["aria-describedby"], descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <label htmlFor={key} className="block text-sm font-semibold"><span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <span className={clsx("relative block", !hideLabel && "mt-1")}>
      <select
        id={key}
        name={name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
        autoComplete={autoComplete}
        aria-invalid={error ? true : p["aria-invalid"]}
        aria-describedby={describedBy}
        className={clsx("clay-inset min-h-11 w-full appearance-none py-3 pl-4 pr-10 outline-hidden focus-visible:ring-2 focus-visible:ring-brand-600", error && "border-red-500", className)}
        {...p}
      >
        <option value="">{placeholder}</option>{options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-700" />
      </span>
      {description && <span id={descriptionId} className="mt-1 block text-xs font-normal text-ink/70">{description}</span>}
      {error && <span id={errorId} role="alert" className="mt-1 block text-xs font-semibold text-red-800">{error}</span>}
    </label>
  );
}
