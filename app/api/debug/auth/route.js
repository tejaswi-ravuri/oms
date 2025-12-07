import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Get profile if user exists
    let profile = null;
    let profileError = null;

    if (user) {
      const profileResult = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      profile = profileResult.data;
      profileError = profileResult.error;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
              created_at: session.user.created_at,
            }
          : null,
        error: sessionError?.message,
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        error: userError?.message,
      },
      profile: {
        exists: !!profile,
        user_status: profile?.user_status || null,
        user_role: profile?.user_role || null,
        error: profileError?.message || null,
      },
      cookies: request.cookies.getAll().map((c) => ({
        name: c.name,
        value: c.value?.substring(0, 20) + "...",
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
