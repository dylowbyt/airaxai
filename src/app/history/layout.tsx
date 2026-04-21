import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";

export default async function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <DashboardSidebar userRole={profile?.user_role ?? "user"} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader title="Riwayat" userEmail={user.email} userAvatar={user.user_metadata?.avatar_url ?? null} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
