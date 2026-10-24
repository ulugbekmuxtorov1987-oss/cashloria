import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in user's account and their stored data. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { error: progressError } = await supabaseAdmin.from("user_progress").delete().eq("user_id", userId);
    if (progressError) throw new Error("Could not delete learning progress.");
    const { error: rolesError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    if (rolesError) throw new Error("Could not delete account roles.");
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileError) throw new Error("Could not delete account profile.");

    while (true) {
      const { data: files, error: listError } = await supabaseAdmin.storage.from("avatars").list(userId, { limit: 1000 });
      if (listError) throw new Error("Could not list avatar files.");
      if (files?.length) {
        const { error: removeError } = await supabaseAdmin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
        if (removeError) throw new Error("Could not delete avatar files.");
      }
      if (!files || files.length < 1000) break;
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Could not delete account.");
    return { ok: true };
  });
