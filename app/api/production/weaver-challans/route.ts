// app/api/production/weaver-challans/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { WeaverChallanFormData } from "@/types/production";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("weaver_challans")
      .select(`
        *,
        weaver:ledgers!weaver_ledger_id(
          ledger_id,
          business_name,
          ledger_type,
          contact_person_name,
          mobile_number
        ),
        purchase:purchases(
          id,
          purchase_no,
          material_type,
          total_meters
        )
      `, { count: "exact" })
      .order("challan_date", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`challan_no.ilike.%${search}%,material_type.ilike.%${search}%,batch_number.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (startDate) {
      query = query.gte("challan_date", startDate);
    }
    
    if (endDate) {
      query = query.lte("challan_date", endDate);
    }

    // Apply pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching weaver challans:", error);
      return NextResponse.json(
        { error: "Failed to fetch weaver challans", details: error },
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
    console.error("Error in weaver challans GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body: WeaverChallanFormData = await request.json();

    // Validate required fields
    const { challan_no, challan_date, weaver_ledger_id, material_type, quantity_sent_meters } = body;
    if (!challan_no || !challan_date || !weaver_ledger_id || !material_type || !quantity_sent_meters) {
      return NextResponse.json(
        { error: "Missing required fields: challan_no, challan_date, weaver_ledger_id, material_type, quantity_sent_meters" },
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

    // Clean the data - remove undefined/null values and convert to proper types
    const cleanedData = {
      challan_no: body.challan_no,
      challan_date: body.challan_date,
      purchase_id: body.purchase_id || null,
      weaver_ledger_id: body.weaver_ledger_id,
      material_type: body.material_type,
      quantity_sent_meters: parseFloat(String(body.quantity_sent_meters)),
      quantity_received_meters: body.quantity_received_meters ? parseFloat(String(body.quantity_received_meters)) : 0,
      rate_per_meter: body.rate_per_meter ? parseFloat(String(body.rate_per_meter)) : null,
      vendor_amount: body.vendor_amount ? parseFloat(String(body.vendor_amount)) : null,
      transport_name: body.transport_name || null,
      lr_number: body.lr_number || null,
      transport_charge: body.transport_charge ? parseFloat(String(body.transport_charge)) : null,
      status: body.status || 'Sent',
      batch_number: body.batch_number || null,
      ms_party_name: body.ms_party_name || null,
      total_grey_mtr: body.total_grey_mtr ? parseFloat(String(body.total_grey_mtr)) : null,
      taka: body.taka ? parseInt(String(body.taka)) : null,
      created_by: user.id,
    };

    // Create weaver challan
    const { data, error } = await supabase
      .from("weaver_challans")
      .insert(cleanedData)
      .select(`
        *,
        weaver:ledgers!weaver_ledger_id(
          ledger_id,
          business_name,
          ledger_type,
          contact_person_name,
          mobile_number
        )
      `)
      .single();

    if (error) {
      console.error("Error creating weaver challan:", error);
      return NextResponse.json(
        { error: "Failed to create weaver challan", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in weaver challans POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Bulk delete
export async function DELETE(request: Request) {
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
    const ids = idsParam.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));

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

    // Delete challans
    const { error } = await supabase
      .from("weaver_challans")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Error bulk deleting weaver challans:", error);
      return NextResponse.json(
        { error: "Failed to delete weaver challans", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${ids.length} challan(s)` 
    });
  } catch (error) {
    console.error("Error in weaver challans bulk DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}