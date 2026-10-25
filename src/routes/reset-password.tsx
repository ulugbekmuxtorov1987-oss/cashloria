import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/finly/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password — Cashloria" },
      { name: "description", content: "Choose a new password for your Cashloria account." },
      { property: "og:title", content: "Reset Password — Cashloria" },
      { property: "og:description", content: "Choose a new password for your Cashloria account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery session can arrive after mount (token exchange from the
    // email link), so listen for auth events as well as checking once.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in.");
      navigate({ to: "/profile", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to Cashloria
        </Link>
        <BrandMark size={40} className="mt-4" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">Set a new password</h1>
        {!ready ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Open this page from the reset link in your email to continue.
          </p>
        ) : null}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirm password</Label>
            <Input id="pw2" type="password" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !ready}>
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
