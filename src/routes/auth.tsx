import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/finly/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Cashloria" },
      { name: "description", content: "Sign in to Cashloria to save your progress, XP and streak." },
      { property: "og:title", content: "Sign in — Cashloria" },
      { property: "og:description", content: "Sign in to Cashloria to save your progress, XP and streak." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/profile", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/profile", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/profile", replace: true });
        else toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email) {
      toast.error("Enter your email first, then tap “Forgot password?”");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent — check your email.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to Cashloria
        </Link>
        <BrandMark size={40} className="mt-4" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          {mode === "signin" ? "Welcome back to Cashloria" : "Create your Cashloria account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save your XP, streak and completed lessons across devices.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        {mode === "signin" ? (
          <button
            type="button"
            className="mt-3 w-full text-sm font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => void forgotPassword()}
          >
            Forgot password?
          </button>
        ) : null}

        <button
          type="button"
          className="mt-4 w-full text-sm font-semibold text-primary"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>

        <Link
          to="/learn"
          className="mt-4 block text-center text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Continue as guest
        </Link>
      </div>
    </main>
  );
}
