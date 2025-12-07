import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/ledgers/[id] - Get single ledger
export async function GET(
 request: NextRequest, context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
      const { id } = await context.params;

    const { data: ledger, error } = await supabase
      .from("ledgers")
      .select("*")
      .eq("ledger_id", id)
      .single();

    if (error) {
      console.error("Error fetching ledger:", error);
      return NextResponse.json(
        { error: "Ledger not found", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ ledger });
  } catch (error) {
    console.error("Error in ledger GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ledgers/[id] - Update ledger
export async function PUT(
 request: NextRequest, context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
     const { id } = await context.params;

    // Check user permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (!profile || !["Admin", "Pmanager"].includes(profile.user_role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if ledger exists
    const { data: existingLedger, error: checkError } = await supabase
      .from("ledgers")
      .select("ledger_id")
      .eq("ledger_id", id)
      .single();

    if (checkError || !existingLedger) {
      return NextResponse.json(
        { error: "Ledger not found" },
        { status: 404 }
      );
    }

    // Validate business name if provided
    if (body.business_name && !body.business_name.trim()) {
      return NextResponse.json(
        { error: "Business name cannot be empty" },
        { status: 400 }
      );
    }

    // Check if business name is unique (if changing)
    if (body.business_name) {
      const { data: duplicateLedger } = await supabase
        .from("ledgers")
        .select("ledger_id")
        .ilike("business_name", body.business_name.trim())
        .neq("ledger_id", id)
        .single();

      if (duplicateLedger) {
        return NextResponse.json(
          { error: "A business with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate GST number if provided
    if (body.gst_number) {
      const gstNumber = body.gst_number.replace(/\s/g, "");
      if (gstNumber && !/^[0-9A-Z]{15}$/.test(gstNumber)) {
        return NextResponse.json(
          { error: "GST number must be 15 characters alphanumeric" },
          { status: 400 }
        );
      }
    }

    // Validate PAN number if provided
    if (body.pan_number) {
      const panNumber = body.pan_number.replace(/\s/g, "");
      if (panNumber && !/^[0-9A-Z]{10}$/.test(panNumber)) {
        return NextResponse.json(
          { error: "PAN number must be 10 characters alphanumeric" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.business_name !== undefined) updateData.business_name = body.business_name.trim();
    if (body.contact_person_name !== undefined) updateData.contact_person_name = body.contact_person_name?.trim() || null;
    if (body.mobile_number !== undefined) updateData.mobile_number = body.mobile_number?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.district !== undefined) updateData.district = body.district?.trim() || null;
    if (body.state !== undefined) updateData.state = body.state?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || null;
    if (body.zip_code !== undefined) updateData.zip_code = body.zip_code?.trim() || null;
    if (body.gst_number !== undefined) updateData.gst_number = body.gst_number?.replace(/\s/g, "").toUpperCase() || null;
    if (body.pan_number !== undefined) updateData.pan_number = body.pan_number?.replace(/\s/g, "").toUpperCase() || null;
    if (body.business_logo !== undefined) updateData.business_logo = body.business_logo || null;

    // Update ledger (updated_by will be set by trigger)
    const { data: ledger, error } = await supabase
      .from("ledgers")
      .update(updateData)
      .eq("ledger_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating ledger:", error);
      return NextResponse.json(
        { error: "Failed to update ledger", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ledger });
  } catch (error) {
    console.error("Error in ledger PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ledgers/[id] - Delete ledger
export async function DELETE(
  request: NextRequest, context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // Check user permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (!profile || !["Admin", "Pmanager"].includes(profile.user_role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete ledger
    const { error } = await supabase
      .from("ledgers")
      .delete()
      .eq("ledger_id", id);

    if (error) {
      console.error("Error deleting ledger:", error);
      return NextResponse.json(
        { error: "Failed to delete ledger", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Ledger deleted successfully" });
  } catch (error) {
    console.error("Error in ledger DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}