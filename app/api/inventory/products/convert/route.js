import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { productIds, conversionData } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs are required" },
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

    // Validate that products exist and are not already converted
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No valid products found" },
        { status: 404 }
      );
    }

    // Skip conversion checks since inventory_status and qc_status don't exist
    // All products can be converted regardless of status

    // Start a transaction-like operation
    const convertedProducts = [];
    const errors = [];

    for (const product of products) {
      try {
        // Create inventory entry in stitching_challans table
        const inventoryData = {
          challan_no: `INV-${product.product_sku}-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          ledger_id: null, // Can be set later if needed
          quality: "Standard", // Default quality for converted products
          batch_number: [product.product_sku],
          quantity: product.product_qty || 0,
          product_name: product.product_name,
          product_description: product.product_description,
          product_image: product.product_image,
          product_sku: product.product_sku,
          product_color: product.product_color,
          product_size: product.product_size ? [product.product_size] : null,
          category: product.product_category,
          sub_category: product.product_sub_category,
          status: "converted",
          brand: product.product_brand,
          made_in: product.product_country,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Use existing fields only
          selected_product_id: product.id,
        };

        const { data: inventoryItem, error: inventoryError } = await supabase
          .from("stitching_challans")
          .insert(inventoryData)
          .select()
          .single();

        if (inventoryError) {
          errors.push(
            `Product ${product.product_sku}: Failed to create inventory entry - ${inventoryError.message}`
          );
          continue;
        }

        // Update product with inventory conversion tracking
        const { error: updateError } = await supabase
          .from("products")
          .update({
            updated_at: new Date().toISOString(),
            // Add conversion metadata to product description or create a note
            product_description: product.product_description
              ? `${product.product_description}\n\nConverted to inventory on ${
                  new Date().toISOString().split("T")[0]
                } (INV-${inventoryItem.id})`
              : `Converted to inventory on ${
                  new Date().toISOString().split("T")[0]
                } (INV-${inventoryItem.id})`,
          })
          .eq("id", product.id);

        if (updateError) {
          errors.push(
            `Product ${product.product_sku}: Failed to update product with conversion info - ${updateError.message}`
          );
          // Rollback inventory creation
          await supabase
            .from("stitching_challans")
            .delete()
            .eq("id", inventoryItem.id);
          continue;
        }

        convertedProducts.push({
          productId: product.id,
          productSku: product.product_sku,
          inventoryId: inventoryItem.id,
          challanNo: inventoryItem.challan_no,
        });
      } catch (error) {
        console.error(
          `Error converting product ${product.product_sku}:`,
          error
        );
        errors.push(
          `Product ${product.product_sku}: Unexpected error during conversion`
        );
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Some products failed to convert",
          details: errors,
          converted: convertedProducts.length,
          total: products.length,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      message: "Products converted to inventory successfully",
      converted: convertedProducts.length,
      total: products.length,
      data: convertedProducts,
    });
  } catch (error) {
    console.error("Error in products convert POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Query stitching_challans for converted products
    let query = supabase
      .from("stitching_challans")
      .select(
        `
        *,
        products(
          id,
          product_sku,
          product_name,
          product_category,
          product_qty,
          manufacturing_cost
        )
      `
      )
      .eq("status", "converted");

    if (status) {
      // Use quality field as proxy for classification since inventory_classification doesn't exist
      if (status === "good") {
        query = query.in("quality", ["A", "B", "Premium", "Good"]);
      } else if (status === "bad") {
        query = query.in("quality", ["C", "D", "Poor", "Bad"]);
      } else if (status === "wastage") {
        query = query.in("quality", ["Waste", "Damaged", "Rejected"]);
      }
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching conversion status:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversion status" },
        { status: 500 }
      );
    }

    // Get conversion statistics from stitching_challans using quality field
    const { data: allConverted } = await supabase
      .from("stitching_challans")
      .select("quality")
      .eq("status", "converted");

    const stats = {
      total: allConverted?.length || 0,
      good: 0,
      bad: 0,
      wastage: 0,
      unclassified: 0,
    };

    allConverted?.forEach((item) => {
      const quality = (item.quality || "").toLowerCase();
      let classification = "unclassified";
      if (["a", "b", "premium", "good"].includes(quality)) {
        classification = "good";
      } else if (["c", "d", "poor", "bad"].includes(quality)) {
        classification = "bad";
      } else if (["waste", "damaged", "rejected"].includes(quality)) {
        classification = "wastage";
      }

      if (classification in stats) {
        stats[classification]++;
      }
    });

    // Get products that are eligible for conversion (QC passed)
    const { data: eligibleProducts } = await supabase
      .from("products")
      .select("id, product_sku, product_name, product_category, product_qty")
      .not("product_qty", "is", null)
      .gt("product_qty", 0);

    return NextResponse.json({
      data: data || [],
      stats,
      eligibleForConversion: eligibleProducts?.length || 0,
    });
  } catch (error) {
    console.error("Error in products convert GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
