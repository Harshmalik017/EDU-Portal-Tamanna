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
        <p className="mt-2 text-sm">{ready ? "Supabase keys found." : "No keys found, so the app is in demo mode. Add keys to use real data."}</p>
        {!ready && <Link href="/admin" className="clay-btn mt-4">Open the demo</Link>}
        {ready && !sp.step && <Link href="/login" className="clay-btn mt-4">Continue to login</Link>}
      </Card>
      <Card className="space-y-3 text-sm">
        <h2 className="text-lg font-extrabold">1. Add your keys</h2>
        <p>In Supabase open Project Settings, then API. Copy the Project URL and the anon public key into the file <b>.env.local</b> in the project folder (npm run dev creates it for you).</p>
        <Code>{"NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."}</Code>
        <p>Then stop the server (Ctrl+C) and run <b>npm run dev</b> again. Next.js reads this file only at start.</p>
      </Card>
      <Card className={`space-y-3 text-sm ${sp.step === "database" ? "ring-4 ring-amber-400" : ""}`}>
        <h2 className="text-lg font-extrabold">2. Create the database</h2>
        {sp.step === "database" && <p className="font-bold text-amber-800">The database is not ready. Run the SQL below.</p>}
        <p>In Supabase open SQL Editor, paste the whole file <b>supabase/schema.sql</b> and run it. It is safe to run again.</p>
      </Card>
      <Card className="space-y-3 text-sm">
        <h2 className="text-lg font-extrabold">3. Create your admin login</h2>
        <p>Open Authentication, then Users, and add a user with your email and a password. Turn off public sign-ups. Then run this in the SQL Editor with your email:</p>
        <Code>{"insert into admins (user_id)\nselect id from auth.users where email = 'you@school.org';"}</Code>
      </Card>
    </main>
  );
}
