import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BACKUP_KEYS, parseBackup, type Backup } from "@/lib/finly/backup";

function read(key: string) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}

export function DataControls() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: Backup; lessons: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function exportData() {
    const backup: Backup = { app: "finly", version: 1, exportedAt: new Date().toISOString(), progress: read(BACKUP_KEYS.progress), plan: read(BACKUP_KEYS.plan) };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `finly-backup-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.size > 512_000) { setError("That file is too large to be a Finly backup."); return; }
    const res = parseBackup(await file.text());
    if (!res.ok) { setError(res.error); return; }
    setPending({ data: res.data, lessons: res.lessonCount });
  }

  function confirmImport() {
    if (!pending) return;
    try {
      if (pending.data.progress) localStorage.setItem(BACKUP_KEYS.progress, JSON.stringify(pending.data.progress));
      if (pending.data.plan) localStorage.setItem(BACKUP_KEYS.plan, JSON.stringify(pending.data.plan));
      toast.success("Backup restored. Reloading…");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      setError("Your browser blocked saving. Nothing was changed.");
    }
    setPending(null);
  }

  return (
    <section aria-labelledby="data-heading" className="rounded-lg border border-border bg-card p-5">
      <h2 id="data-heading" className="font-display text-lg font-bold">Your data</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Your plan answers stay in this browser only.</li>
        <li>Lesson progress is saved in this browser; when you are signed in it is also synced privately to your account.</li>
        <li>Calculator numbers are never saved or sent anywhere.</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={exportData}><Download /> Export backup (JSON)</Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload /> Import backup</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a Finly backup file" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace data on this device?</AlertDialogTitle>
            <AlertDialogDescription>
              This backup contains {pending?.data.progress ? `${pending.lessons} completed lesson${pending.lessons === 1 ? "" : "s"}` : "no progress"}
              {pending?.data.plan ? " and a learning plan" : ""}. It will replace what is stored in this browser. If you are signed in,
              lessons already saved to your account are kept and combined with the backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Replace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
