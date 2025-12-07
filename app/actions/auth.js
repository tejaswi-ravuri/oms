"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(email, password) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user?.email_confirmed_at) {
    return { error: "Please verify your email address before signing in." };
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" };
  }

  if (profile.user_status !== "Active") {
    return {
      error:
        profile.user_status === "Suspended"
          ? "Your account has been suspended. Please contact admin."
          : "Your account is inactive. Please contact admin.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
