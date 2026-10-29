import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createServer } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";

const CATEGORIES = { scans: "Scans", scoring: "Scoring", students: "Student profiles", answer_key: "Answer key", settings: "Portal settings", account: "Account" };
const PAGE_SIZE = 25;

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const params = await searchParams;
  const category = params.category && Object.hasOwn(CATEGORIES, params.category) ? params.category as keyof typeof CATEGORIES : "";
  const number = Number(params.page ?? "1");
  const page = Number.isSafeInteger(number) && number > 0 ? number : 1;
  const href = (value: number, filter = category) => `/admin/logs?${new URLSearchParams({ ...(filter ? { category: filter } : {}), page: String(value) })}`;
  const sb = await createServer();
  let countQuery = sb.from("activity_logs").select("id", { count: "exact", head: true });
  if (category) countQuery = countQuery.eq("category", category);
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error("Could not count activity logs.", { cause: countError });
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) redirect(href(pages));
  let query = sb.from("activity_logs").select("id,created_at,category,action,actor_email,detail");
  if (category) query = query.eq("category", category);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Could not load activity logs.", { cause: error });
  return <div className="space-y-6">
    <PageHeader title="Activity logs" icon={FileText} />
    <Card>
      <nav aria-label="Log categories" className="mb-5 flex flex-wrap gap-2">
        <Link prefetch={false} aria-current={!category ? "page" : undefined} href="/admin/logs" className={!category ? "clay-btn" : "clay-btn-soft"}>All activity</Link>
        {Object.entries(CATEGORIES).map(([key, label]) => <Link prefetch={false} key={key} href={href(1, key as keyof typeof CATEGORIES)} aria-current={category === key ? "page" : undefined} className={category === key ? "clay-btn" : "clay-btn-soft"}>{label}</Link>)}
      </nav>
      <p className="mb-3 text-sm font-semibold">{total ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} events` : "No activity in this category."}</p>
      {!!data?.length && <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-brand-100"><tr>{["Time", "Category", "Activity", "Account", "Details"].map((label) => <th scope="col" key={label} className="px-3 py-3">{label}</th>)}</tr></thead>
          <tbody>{data.map((row) => <tr key={row.id} className="border-b border-(--line)">
            <td className="whitespace-nowrap px-3 py-3"><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</time></td>
            <td className="px-3 py-3">{CATEGORIES[row.category as keyof typeof CATEGORIES]}</td>
            <td className="px-3 py-3 font-semibold">{row.action}</td>
            <td className="px-3 py-3">{row.actor_email ?? "Import / system"}</td>
            <td className="px-3 py-3">{row.detail ?? "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      <nav aria-label="Log pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {page > 1 ? <Link prefetch={false} className="clay-btn-soft" href={href(page - 1)}>Previous</Link> : <span className="clay-btn-soft opacity-50" aria-disabled="true">Previous</span>}
        <span className="text-sm font-semibold">Page {page} of {pages}</span>
        {page < pages ? <Link prefetch={false} className="clay-btn-soft" href={href(page + 1)}>Next</Link> : <span className="clay-btn-soft opacity-50" aria-disabled="true">Next</span>}
      </nav>
    </Card>
  </div>;
}
