import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadSheetFiles(client: SupabaseClient, files: { path: string; file: File | Blob }[], onUploaded?: (path: string) => void) {
  for (const { path, file } of files) {
    const contentType = file.type || undefined;
    const { error } = await client.storage.from("sheets").upload(path, file, { contentType });
    if (error) throw new Error(`Could not upload ${path.split("/").at(-1) ?? "the OMR file"}.`, { cause: error });
    onUploaded?.(path);
  }
}

export async function removeSheetFiles(client: SupabaseClient, paths: string[]) {
  if (!paths.length) return;
  const { error } = await client.storage.from("sheets").remove(paths);
  if (error) throw new Error("Could not remove the OMR files.", { cause: error });
}
