import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Filters
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const search = searchParams.get("search");

    // Build query
    let query = supabase
      .from("ecommerce_orders")
      .select("*", { count: "exact" });

    // Apply filters
    if (platform) {
      query = query.eq("platform", platform);
    }
    if (status) {
      query = query.eq("order_status", status);
    }
    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }
    if (search) {
      query = query.or(`
        platform_order_id.ilike.%${search}%,
        customer_name.ilike.%${search}%,
        customer_email.ilike.%${search}%,
        customer_phone.ilike.%${search}%
      `);
    }

    // Execute query
    const { data, error, count } = await query
      .order("order_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
