import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StitchingChallanFormData } from "@/types/production";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("stitching_challans")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("challan_date", { ascending: false });

    if (search) {
      query = query.or(
        `challan_no.ilike.%${search}%,product_name.ilike.%${search}%,product_sku.ilike.%${search}%`
      );
    }

    const { data: challans, error, count } = await query;

    if (error) {
      console.error("Error fetching stitching challans:", error);
      return NextResponse.json(
        { error: "Failed to fetch stitching challans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: challans || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in stitching challans GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: StitchingChallanFormData = await request.json();

    // Validate required fields
    const requiredFields = ["challan_no", "challan_date", "quantity_sent"];
    const missingFields = requiredFields.filter((field) => !body[field as keyof StitchingChallanFormData]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if challan number already exists
    const { data: existingChallan } = await supabase
      .from("stitching_challans")
      .select("challan_no")
      .eq("challan_no", body.challan_no)
      .single();

    if (existingChallan) {
      return NextResponse.json(
        { error: "Stitching challan with this number already exists" },
        { status: 409 }
      );
    }

    const { data: challan, error } = await supabase
      .from("stitching_challans")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating stitching challan:", error);
      return NextResponse.json(
        { error: "Failed to create stitching challan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: challan }, { status: 201 });
  } catch (error) {
    console.error("Error in stitching challans POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}