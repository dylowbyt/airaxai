import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Coba update profil yang sudah ada
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ user_role: "admin", tokens: 50 })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Verifikasi apakah benar-benar terupdate
  const { data: checkProfile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", user.id)
    .single();

  if (!checkProfile) {
    return NextResponse.json({ 
      error: "Profil tidak ditemukan di database. Silakan LOGOUT lalu LOGIN kembali dengan Google agar sistem membuatkan profil untuk Anda secara otomatis." 
    });
  }

  return NextResponse.json({ 
    success: true, 
    role: checkProfile.user_role,
    message: "Berhasil! Anda sekarang adalah Admin. Silakan kembali ke http://localhost:3000/dashboard dan refresh." 
  });
}
