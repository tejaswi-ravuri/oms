import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const search = searchParams.get("search");

    // Query Myntra orders
    let query = supabase
      .from("ecommerce_orders")
      .select("*", { count: "exact" })
      .eq("platform", "myntra");

    if (status) query = query.eq("order_status", status);
    if (paymentStatus) query = query.eq("payment_status", paymentStatus);
    if (search) {
      query = query.or(`
        platform_order_id.ilike.%${search}%,
        customer_name.ilike.%${search}%,
        customer_email.ilike.%${search}%,
        customer_phone.ilike.%${search}%
      `);
    }

    const { data, error, count } = await query
      .order("order_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching Myntra orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch Myntra orders", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: "myntra",
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in Myntra orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
