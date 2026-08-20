import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

export function ImageUpload({
  label,
  value,
  onChange,
  folder = "site",
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be smaller than 4 MB");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={`${label} preview`}
            className="h-14 w-14 rounded-xl border border-border object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            none
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 4 MB</p>
    </div>
  );
}
