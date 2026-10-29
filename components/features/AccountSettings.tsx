"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export function AccountSettings({ email, displayName }: { email: string; displayName: string }) {
  const [name, setName] = useState(displayName);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function save(event: FormEvent<HTMLFormElement>, changePassword: boolean) {
    event.preventDefault();
    if (changePassword && password !== confirmation) return toast("Enter matching new passwords.");
    if (changePassword && password === current) return toast("Enter a different new password.");
    setBusy(true);
    try {
      if (changePassword) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: current });
        if (error) return toast("Could not confirm your current password.");
      }
      const { error } = await supabase.auth.updateUser(changePassword ? { password } : { data: { display_name: name.trim() } });
      if (error) return toast(`Could not update your ${changePassword ? "password" : "profile"}. ${error.message}`);
      if (changePassword) { setCurrent(""); setPassword(""); setConfirmation(""); }
      const { error: logError } = await supabase.rpc("log_account_activity", { p_action: changePassword ? "Password changed" : "Profile updated" });
      if (logError) {
        console.error("Could not record account activity.", logError);
        toast("Could not record the activity log. Your account change was saved.");
      } else toast(changePassword ? "Password changed." : "Profile saved.");
      router.refresh();
    } catch (error) {
      console.error("Could not update account settings.", error);
      toast("Could not update account settings. Check your connection.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <PageHeader title="Profile settings" icon={UserRound} />
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card title="Your profile">
        <form className="space-y-4" onSubmit={(event) => void save(event, false)}>
          <fieldset disabled={busy} className="space-y-4">
            <Input label="Email" type="email" value={email} readOnly autoComplete="username" />
            <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" />
            <Button type="submit">{busy ? "Saving…" : "Save profile"}</Button>
          </fieldset>
        </form>
      </Card>
      <Card title="Change password">
        <form className="space-y-4" onSubmit={(event) => void save(event, true)}>
          <fieldset disabled={busy} className="space-y-4">
            <Input label="Current password" type="password" value={current} onChange={(event) => setCurrent(event.target.value)} required autoComplete="current-password" />
            <Input label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" />
            <Input label="Confirm new password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={12} autoComplete="new-password" />
            <p className="text-sm text-ink/70">At least 12 characters.</p>
            <Button type="submit">{busy ? "Saving…" : "Change password"}</Button>
          </fieldset>
        </form>
      </Card>
    </div>
  </div>;
}
