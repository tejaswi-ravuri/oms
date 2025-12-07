import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return NextResponse.json(
        { error: "Failed to fetch product: " + error.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error in product GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, product_sku")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching existing product:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch product: " + fetchError.message },
        { status: 500 }
      );
    }

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if SKU conflicts with another record
    if (body.product_sku && body.product_sku !== existingProduct.product_sku) {
      const { data: conflictingProduct } = await supabase
        .from("products")
        .select("product_sku")
        .eq("product_sku", body.product_sku)
        .neq("id", id)
        .single();

      if (conflictingProduct) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 409 }
        );
      }
    }

    // Skip conversion check since inventory_status doesn't exist
    // All products can be edited regardless of conversion status

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Add fields only if they are provided in the body and exist in database
    const allowedFields = [
      "product_name",
      "product_sku",
      "product_category",
      "product_sub_category",
      "product_size",
      "product_color",
      "product_description",
      "product_material",
      "product_brand",
      "product_country",
      "product_status",
      "product_qty",
      "wash_care",
      "manufacturing_cost",
      "refurbished_cost",
      "is_refurbished",
      "original_manufacturing_cost",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error in product PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching existing product:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch product: " + fetchError.message },
        { status: 500 }
      );
    }

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Skip conversion check since inventory_status doesn't exist
    // All products can be deleted

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in product DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
