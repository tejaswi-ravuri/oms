import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Verify current user
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can create users
    if (currentUser.user_metadata?.role !== "Admin") {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // 2. Read incoming data
    const body = await request.json();
    const { email, first_name, last_name, user_role, password } = body;

    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Email, first_name, and last_name are required" },
        { status: 400 }
      );
    }

    // 3. Create Supabase Auth user
    const { data: auth, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || "TempPassword123!",
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          role: user_role || "User",
        },
      });

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        { status: 400 }
      );
    }

    const userId = auth.user.id;

    // 🌟 Profile row was already created by trigger
    // Now update it with extra fields
    // const { error: updateError } = await supabaseAdmin
    //   .from("profiles")
    //   .update({
    //     first_name,
    //     last_name,
    //     user_role: user_role || "User",
    //   })
    //   .eq("id", userId);

    // if (updateError) {
    //   return NextResponse.json(
    //     { error: updateError.message },
    //     { status: 500 }
    //   );
    // }

    // 4. Final response
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: userId,
        email,
        first_name,
        last_name,
        user_role: user_role || "User",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
