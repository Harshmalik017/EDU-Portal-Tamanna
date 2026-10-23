import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "title"> & { title?: string; description?: string; actions?: ReactNode };

/** Surface with an optional header (title, description, actions). */
export function Card({ className, title, description, actions, children, ...p }: Props) {
  return (
    <div className={clsx("clay p-5 sm:p-6", className)} {...p}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>{title && <h2 className="text-lg font-bold">{title}</h2>}{description && <p className="mt-0.5 text-sm text-ink/80">{description}</p>}</div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
