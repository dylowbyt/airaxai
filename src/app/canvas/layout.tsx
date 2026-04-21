import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";

export default async function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.user_role ?? "user";

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <DashboardSidebar userRole={userRole} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader
          title="Infinity Canvas"
          userEmail={user.email}
          userAvatar={user.user_metadata?.avatar_url ?? null}
        />
        {/* Do not add padding here so Canvas takes full width/height */}
        <main className="flex-1 overflow-hidden relative">{children}</main>
      </div>
    </div>
  );
}
