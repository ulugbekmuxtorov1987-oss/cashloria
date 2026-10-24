import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACHIEVEMENTS } from "@/lib/finly/achievements";
import { rankFor, useProgress } from "@/lib/finly/progress";
import {
  initialsOf,
  uploadAvatar,
  useAvatarUrl,
  useProfile,
  useSession,
  useUpdateProfile,
} from "@/lib/finly/account";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Cashloria" },
      { name: "description", content: "Manage your Cashloria display name, avatar and see your learning stats." },
      { property: "og:title", content: "Your Profile — Cashloria" },
      { property: "og:description", content: "Your Cashloria profile, XP, streak and achievements." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const profileQuery = useProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const profile = profileQuery.data;
  const avatarUrl = useAvatarUrl(profile?.avatar_url).data;
  const { state, stats } = useProgress();
  const rank = rankFor(state.xp);

  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setName(profile.full_name ?? "");
  }, [profile]);

  async function saveName() {
    try {
      await updateProfile.mutateAsync({ full_name: name.trim() || null });
      toast.success("Display name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your name");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(user.id, file);
      await updateProfile.mutateAsync({ avatar_url: path });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    try {
      await updateProfile.mutateAsync({ avatar_url: null });
      toast.success("Avatar removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove avatar");
    }
  }

  const earned = ACHIEVEMENTS.filter((a) => state.achievements.includes(a.id));

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage how you appear in Cashloria and review your learning stats.
          </p>
        </header>

        <section className="card-soft rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-display text-2xl font-bold">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{initialsOf(profile?.full_name, profile?.email ?? user?.email)}</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? "Uploading…" : avatarUrl ? "Replace photo" : "Upload photo"}
                </Button>
                {profile?.avatar_url ? (
                  <Button size="sm" variant="outline" onClick={removeAvatar}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP · up to 4 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFile}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? user?.email ?? ""} disabled />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={saveName} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/settings">Account settings</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Rank", value: `${rank.emoji} ${rank.name}` },
            { label: "XP", value: `⭐ ${state.xp}` },
            { label: "Streak", value: `🔥 ${state.streak.count} days` },
            { label: "Lessons done", value: `${stats.lessonsCompleted}/${stats.totalLessons}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Achievements</h2>
          {earned.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No achievements yet — finish a lesson to earn your first one.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {earned.map((a) => (
                <li key={a.id} className="rounded-xl bg-muted px-3 py-2 text-sm">
                  <span className="font-semibold">{a.emoji} {a.title}</span>
                  <span className="block text-muted-foreground">{a.description}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Disclaimer />
      </div>
    </AppShell>
  );
}
