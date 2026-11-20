import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "title"> & { title?: string; description?: string; actions?: ReactNode; titleLevel?: 2 | 3 };

/** Surface with an optional header (title, description, actions). */
export function Card({ className, title, description, actions, titleLevel = 2, children, ...p }: Props) {
  const Title = titleLevel === 3 ? "h3" : "h2";
  return (
    <div className={clsx("clay p-5 sm:p-6", className)} {...p}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>{title && <Title className="text-lg font-bold">{title}</Title>}{description && <p className="mt-0.5 text-sm text-ink/80">{description}</p>}</div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
