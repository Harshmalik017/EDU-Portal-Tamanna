/** True only when real Supabase keys are present (not missing, not the .env.example placeholders). */
export function envReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = publicKey();
  return /^https?:\/\//.test(url) && !url.includes("YOUR-PROJECT") && key.length > 20 &&
    !key.includes("your-anon-key") && !key.includes("your-public-publishable-key");
}

export function publicKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}
