import { envReady } from "@/lib/supabase/env";
import type { Query } from "@/lib/demo/builder";
import { execDemo } from "@/lib/demo/exec";
import { resetDb } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

/** Demo data endpoint. Switched off (404) as soon as real Supabase keys are configured. */
export async function POST(req: Request) {
  if (envReady()) return new Response("Not found", { status: 404 });
  const body = await req.json();
  if (body?.reset) { resetDb(); return Response.json({ ok: true }); }
  return Response.json(await execDemo(body as Query));
}
