import { createServer } from "@/lib/supabase/server";
import { ResultsTable } from "@/components/features/ResultsTable";
import type { Key, Student } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";
import { isDemo } from "@/lib/supabase/env";
import { getKey } from "@/lib/supabase/data";

export default async function Page() {
  const sb = await createServer();
  const [{ data, error: studentsError }, { data: { user } }, answerKey] = await Promise.all([
    sb.from("students").select("id,name,class,school,gender,excluded,verification_status,manual_scores,scores(test_code,correct)"),
    sb.auth.getUser(),
    isDemo() ? Promise.resolve({} as Key) : getKey(),
  ]);
  if (studentsError) throw new Error("Could not load student reports.", { cause: studentsError });
  const students = (data ?? []) as unknown as Student[];
  const omrSheets: Record<string, { originals: { label: string; url: string }[]; responses: PageResult; pdfUrl?: string }> = {};
  if (isDemo() && students.length) {
    const { data: submissions, error: submissionsError } = await sb.from("submissions")
      .select("student_id,image_paths,responses,created_at")
      .order("created_at", { ascending: false });
    if (submissionsError) throw new Error("Could not load demo OMR sheets.", { cause: submissionsError });
    for (const submission of submissions ?? []) {
      if (omrSheets[submission.student_id]) continue;
      const paths: string[] = submission.image_paths ?? [];
      const pdfPath = paths.find((path) => /\.pdf$/i.test(path));
      omrSheets[submission.student_id] = {
        responses: (submission.responses ?? {}) as PageResult,
        originals: paths.filter((path) => /\.(jpe?g|png)$/i.test(path)).map((path, index) => ({ label: `Page ${index + 1}`, url: `/${path}` })),
        pdfUrl: pdfPath ? `/${pdfPath}` : undefined,
      };
    }
  } else if (students.length) {
    const { data: submissions, error: submissionsError } = await sb.from("submissions")
      .select("student_id,image_paths,responses,created_at")
      .in("student_id", students.map((student) => student.id))
      .order("created_at", { ascending: false });
    if (submissionsError) throw new Error("Could not load OMR sheets.", { cause: submissionsError });
    const latest = new Map<string, { image_paths: string[] | null; responses: PageResult | null }>();
    for (const submission of submissions ?? []) {
      if (!latest.has(submission.student_id)) latest.set(submission.student_id, submission);
    }
    const records = Array.from(latest, ([studentId, submission]) => ({
      studentId,
      responses: (submission.responses ?? {}) as PageResult,
      paths: submission.image_paths ?? [],
    }));
    const allPaths = records.flatMap((record) => record.paths);
    const { data: signed, error: signedError } = allPaths.length
      ? await sb.storage.from("sheets").createSignedUrls(allPaths, 3600)
      : { data: [], error: null };
    if (signedError) throw new Error("Could not load OMR sheet images.", { cause: signedError });
    const urls = new Map((signed ?? []).filter((file) => file.path && file.signedUrl).map((file) => [file.path!, file.signedUrl!]));
    for (const record of records) {
      const imagePaths = record.paths.filter((path) => /\.(jpe?g|png)$/i.test(path));
      const pdfPath = record.paths.find((path) => /\.pdf$/i.test(path));
      omrSheets[record.studentId] = {
        responses: record.responses,
        originals: imagePaths.map((path, index) => ({ label: `Page ${index + 1}`, url: urls.get(path) })).filter((page): page is { label: string; url: string } => !!page.url),
        pdfUrl: pdfPath ? urls.get(pdfPath) : undefined,
      };
    }
  }
  return (
    <ResultsTable rows={students} email={user?.email ?? "admin"} answerKey={answerKey} omrSheets={omrSheets} />
  );
}
