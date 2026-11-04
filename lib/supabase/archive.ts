import type { SupabaseClient } from "@supabase/supabase-js";

type Purge = { id: string; token: string; paths: string[] };
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function isPurge(value: unknown): value is Purge {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && uuid.test(record.id)
    && typeof record.token === "string" && uuid.test(record.token)
    && Array.isArray(record.paths) && record.paths.every((path: unknown) =>
      typeof path === "string" && path.startsWith(`${record.id}/`) && !path.split("/").includes(".."));
}

export async function purgeArchivedStudents(client: SupabaseClient): Promise<number> {
  let deleted = 0;
  let failed = 0;
  for (;;) {
    const { data, error } = await client.rpc("claim_student_purges", { p_limit: 25 });
    if (error) throw new Error("Could not claim archived students for deletion.", { cause: error });
    if (!Array.isArray(data) || !data.every(isPurge)) throw new Error("Could not delete archived students: invalid cleanup response.");
    if (!data.length) break;
    for (const student of data) {
      try {
        for (let i = 0; i < student.paths.length; i += 100) {
          const { error: storageError } = await client.storage.from("sheets").remove(student.paths.slice(i, i + 100));
          if (storageError) throw new Error("Could not delete archived student files.", { cause: storageError });
        }
        const { error: deleteError } = await client.rpc("finish_student_purge", { p_id: student.id, p_token: student.token });
        if (deleteError) throw new Error("Could not finish archived student deletion.", { cause: deleteError });
        deleted++;
      } catch (failure) {
        failed++;
        console.error("Could not purge an archived student.", failure);
      }
    }
  }
  if (failed) throw new Error(`Could not delete ${failed} archived students. ${deleted} deleted; failed records remain archived for retry.`);
  return deleted;
}
