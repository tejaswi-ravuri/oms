import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    
    // Sorting parameters
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Filter parameters
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const material = searchParams.get("material");
    const color = searchParams.get("color");
    const search = searchParams.get("search");
    
    // Build query
    let query = supabase
      .from("products")
      .select("*", { count: "exact" });
    
    // Apply filters
    if (category) {
      query = query.eq("product_category", category);
    }
    if (status) {
      query = query.eq("product_status", status);
    }
    if (material) {
      query = query.eq("product_material", material);
    }
    if (color) {
      query = query.eq("product_color", color);
    }
    if (search) {
      query = query.or(`product_name.ilike.%${search}%,product_sku.ilike.%${search}%,product_description.ilike.%${search}%`);
    }
    
    // Apply sorting and pagination
    const { data: products, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
    
    // Get unique values for filters
    const { data: categories } = await supabase
      .from("products")
      .select("product_category")
      .not("product_category", "is", null);
    
    const { data: materials } = await supabase
      .from("products")
      .select("product_material")
      .not("product_material", "is", null);
    
    const { data: colors } = await supabase
      .from("products")
      .select("product_color")
      .not("product_color", "is", null);
    
    const uniqueCategories = [...new Set(categories?.map(c => c.product_category) || [])];
    const uniqueMaterials = [...new Set(materials?.map(m => m.product_material) || [])];
    const uniqueColors = [...new Set(colors?.map(c => c.product_color) || [])];
    
    return NextResponse.json({
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      filters: {
        categories: uniqueCategories,
        materials: uniqueMaterials,
        colors: uniqueColors,
      },
    });
  } catch (error) {
    console.error("Error in products GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ["product_name", "product_sku", "product_category"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if SKU already exists
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("product_sku", body.product_sku)
      .single();
    
    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 409 }
      );
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Prepare product data - only include fields that exist in the database
    const productData: any = {
      product_name: body.product_name,
      product_sku: body.product_sku,
      product_category: body.product_category,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they exist in the body
    if (body.product_description !== undefined) productData.product_description = body.product_description;
    if (body.product_qty !== undefined) productData.product_qty = body.product_qty;
    if (body.product_image !== undefined) productData.product_image = body.product_image;
    if (body.product_status !== undefined) productData.product_status = body.product_status;
    if (body.product_material !== undefined) productData.product_material = body.product_material;
    if (body.product_color !== undefined) productData.product_color = body.product_color;
    if (body.product_size !== undefined) productData.product_size = body.product_size;
    // Note: cost_price and selling_price don't exist in database yet, so we skip them
    
    const { data: product, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error("Error in products POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");
    
    if (!ids) {
      return NextResponse.json(
        { error: "Product IDs are required" },
        { status: 400 }
      );
    }
    
    const productIds = ids.split(",").map(id => parseInt(id.trim()));
    
    // Skip conversion check since inventory_status doesn't exist
    // All products can be deleted
    
    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", productIds);
    
    if (error) {
      console.error("Error deleting products:", error);
      return NextResponse.json(
        { error: "Failed to delete products" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: "Products deleted successfully" });
  } catch (error) {
    console.error("Error in products DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}