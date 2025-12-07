import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileContent } from "@/components/dashboard/profile/profile-content";

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <ProfileContent profile={profile} userId={user.id} />
    </div>
  );
}
