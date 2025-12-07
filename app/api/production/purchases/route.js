import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("purchases")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("purchase_date", { ascending: false });

    if (search) {
      query = query.or(
        `purchase_no.ilike.%${search}%,material_type.ilike.%${search}%,remarks.ilike.%${search}%`
      );
    }

    const { data: purchases, error, count } = await query;

    if (error) {
      console.error("Error fetching purchases:", error);
      return NextResponse.json(
        { error: "Failed to fetch purchases" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: purchases || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in purchases GET:", error);
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
    const requiredFields = [
      "purchase_date",
      "purchase_no",
      "material_type",
      "total_meters",
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if purchase number already exists
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("purchase_no")
      .eq("purchase_no", body.purchase_no)
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "Purchase with this number already exists" },
        { status: 409 }
      );
    }

    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating purchase:", error);
      return NextResponse.json(
        { error: "Failed to create purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: purchase }, { status: 201 });
  } catch (error) {
    console.error("Error in purchases POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
