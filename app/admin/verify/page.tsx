import Link from "next/link";
import { createServer } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { VerifyBatch, type VerifyItem } from "@/components/features/VerifyBatch";

/** Cross-verification: re-score a batch of 10-20 sheets by hand with the booklet's scoring key and compare. */
export default async function Page({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const sp = await searchParams;
  const n = Math.min(20, Math.max(10, Number(sp.n) || 15));
  const sb = await createServer();
  const { data: { user } } = await sb.auth.getUser();
  const q = () => sb.from("students").select("id", { count: "exact", head: true }).eq("verification_status", "pending").eq("excluded", false);
  const [{ data }, { count }] = await Promise.all([
    sb.from("students").select("id,name,class,gender,school,scores(test_code,correct),submissions(image_paths)").eq("verification_status", "pending").eq("excluded", false).order("created_at").limit(n),
    q(),
  ]);
  const rows = (data ?? []) as unknown as (VerifyItem & { submissions: { image_paths: string[] | null }[] })[];
  const paths = rows.flatMap((r) => r.submissions?.[0]?.image_paths ?? []);
  const signed = paths.length ? (await sb.storage.from("sheets").createSignedUrls(paths, 3600)).data ?? [] : [];
  const url = new Map(signed.map((x) => [x.path, x.signedUrl]));
  const items: VerifyItem[] = rows.map((r) => ({ ...r, imgs: (r.submissions?.[0]?.image_paths ?? []).map((p) => url.get(p) ?? "").filter(Boolean) }));
  return (
    <div className="space-y-5">
      <PageHeader title="Cross-verify a batch" />
      <Card>
        
        <p className="mt-2 text-sm">Score each sheet by hand, enter the 7 scores, and the app compares. {count ?? 0} waiting.</p>
        <p className="mt-2 flex gap-2 text-sm font-semibold">Batch size: {[10, 15, 20].map((v) => <Link key={v} href={`/admin/verify?n=${v}`} className={`underline ${v === n ? "font-extrabold" : ""}`}>{v}</Link>)}</p>
      </Card>
      {items.length ? <VerifyBatch items={items} email={user?.email ?? "admin"} /> : <Card className="text-center">Nothing to verify.</Card>}
    </div>
  );
}
