import type { SupabaseClient } from "@supabase/supabase-js";
import type { PageResult } from "@/lib/omr/reader";

export async function reviewSheet(client: SupabaseClient, studentId: string, responses: PageResult, keyHash: string) {
  const { error } = await client.rpc("review_copy", {
    p_student_id: studentId,
    p_responses: responses,
    p_expected_key_hash: keyHash,
  });
  if (error) throw new Error(`Could not score. ${error.message}`, { cause: error });
}
