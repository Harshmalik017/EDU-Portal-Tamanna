import { notFound } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { StudentView } from "@/components/features/StudentView";
import type { Student } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";
import { getKey } from "@/lib/supabase/data";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createServer();
  const [{ data: s }, { data: { user } }, answerKey] = await Promise.all([
    sb.from("students").select("*,scores(*)").eq("id", id).maybeSingle(),
    sb.auth.getUser(),
    getKey(),
  ]);
  if (!s) notFound();
  const { data: sub, error: submissionError } = await sb.from("submissions").select("image_paths,responses").eq("student_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (submissionError) throw new Error("Could not load student submissions.", { cause: submissionError });
  const paths: string[] = sub?.image_paths ?? [];
  const { data: signed, error: signedError } = paths.length ? await sb.storage.from("sheets").createSignedUrls(paths, 3600) : { data: [], error: null };
  if (signedError) throw new Error("Could not load student files.", { cause: signedError });
  const imagePaths = new Set(paths.filter((path) => /\.(jpe?g|png)$/i.test(path)));
  const imgs = (signed ?? []).filter((file) => file.path && imagePaths.has(file.path)).map((file) => file.signedUrl).filter((url): url is string => !!url);
  const pdfPath = paths.find((path) => /\.pdf$/i.test(path));
  const pdfUrl = (signed ?? []).find((file) => file.path === pdfPath)?.signedUrl ?? null;
  return <StudentView initial={s as unknown as Student} imgs={imgs} pdfUrl={pdfUrl} filePaths={paths} responses={(sub?.responses ?? null) as PageResult | null} answerKey={answerKey} email={user?.email ?? "admin"} />;
}
