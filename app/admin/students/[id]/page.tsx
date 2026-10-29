import { notFound } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { StudentView } from "@/components/features/StudentView";
import type { Student } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";
import { getKey, keyHashOf } from "@/lib/supabase/data";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createServer();
  const [{ data: student, error }, answerKey] = await Promise.all([
    sb.from("students").select("*,scores(*)").eq("id", id).maybeSingle(),
    getKey(),
  ]);
  if (error) throw new Error("Could not load student details.", { cause: error });
  if (!student) notFound();
  const { data: sub, error: subError } = await sb.from("submissions").select("image_paths,pdf_path,responses").eq("student_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (subError) throw new Error("Could not load student submissions.", { cause: subError });
  const paths: string[] = [...new Set<string>([...(sub?.image_paths ?? []), ...(sub?.pdf_path ? [sub.pdf_path] : [])])];
  const { data: signed, error: signedError } = paths.length ? await sb.storage.from("sheets").createSignedUrls(paths, 3600) : { data: [], error: null };
  if (signedError || signed?.some((file) => file.error)) throw new Error("Could not open student files.", { cause: signedError });
  const imgs = (signed ?? []).filter((file) => file.path && /\.(jpe?g|png)$/i.test(file.path)).map((file) => file.signedUrl).filter((url): url is string => !!url);
  const pdfUrl = (signed ?? []).find((file) => file.path && /\.pdf$/i.test(file.path))?.signedUrl ?? null;
  return <StudentView initial={student as unknown as Student} imgs={imgs} pdfUrl={pdfUrl} filePaths={paths} responses={(sub?.responses ?? {}) as PageResult} answerKey={answerKey} keyHash={keyHashOf(answerKey)} />;
}
