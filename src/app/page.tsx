import { DashboardShell } from "@/shared/ui/components/dashboard-shell";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userEmail = user?.email ?? "";

  return <DashboardShell userEmail={userEmail} />;
}
