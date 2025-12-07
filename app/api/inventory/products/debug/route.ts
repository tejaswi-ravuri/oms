import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get all products to see what exists
    const { data: allProducts, error: allError } = await supabase
      .from("products")
      .select("id, product_name, product_sku")
      .limit(10);
    
    // Check specifically for product with ID 1
    const { data: product1, error: product1Error } = await supabase
      .from("products")
      .select("*")
      .eq("id", 1)
      .single();
    
    // Get the count of products
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    
    return NextResponse.json({
      allProducts,
      allError,
      product1,
      product1Error,
      totalProducts: count,
      countError,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug error", details: error },
      { status: 500 }
    );
  }
}