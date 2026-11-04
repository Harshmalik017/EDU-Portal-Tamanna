import type { SupabaseClient } from "@supabase/supabase-js";
import type { readReplacement } from "@/lib/omr/reader";
import type { StudentSheet } from "@/lib/types";

export async function replaceSheet(supabase: SupabaseClient, studentId: string, previous: StudentSheet, replacement: Awaited<ReturnType<typeof readReplacement>>) {
  const folder = `${studentId}/${crypto.randomUUID()}`;
  const images = replacement.pages.map((file, index) => ({ path: `${folder}/side-${index + 1}.jpg`, file }));
  const pdfPath = replacement.archive ? `${folder}/answer-sheet.pdf` : null;
  const files = [...images, ...(replacement.archive && pdfPath ? [{ path: pdfPath, file: replacement.archive }] : [])];
  const uploaded: string[] = [];
  let committed = false;
  let saving = false;
  try {
    for (const { path, file } of files) {
      const { error } = await supabase.storage.from("sheets").upload(path, file, { contentType: file.type });
      if (error) throw new Error(`Could not upload the replacement OMR. ${error.message}`);
      uploaded.push(path);
    }
    const source = replacement.archive ?? new Blob(replacement.pages);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await source.arrayBuffer())), (byte) => byte.toString(16).padStart(2, "0")).join("");
    saving = true;
    const { data, error } = await supabase.rpc("replace_copy", {
      p_student_id: studentId, p_submission_id: previous.submissionId,
      p_expected_responses: previous.responses, p_expected_images: previous.imagePaths, p_expected_pdf: previous.pdfPath,
      p_expected_key_hash: previous.keyHash, p_responses: replacement.responses,
      p_image_paths: images.map((image) => image.path), p_pdf_path: pdfPath, p_source_hash: hash, p_issues: replacement.issues,
    });
    if (error) throw new Error(`Could not replace the OMR. ${error.message}`);
    committed = true;
    if (data !== "scored" && data !== "review" && data !== "excluded") throw new Error("Could not verify the replacement OMR result. Refresh before trying again.");
    return data;
  } catch (error) {
    if (committed) throw error;
    if (saving) {
      const { data: current, error: readError } = await supabase.from("submissions").select("image_paths").eq("student_id", studentId)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
      if (readError || images.some((image) => current?.image_paths?.includes(image.path))) {
        throw new Error("Could not confirm the replacement result. Reopen the OMR sheet before trying again.", { cause: error });
      }
    }
    if (uploaded.length) {
      const { error: cleanupError } = await supabase.storage.from("sheets").remove(uploaded);
      if (cleanupError) {
        console.error("Could not clean up replacement uploads.", cleanupError);
        throw new Error("Could not replace the OMR or remove the incomplete upload. Refresh and contact the administrator.", { cause: error });
      }
    }
    throw error;
  }
}
