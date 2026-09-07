import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/finly/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/finly/account";
import { useTheme, type Theme } from "@/lib/theme";
import { deleteMyAccount } from "@/lib/account.functions";
import { useProgress } from "@/lib/finly/progress";
import type { CountryCode, LanguageCode } from "@/lib/finly/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — Finly" },
      { name: "description", content: "Manage your Finly theme, language, password and account." },
      { property: "og:title", content: "Account Settings — Finly" },
      { property: "og:description", content: "Theme, language, password and account controls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const THEMES: { value: Theme; label: string; emoji: string }[] = [
  { value: "light", label: "Light", emoji: "☀️" },
  { value: "dark", label: "Dark", emoji: "🌙" },
  { value: "system", label: "System", emoji: "🖥️" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const profile = useProfile(user?.id).data;
  const { theme, setTheme } = useTheme();
  const { state, setCountry, setLanguage } = useProgress();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    const email = user?.email ?? profile?.email;
    if (!email) {
      toast.error("No email on this account");
      return;
    }
    setBusy(true);
    try {
      // Verify the current password for real: re-authenticate first.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        toast.error("Current password is incorrect");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    const email = user?.email ?? profile?.email;
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email.");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function removeAccount() {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted.");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Appearance, learning preferences and account security.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose how Finly looks. Saved on this device.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  theme === t.value
                    ? "border-primary bg-primary-soft text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="mr-2">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Learning preferences</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={state.country} onValueChange={(v) => setCountry(v as CountryCode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">🇺🇸 United States</SelectItem>
                  <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="UZ">🇺🇿 Uzbekistan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={state.language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru" disabled>Русский (soon)</SelectItem>
                  <SelectItem value="uz" disabled>Oʻzbekcha (soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Password</h2>
          <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3 flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
              <Button type="button" variant="outline" onClick={sendReset}>
                Email me a reset link
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {profile?.email ?? user?.email}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to="/profile">Edit profile</Link></Button>
            <Button variant="outline" onClick={signOut}>Log out</Button>
          </div>
        </section>

        <section className="rounded-2xl border border-destructive/40 bg-card p-5">
          <h2 className="font-display text-xl font-bold text-destructive">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting your account permanently removes your profile, saved progress and avatar. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4" disabled={deleting}>
                {deleting ? "Deleting…" : "Delete my account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your Finly account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your profile, cloud progress and avatar. You can't undo this.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={removeAccount}>Delete account</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </AppShell>
  );
}
