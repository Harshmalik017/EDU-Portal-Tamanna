"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { isDemo } from "@/lib/supabase/env";
import { Button, Card, Input } from "@/components/ui";

export function LoginForm({ denied }: { denied?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(isDemo() ? "demo@tamanna.local" : "");
  const [password, setPassword] = useState(isDemo() ? "demo" : "");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(denied ? "This account is not an admin." : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError("Wrong email or password.");
    else { router.push("/admin"); router.refresh(); }
  }
  return (
    <div className="flex min-h-screen flex-col px-4">
      <header className="-mx-4 flex h-14 shrink-0 items-center border-b border-(--line) bg-[#f9fbf2]/90 px-4 backdrop-blur">
        <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">Home</Link>
      </header>
      <main className="grid flex-1 place-items-center py-8">
        <Card className="w-full max-w-md">
          <div className="mb-4 flex flex-col items-center">
            <Image src="/brand/logo.png" alt="Tamanna" width={170} height={36} priority />
            <span className="text-xs font-semibold text-brand-700">Uttar Pradesh</span>
          </div>
          <h1 className="mb-6 text-center text-2xl font-extrabold">Admin login</h1>
          {isDemo() && <p className="clay-inset mb-4 animate-pulse p-3 text-sm font-semibold">Demo mode: any email and password works.</p>}
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <Input label="Password" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-[38px] p-1">{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
            {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
            <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Login"}</Button>
          </form>
        </Card>
      </main>
      <footer className="-mx-4 flex min-h-14 shrink-0 items-center justify-center border-t border-(--line) py-3">
        <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">Home</Link>
      </footer>
    </div>
  );
}
