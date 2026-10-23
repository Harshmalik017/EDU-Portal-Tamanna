import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" };
export function Button({ variant = "primary", className, ...p }: Props) {
  return <button className={clsx(variant === "primary" ? "clay-btn" : "clay-btn-soft", className)} {...p} />;
}
