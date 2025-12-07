// app/api/production/shorting-entries/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const batchNumber = searchParams.get("batchNumber") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const offset = (page - 1) * limit;

    // Build query with joins
    let query = supabase
      .from("shorting_entries")
      .select(
        `
        *,
        weaver_challan:weaver_challans(
          id,
          challan_no,
          weaver_ledger_id,
          material_type
        ),
        purchase:purchases(
          id,
          purchase_no,
          vendor_ledger_id,
          material_type
        )
      `,
        { count: "exact" }
      )
      .order("entry_date", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `entry_no.ilike.%${search}%,material_type.ilike.%${search}%,batch_number.ilike.%${search}%`
      );
    }

    if (batchNumber) {
      query = query.ilike("batch_number", `%${batchNumber}%`);
    }

    if (startDate) {
      query = query.gte("entry_date", startDate);
    }

    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    // Apply pagination
    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      console.error("Error fetching shorting entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch shorting entries", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in shorting entries GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const { entry_date, entry_no, material_type, total_pieces } = body;
    if (!entry_date || !entry_no || !material_type || !total_pieces) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: entry_date, entry_no, material_type, total_pieces",
        },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean the data
    const cleanedData = {
      entry_date: body.entry_date,
      entry_no: body.entry_no,
      weaver_challan_id: body.weaver_challan_id || null,
      purchase_id: body.purchase_id || null,
      material_type: body.material_type,
      batch_number: body.batch_number || null,
      total_pieces: parseInt(String(body.total_pieces)),
      good_pieces: body.good_pieces ? parseInt(String(body.good_pieces)) : 0,
      damaged_pieces: body.damaged_pieces
        ? parseInt(String(body.damaged_pieces))
        : 0,
      rejected_pieces: body.rejected_pieces
        ? parseInt(String(body.rejected_pieces))
        : 0,
      size_breakdown: body.size_breakdown || null,
      remarks: body.remarks || null,
      created_by: user.id,
    };

    // Create shorting entry
    const { data, error } = await supabase
      .from("shorting_entries")
      .insert(cleanedData)
      .select(
        `
        *,
        weaver_challan:weaver_challans(
          id,
          challan_no,
          material_type
        ),
        purchase:purchases(
          id,
          purchase_no,
          material_type
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating shorting entry:", error);
      return NextResponse.json(
        { error: "Failed to create shorting entry", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in shorting entries POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Bulk delete
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "Missing ids parameter" },
        { status: 400 }
      );
    }

    // Parse IDs
    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No valid IDs provided" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete entries
    const { error } = await supabase
      .from("shorting_entries")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Error bulk deleting shorting entries:", error);
      return NextResponse.json(
        { error: "Failed to delete shorting entries", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} entry/entries`,
    });
  } catch (error) {
    console.error("Error in shorting entries bulk DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
