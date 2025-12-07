// app/api/production/stitching-challans/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { StitchingChallanFormData } from "@/types/production";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET single stitching challan
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
      .from("stitching_challans")
      .select(`
        *,
        ledger:ledgers!ledger_id(
          ledger_id,
          business_name,
          ledger_type,
          contact_person_name,
          mobile_number,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching stitching challan:", error);
      return NextResponse.json(
        { error: "Stitching challan not found", details: error },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Stitching challan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in stitching challan GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE stitching challan
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
    const body: StitchingChallanFormData = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean the data - remove undefined values and convert to proper types
    const cleanedData: any = {};

    if (body.challan_no !== undefined) cleanedData.challan_no = body.challan_no;
    if (body.challan_date !== undefined) cleanedData.challan_date = body.challan_date;
    if (body.ledger_id !== undefined) cleanedData.ledger_id = body.ledger_id;
    if (body.batch_numbers !== undefined) cleanedData.batch_numbers = body.batch_numbers;
    if (body.product_name !== undefined) cleanedData.product_name = body.product_name || null;
    if (body.product_sku !== undefined) cleanedData.product_sku = body.product_sku || null;
    
    // Handle numeric fields properly
    if (body.quantity_sent !== undefined) {
      cleanedData.quantity_sent = body.quantity_sent ? parseInt(String(body.quantity_sent)) : 0;
    }
    if (body.quantity_received !== undefined) {
      cleanedData.quantity_received = body.quantity_received ? parseInt(String(body.quantity_received)) : 0;
    }
    if (body.rate_per_piece !== undefined) {
      cleanedData.rate_per_piece = body.rate_per_piece ? parseFloat(String(body.rate_per_piece)) : null;
    }
    if (body.transport_charge !== undefined) {
      cleanedData.transport_charge = body.transport_charge ? parseFloat(String(body.transport_charge)) : null;
    }
    
    if (body.size_breakdown !== undefined) cleanedData.size_breakdown = body.size_breakdown || null;
    if (body.transport_name !== undefined) cleanedData.transport_name = body.transport_name || null;
    if (body.lr_number !== undefined) cleanedData.lr_number = body.lr_number || null;
    if (body.status !== undefined) cleanedData.status = body.status;

    // Update stitching challan
    const { data, error } = await supabase
      .from("stitching_challans")
      .update(cleanedData)
      .eq("id", id)
      .select(`
        *,
        ledger:ledgers!ledger_id(
          ledger_id,
          business_name,
          ledger_type,
          contact_person_name,
          mobile_number
        )
      `)
      .single();

    if (error) {
      console.error("Error updating stitching challan:", error);
      return NextResponse.json(
        { error: "Failed to update stitching challan", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in stitching challan PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE single stitching challan
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

    // Delete stitching challan
    const { error } = await supabase
      .from("stitching_challans")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting stitching challan:", error);
      return NextResponse.json(
        { error: "Failed to delete stitching challan", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Stitching challan deleted successfully" 
    });
  } catch (error) {
    console.error("Error in stitching challan DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Convert to inventory (kept here for backward compatibility)
export async function POST(
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call Supabase function to convert to inventory
    const { data, error } = await supabase.rpc("fn_convert_to_inventory", {
      stitching_id: id,
      user_id: user.id,
    });

    if (error) {
      console.error("Error converting to inventory:", error);
      return NextResponse.json(
        { error: error.message || "Conversion failed", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Successfully converted to inventory", 
      data 
    });
  } catch (error) {
    console.error("Error in convert to inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}