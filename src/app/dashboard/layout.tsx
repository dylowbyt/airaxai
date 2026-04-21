import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
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

  // Fetch user role from profiles table
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
          userEmail={user.email}
          userAvatar={user.user_metadata?.avatar_url ?? null}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
