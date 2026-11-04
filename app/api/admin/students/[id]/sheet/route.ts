import { NextResponse, type NextRequest } from "next/server";
import { createServer, getServerUser } from "@/lib/supabase/server";
import { getKey, getTemplate, keyHashOf } from "@/lib/supabase/data";
import type { StudentSheet } from "@/lib/types";
import type { PageResult } from "@/lib/omr/reader";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
const failure = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return failure("Could not open this student sheet.", 400);
  try {
    const sb = await createServer();
    const { data: { user }, error: authError } = await getServerUser();
    if (authError || !user) return failure("Could not open the sheet. Sign in again.", 401);
    const { data: isAdmin, error: roleError } = await sb.rpc("is_admin");
    if (roleError) throw new Error("Could not check admin access.", { cause: roleError });
    if (!isAdmin) return failure("Could not open the sheet. Admin access is required.", 403);
    const [{ data: student, error }, answerKey, template] = await Promise.all([
      sb.from("students").select("id,submissions(id,image_paths,pdf_path,responses)").eq("id", id).is("archived_at", null)
        .order("created_at", { referencedTable: "submissions", ascending: false }).order("id", { referencedTable: "submissions", ascending: false })
        .limit(1, { referencedTable: "submissions" }).abortSignal(request.signal).maybeSingle(),
      getKey(request.signal),
      getTemplate(request.signal),
    ]);
    if (error) throw new Error("Could not load saved answers.", { cause: error });
    if (!student) return failure("Could not find this active student.", 404);
    const sub = student.submissions[0];
    const paths = [...new Set<string>([...(sub?.image_paths ?? []), ...(sub?.pdf_path ? [sub.pdf_path] : [])])];
    const { data: signed, error: signError } = paths.length ? await sb.storage.from("sheets").createSignedUrls(paths, 3600) : { data: [], error: null };
    if (signError || (paths.length > 0 && signed?.length !== paths.length)) throw new Error("Could not open the original files.", { cause: signError });
    const files = (signed ?? []).map((file) => {
      if (file.error || !file.path || !file.signedUrl) throw new Error("Could not open the original files.");
      return { path: file.path, signedUrl: file.signedUrl };
    });
    const images = files.filter((file) => /\.(jpe?g|png)$/i.test(file.path));
    const sheet: StudentSheet = {
      submissionId: sub?.id ?? null,
      imagePaths: sub?.image_paths ?? [],
      pdfPath: sub?.pdf_path ?? null,
      template,
      originals: images.map((file, i) => ({ label: `Page ${i + 1}`, url: file.signedUrl })),
      pdfUrl: files.find((file) => /\.pdf$/i.test(file.path))?.signedUrl ?? null,
      responses: (sub?.responses ?? {}) as PageResult,
      answerKey,
      keyHash: keyHashOf(answerKey),
    };
    return NextResponse.json(sheet, { headers });
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499, headers });
    console.error("Could not load student sheet.", error);
    return failure("Could not load the student sheet. Try again.", 500);
  }
}
