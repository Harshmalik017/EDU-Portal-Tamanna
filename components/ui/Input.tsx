import clsx from "clsx";
import type { InputHTMLAttributes } from "react";
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };
export function Input({ label, className, id, ...p }: Props) {
  const key = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={key} className="block text-sm font-semibold">
      {label}
      <input id={key} className={clsx("clay-inset mt-1 w-full px-4 py-3 outline-hidden focus:ring-2 focus:ring-brand-600", className)} {...p} />
    </label>
  );
}
