import { supabase } from "./supabase";
import { ADMIN_EMAIL } from "./config";

export async function assignSuperAdminRole() {
  const { data: userResult, error } = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL);

  if (error || !userResult?.user) {
    console.warn(`Admin user '${ADMIN_EMAIL}' not found. Create it in Supabase Auth then rerun.`);
    return;
  }

  const userId = userResult.user.id;

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });

  if (roleError) {
    console.error("Error assigning admin role:", roleError.message);
  } else {
    console.log(`✅ Assigned 'super_admin' role to ${ADMIN_EMAIL}`);
  }
}
