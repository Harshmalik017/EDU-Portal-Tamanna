"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { isDemo } from "@/lib/supabase/env";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";

export function LoginForm({ denied }: { denied?: boolean }) {
  const router = useRouter();
  const toast = useToast();
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
  async function forgot() {
    if (!email) return setError("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` });
    toast(error ? "Could not send the email." : "Reset link sent.");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <Image src="/brand/logo.png" alt="Tamanna" width={170} height={36} className="mx-auto mb-4" priority />
        <h1 className="mb-6 text-center text-2xl font-extrabold">Admin login</h1>
        {isDemo() && <p className="clay-inset mb-4 p-3 text-sm font-semibold">Demo mode: any email and password works.</p>}
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="relative">
            <Input label="Password" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-[38px] p-1">{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          <button type="button" onClick={forgot} className="block w-full text-center text-sm font-bold underline">Forgot password</button>
        </form>
      </Card>
    </main>
  );
}
