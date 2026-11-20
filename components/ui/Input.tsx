import clsx from "clsx";
import { useId } from "react";
import type { InputHTMLAttributes } from "react";
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; hideLabel?: boolean; description?: string; error?: string };
export function Input({ label, hideLabel = false, description, error, className, id, name, autoComplete = "off", ...p }: Props) {
  const generatedId = useId();
  const key = id ?? generatedId;
  const descriptionId = description ? `${key}-description` : undefined;
  const errorId = error ? `${key}-error` : undefined;
  const describedBy = [p["aria-describedby"], descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <label htmlFor={key} className="block text-sm font-semibold">
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <input
        id={key}
        name={name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
        autoComplete={autoComplete}
        aria-invalid={error ? true : p["aria-invalid"]}
        aria-describedby={describedBy}
        className={clsx("clay-inset w-full px-4 py-3 outline-hidden focus-visible:ring-2 focus-visible:ring-brand-600", !hideLabel && "mt-1", error && "border-red-500", className)}
        {...p}
      />
      {description && <span id={descriptionId} className="mt-1 block text-xs font-normal text-ink/70">{description}</span>}
      {error && <span id={errorId} role="alert" className="mt-1 block text-xs font-semibold text-red-800">{error}</span>}
    </label>
  );
}
