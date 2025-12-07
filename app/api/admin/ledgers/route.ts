import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/ledgers - List ledgers with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const has_gst = searchParams.get("has_gst") || "";
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("ledgers")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,contact_person_name.ilike.%${search}%,email.ilike.%${search}%,mobile_number.ilike.%${search}%`);
    }
    
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }
    
    if (state) {
      query = query.ilike("state", `%${state}%`);
    }
    
    if (has_gst !== "") {
      if (has_gst === "true") {
        query = query.not("gst_number", "is", null);
      } else {
        query = query.is("gst_number", null);
      }
    }

    // Apply sorting
    const validSortFields = ["business_name", "created_at", "updated_at", "city", "state"];
    const sortField = validSortFields.includes(sort) ? sort : "created_at";
    const sortOrder = order === "asc";

    // Apply pagination and ordering
    const { data: ledgers, error, count } = await query
      .order(sortField, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching ledgers:", error);
      return NextResponse.json(
        { error: "Failed to fetch ledgers", details: error.message },
        { status: 500 }
      );
    }

    // Return ledgers as-is since we don't have creator/updater relationships
    const ledgersWithDetails = ledgers || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ledgers: ledgersWithDetails,
      total: count || 0,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.error("Error in ledgers GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/ledgers - Create new ledger
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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

    // Validate required fields
    const { business_name } = body;
    
    if (!business_name || !business_name.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    // Check if business name already exists
    const { data: existingLedger } = await supabase
      .from("ledgers")
      .select("ledger_id")
      .ilike("business_name", business_name.trim())
      .single();

    if (existingLedger) {
      return NextResponse.json(
        { error: "A business with this name already exists" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate GST number if provided (15 characters alphanumeric)
    if (body.gst_number) {
      const gstNumber = body.gst_number.replace(/\s/g, "");
      if (!/^[0-9A-Z]{15}$/.test(gstNumber)) {
        return NextResponse.json(
          { error: "GST number must be 15 characters alphanumeric" },
          { status: 400 }
        );
      }
    }

    // Validate PAN number if provided (10 characters alphanumeric)
    if (body.pan_number) {
      const panNumber = body.pan_number.replace(/\s/g, "");
      if (!/^[0-9A-Z]{10}$/.test(panNumber)) {
        return NextResponse.json(
          { error: "PAN number must be 10 characters alphanumeric" },
          { status: 400 }
        );
      }
    }

    // Generate unique ledger_id
    const ledger_id = `LDG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create ledger
    const { data: ledger, error } = await supabase
      .from("ledgers")
      .insert({
        ledger_id,
        business_name: business_name.trim(),
        contact_person_name: body.contact_person_name?.trim() || null,
        mobile_number: body.mobile_number?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        district: body.district?.trim() || null,
        state: body.state?.trim() || null,
        country: body.country?.trim() || "India",
        zip_code: body.zip_code?.trim() || null,
        gst_number: body.gst_number?.replace(/\s/g, "").toUpperCase() || null,
        pan_number: body.pan_number?.replace(/\s/g, "").toUpperCase() || null,
        business_logo: body.business_logo || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ledger:", error);
      return NextResponse.json(
        { error: "Failed to create ledger", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ledger }, { status: 201 });
  } catch (error) {
    console.error("Error in ledgers POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ledgers - Bulk operations on ledgers
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    const { action, ledger_ids } = body;

    if (!action || !ledger_ids || !Array.isArray(ledger_ids) || ledger_ids.length === 0) {
      return NextResponse.json(
        { error: "Action and ledger_ids array are required" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      const { error: deleteError } = await supabase
        .from("ledgers")
        .delete()
        .in("ledger_id", ledger_ids);

      if (deleteError) {
        console.error("Error deleting ledgers:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete ledgers", details: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Successfully deleted ${ledger_ids.length} ledgers`
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in ledgers PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}