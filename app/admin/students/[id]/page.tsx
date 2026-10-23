import { notFound } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { StudentView } from "@/components/features/StudentView";
import type { Student } from "@/lib/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createServer();
  const { data: s } = await sb.from("students").select("*,scores(*)").eq("id", id).maybeSingle();
  if (!s) notFound();
  const { data: sub } = await sb.from("submissions").select("image_paths").eq("student_id", id).limit(1).maybeSingle();
  const paths: string[] = sub?.image_paths ?? [];
  const signed = paths.length ? (await sb.storage.from("sheets").createSignedUrls(paths, 3600)).data ?? [] : [];
  return <StudentView initial={s as unknown as Student} imgs={signed.map((x) => x.signedUrl).filter((u): u is string => !!u)} />;
}
