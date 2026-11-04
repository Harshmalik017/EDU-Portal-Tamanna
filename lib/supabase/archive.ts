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

async function purgeBatch(client: SupabaseClient, students: Purge[], releaseForRetry: boolean): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  for (const student of students) {
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
      if (releaseForRetry) {
        const { error: releaseError } = await client.rpc("release_student_purge", { p_id: student.id, p_token: student.token });
        if (releaseError) console.error("Could not release the failed deletion for retry.", releaseError);
      }
    }
  }
  return { deleted, failed };
}

export async function deleteArchivedStudents(client: SupabaseClient, ids: string[]): Promise<number> {
  if (!ids.length || ids.length > 10000 || new Set(ids).size !== ids.length || !ids.every((id) => uuid.test(id))) throw new Error("Could not delete: select valid archived students.");
  const { data, error } = await client.rpc("claim_selected_student_purges", { p_ids: ids });
  if (error) throw new Error(`Could not delete archived students. ${error.message}`, { cause: error });
  if (!Array.isArray(data) || data.length !== ids.length || !data.every(isPurge)
    || new Set(data.map((student) => student.id)).size !== ids.length || !data.every((student) => ids.includes(student.id))) {
    throw new Error("Could not delete archived students: invalid cleanup response.");
  }
  const { deleted, failed } = await purgeBatch(client, data, true);
  if (failed) throw new Error(`Could not delete ${failed} archived student${failed === 1 ? "" : "s"}. ${deleted} deleted. Retry the remaining archived students; restoration is disabled once deletion starts.`);
  return deleted;
}

export async function purgeArchivedStudents(client: SupabaseClient): Promise<number> {
  let deleted = 0;
  let failed = 0;
  for (;;) {
    const { data, error } = await client.rpc("claim_student_purges", { p_limit: 25 });
    if (error) throw new Error("Could not claim archived students for deletion.", { cause: error });
    if (!Array.isArray(data) || !data.every(isPurge)) throw new Error("Could not delete archived students: invalid cleanup response.");
    if (!data.length) break;
    const result = await purgeBatch(client, data, false);
    deleted += result.deleted; failed += result.failed;
  }
  if (failed) throw new Error(`Could not delete ${failed} archived students. ${deleted} deleted; failed records remain archived for retry.`);
  return deleted;
}
