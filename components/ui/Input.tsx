import clsx from "clsx";
import type { InputHTMLAttributes } from "react";
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; hideLabel?: boolean };
export function Input({ label, hideLabel = false, className, id, ...p }: Props) {
  const key = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={key} className="block text-sm font-semibold">
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <input id={key} className={clsx("clay-inset w-full px-4 py-3 outline-hidden focus:ring-2 focus:ring-brand-600", !hideLabel && "mt-1", className)} {...p} />
    </label>
  );
}
