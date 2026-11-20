"use client";
import { Button } from "./Button";

export function Pagination({ page, pages, onPage, label = "Results" }: { page: number; pages: number; onPage: (page: number) => void; label?: string }) {
  return <nav aria-label={`${label} pagination`} className="flex items-center justify-between gap-3">
    <Button variant="soft" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
    <span className="text-sm font-semibold">Page {page + 1} of {pages}</span>
    <Button variant="soft" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</Button>
  </nav>;
}
