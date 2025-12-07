// app/api/production/shorting-entries/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ShortingEntryFormData } from "@/types/production";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET single shorting entry
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shorting_entries")
      .select(`
        *,
        weaver_challan:weaver_challans(
          id,
          challan_no,
          weaver_ledger_id,
          material_type,
          ms_party_name
        ),
        purchase:purchases(
          id,
          purchase_no,
          vendor_ledger_id,
          material_type
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching shorting entry:", error);
      return NextResponse.json(
        { error: "Shorting entry not found", details: error },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Shorting entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in shorting entry GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE shorting entry
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const body: ShortingEntryFormData = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean the data - remove undefined values and convert to proper types
    const cleanedData: any = {};

    if (body.entry_date !== undefined) cleanedData.entry_date = body.entry_date;
    if (body.entry_no !== undefined) cleanedData.entry_no = body.entry_no;
    if (body.weaver_challan_id !== undefined) cleanedData.weaver_challan_id = body.weaver_challan_id || null;
    if (body.purchase_id !== undefined) cleanedData.purchase_id = body.purchase_id || null;
    if (body.material_type !== undefined) cleanedData.material_type = body.material_type;
    if (body.batch_number !== undefined) cleanedData.batch_number = body.batch_number || null;
    if (body.remarks !== undefined) cleanedData.remarks = body.remarks || null;
    if (body.size_breakdown !== undefined) cleanedData.size_breakdown = body.size_breakdown || null;
    
    // Handle numeric fields properly
    if (body.total_pieces !== undefined) {
      cleanedData.total_pieces = body.total_pieces ? parseInt(String(body.total_pieces)) : 0;
    }
    if (body.good_pieces !== undefined) {
      cleanedData.good_pieces = body.good_pieces ? parseInt(String(body.good_pieces)) : 0;
    }
    if (body.damaged_pieces !== undefined) {
      cleanedData.damaged_pieces = body.damaged_pieces ? parseInt(String(body.damaged_pieces)) : 0;
    }
    if (body.rejected_pieces !== undefined) {
      cleanedData.rejected_pieces = body.rejected_pieces ? parseInt(String(body.rejected_pieces)) : 0;
    }

    // Update shorting entry
    const { data, error } = await supabase
      .from("shorting_entries")
      .update(cleanedData)
      .eq("id", id)
      .select(`
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
      `)
      .single();

    if (error) {
      console.error("Error updating shorting entry:", error);
      return NextResponse.json(
        { error: "Failed to update shorting entry", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in shorting entry PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE single shorting entry
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete shorting entry
    const { error } = await supabase
      .from("shorting_entries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting shorting entry:", error);
      return NextResponse.json(
        { error: "Failed to delete shorting entry", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Shorting entry deleted successfully" 
    });
  } catch (error) {
    console.error("Error in shorting entry DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}