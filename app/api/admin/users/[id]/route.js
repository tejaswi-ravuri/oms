import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE(
  request,
  { params } // params is a Promise
) {
  try {
    // Await the params to get the id
    const { id: userId } = await params;

    console.log("Delete request for userId:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the requester is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_role !== "Admin") {
      console.log("Delete access denied:", {
        userId: user.id,
        role: profile?.user_role,
      });
      return NextResponse.json(
        { error: "Not authorized - Admin access required" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    console.log("Deleting user:", { userId, deletedBy: user.id });

    // 1. Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Profile delete error:", profileError);
      return NextResponse.json(
        { error: `Failed to delete profile: ${profileError.message}` },
        { status: 400 }
      );
    }

    // 2. Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error("Auth delete error:", authError);
      return NextResponse.json(
        { error: `Failed to delete user: ${authError.message}` },
        { status: 400 }
      );
    }

    console.log("User deleted successfully:", { userId });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      userId,
    });
  } catch (error) {
    console.error("Deletion error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
