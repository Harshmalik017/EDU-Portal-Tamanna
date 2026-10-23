/** True only when real Supabase keys are present (not missing, not the .env.example placeholders). */
export function envReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return /^https?:\/\//.test(url) && !url.includes("YOUR-PROJECT") && key.length > 20 && !key.includes("your-anon-key");
}

/** Demo mode: no real database is connected, so the app runs on built-in sample data. */
export const isDemo = () => !envReady();
