import Link from "next/link";
import { Card } from "@/components/ui";
import { envReady } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const Code = ({ children }: { children: string }) => <pre className="clay-inset overflow-x-auto p-3 text-sm">{children}</pre>;

export default async function Setup({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const sp = await searchParams;
  const ready = envReady();
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <Card>
        <h1 className="text-2xl font-extrabold">Set up Tamanna Portal</h1>
        <p className="mt-2 text-sm">{ready ? "Supabase keys found." : "No Supabase connection. Add the website settings below."}</p>
        {ready && !sp.step && <Link href="/login" className="clay-btn mt-4">Continue to login</Link>}
      </Card>
      <Card className="space-y-3 text-sm">
        <h2 className="text-lg font-extrabold">1. Add your keys</h2>
        <p>Add the Project URL and publishable key to <b>.env.local</b> locally, or to Vercel Environment Variables when hosting.</p>
        <Code>{"NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key"}</Code>
        <p>Then stop the server (Ctrl+C) and run <b>npm run dev</b> again. Next.js reads this file only at start.</p>
      </Card>
      <Card className={`space-y-3 text-sm ${sp.step === "database" ? "ring-4 ring-amber-400" : ""}`}>
        <h2 className="text-lg font-extrabold">2. Create the database</h2>
        {sp.step === "database" && <p className="font-bold text-amber-800">The database is not ready. Run the SQL below.</p>}
        <p>In Supabase open SQL Editor, paste the whole file <b>supabase/schema.sql</b> and run it. It is safe to run again.</p>
      </Card>
      <Card className="space-y-3 text-sm">
        <h2 className="text-lg font-extrabold">3. Create your admin login</h2>
        <p>Run <b>npm run setup:admin</b> locally. Sign in as <b>admin</b> with the password saved privately in <b>.env.local</b>. Do not add owner keys or this password to Vercel.</p>
      </Card>
    </main>
  );
}
