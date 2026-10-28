"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { loginEmail } from "@/lib/supabase/admin-identity";
import { Button, Card, Input } from "@/components/ui";

export function LoginForm({ denied }: { denied?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(denied ? "This account is not an admin." : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(email), password });
    setBusy(false);
    if (error) setError("Wrong email or password.");
    else { router.push("/admin"); router.refresh(); }
  }
  return (
    <div className="flex min-h-screen flex-col px-4 sm:px-6 lg:px-10">
      <header className="clay sticky top-3 z-30 -mx-1 flex min-h-16 shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <Link href="/" aria-label="Tamanna Uttar Pradesh home" className="flex shrink-0 flex-col items-start">
          <Image src="/brand/logo.png" alt="Tamanna" width={120} height={26} priority />
          <span className="text-[10px] font-semibold leading-none text-brand-700">Uttar Pradesh</span>
        </Link>
        <Link href="/" className="clay-btn-soft !min-h-10 !px-3 !py-2">
          <ArrowLeft size={17} aria-hidden="true" /> Home
        </Link>
      </header>
      <main className="grid flex-1 place-items-center py-8">
        <Card className="w-full max-w-md">
          <h1 className="mb-6 text-center text-2xl font-extrabold">Admin login</h1>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Username or email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <Input label="Password" autoComplete="current-password" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-[38px] p-1">{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
            {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
            <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Login"}</Button>
          </form>
        </Card>
      </main>
      <footer className="-mx-4 mt-8 space-y-3 border-t border-(--line) px-4 py-5 sm:px-6 lg:px-10">
        <div className="clay-inset px-5 py-3.5 text-center text-sm">
          Tamanna is an NCERT programme. All scores and reports follow the Guide for Teachers and Parents.
        </div>
        <p className="text-center text-sm">
          © 2026 <a href="https://www.linkedin.com/in/harshmalik017" target="_blank" rel="noopener noreferrer" className="font-bold underline">Developer Details</a>, All Rights Reserved.
        </p>
        <p className="text-center text-xs font-semibold text-ink/80">Tamanna Portal v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </footer>
    </div>
  );
}
