import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardLayout as Layout } from "@/components/layout/DashboardLayout";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    redirect("/login");
  }

  return <Layout profile={profile}>{children}</Layout>;
}
