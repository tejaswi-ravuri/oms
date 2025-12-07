// app/api/production/weaver-challans/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET single weaver challan
export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("weaver_challans")
      .select(
        `
        *,
        weaver:ledgers!weaver_ledger_id(
          ledger_id,
          business_name,
          ledger_type,
          contact_person_name,
          mobile_number,
          email
        ),
        purchase:purchases(
          id,
          purchase_no,
          material_type,
          total_meters,
          rate_per_meter
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching weaver challan:", error);
      return NextResponse.json(
        { error: "Weaver challan not found", details: error },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Weaver challan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in weaver challan GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE weaver challan
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean the data - remove undefined values and convert to proper types
    const cleanedData = {};

    if (body.challan_no !== undefined) cleanedData.challan_no = body.challan_no;
    if (body.challan_date !== undefined)
      cleanedData.challan_date = body.challan_date;
    if (body.purchase_id !== undefined)
      cleanedData.purchase_id = body.purchase_id || null;
    if (body.weaver_ledger_id !== undefined)
      cleanedData.weaver_ledger_id = body.weaver_ledger_id;
    if (body.material_type !== undefined)
      cleanedData.material_type = body.material_type;
    if (body.batch_number !== undefined)
      cleanedData.batch_number = body.batch_number || null;
    if (body.ms_party_name !== undefined)
      cleanedData.ms_party_name = body.ms_party_name || null;

    // Handle numeric fields properly
    if (body.quantity_sent_meters !== undefined) {
      cleanedData.quantity_sent_meters = body.quantity_sent_meters
        ? parseFloat(String(body.quantity_sent_meters))
        : 0;
    }
    if (body.quantity_received_meters !== undefined) {
      cleanedData.quantity_received_meters = body.quantity_received_meters
        ? parseFloat(String(body.quantity_received_meters))
        : 0;
    }
    if (body.rate_per_meter !== undefined) {
      cleanedData.rate_per_meter = body.rate_per_meter
        ? parseFloat(String(body.rate_per_meter))
        : null;
    }
    if (body.vendor_amount !== undefined) {
      cleanedData.vendor_amount = body.vendor_amount
        ? parseFloat(String(body.vendor_amount))
        : null;
    }
    if (body.transport_charge !== undefined) {
      cleanedData.transport_charge = body.transport_charge
        ? parseFloat(String(body.transport_charge))
        : null;
    }
    if (body.total_grey_mtr !== undefined) {
      cleanedData.total_grey_mtr = body.total_grey_mtr
        ? parseFloat(String(body.total_grey_mtr))
        : null;
    }
    if (body.taka !== undefined) {
      cleanedData.taka = body.taka ? parseInt(String(body.taka)) : null;
    }

    if (body.transport_name !== undefined)
      cleanedData.transport_name = body.transport_name || null;
    if (body.lr_number !== undefined)
      cleanedData.lr_number = body.lr_number || null;
    if (body.status !== undefined) cleanedData.status = body.status;

    // Update weaver challan
    const { data, error } = await supabase
      .from("weaver_challans")
      .update(cleanedData)
      .eq("id", id)
      .select(
        `
        *,
        weaver:ledgers!weaver_ledger_id(
          ledger_id,
          business_name,
          ledger_type,
          contact_person_name,
          mobile_number
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating weaver challan:", error);
      return NextResponse.json(
        { error: "Failed to update weaver challan", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in weaver challan PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE single weaver challan
export async function DELETE(request, context) {
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

    // Delete weaver challan
    const { error } = await supabase
      .from("weaver_challans")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting weaver challan:", error);
      return NextResponse.json(
        { error: "Failed to delete weaver challan", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Weaver challan deleted successfully",
    });
  } catch (error) {
    console.error("Error in weaver challan DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
