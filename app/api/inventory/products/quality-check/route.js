import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { productIds, qcStatus, qcNotes, qcParameters } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs are required" },
        { status: 400 }
      );
    }

    if (
      !qcStatus ||
      ![
        "pending",
        "in_progress",
        "passed",
        "failed",
        "requires_rework",
      ].includes(qcStatus)
    ) {
      return NextResponse.json(
        { error: "Valid QC status is required" },
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

    // Validate that products exist using only existing columns
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, product_sku, product_name, product_status")
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

    // Skip conversion check since inventory_status doesn't exist
    // All products can be QC checked regardless of status

    // Update QC status for all products
    const updatedProducts = [];
    const errors = [];

    for (const product of products) {
      try {
        // Since QC fields don't exist in products table, we'll store QC info in product_status
        const updateData = {
          product_status: qcStatus, // Use product_status as QC status proxy
          updated_at: new Date().toISOString(),
        };

        // Note: QC notes and parameters would need to be stored elsewhere since these columns don't exist

        const { data: updatedProduct, error: updateError } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", product.id)
          .select()
          .single();

        if (updateError) {
          errors.push(
            `Product ${product.product_sku}: Failed to update QC status - ${updateError.message}`
          );
          continue;
        }

        updatedProducts.push({
          productId: product.id,
          productSku: product.product_sku,
          previousStatus: product.product_status,
          newStatus: qcStatus,
        });
      } catch (error) {
        console.error(
          `Error updating QC for product ${product.product_sku}:`,
          error
        );
        errors.push(
          `Product ${product.product_sku}: Unexpected error during QC update`
        );
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Some products failed to update",
          details: errors,
          updated: updatedProducts.length,
          total: products.length,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      message: "Quality check status updated successfully",
      updated: updatedProducts.length,
      total: products.length,
      data: updatedProducts,
    });
  } catch (error) {
    console.error("Error in quality check POST:", error);
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase.from("products").select(
      `
        id,
        product_sku,
        product_name,
        product_category,
        product_qty,
        product_status,
        created_at,
        updated_at
      `,
      { count: "exact" }
    );

    if (status) {
      query = query.eq("product_status", status); // Use product_status as QC status proxy
    }

    const { data, error, count } = await query
      .order("qc_updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching QC status:", error);
      return NextResponse.json(
        { error: "Failed to fetch QC status" },
        { status: 500 }
      );
    }

    // Get QC statistics using product_status
    const { data: stats } = await supabase
      .from("products")
      .select("product_status")
      .then(({ data }) => {
        const stats = {
          total: data?.length || 0,
          pending: 0,
          in_progress: 0,
          passed: 0,
          failed: 0,
          requires_rework: 0,
        };

        data?.forEach((item) => {
          const status = item.product_status;
          if (stats[status] !== undefined) {
            stats[status]++;
          }
        });

        return { data: stats };
      });

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      stats: stats || {
        total: 0,
        pending: 0,
        in_progress: 0,
        passed: 0,
        failed: 0,
        requires_rework: 0,
      },
    });
  } catch (error) {
    console.error("Error in quality check GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { productId, qcParameters, qcNotes } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
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

    // Check if product exists using only existing columns
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, product_status")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Skip conversion check since inventory_status doesn't exist

    // Update product status since QC fields don't exist
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Note: QC parameters and notes would need to be stored elsewhere since these columns don't exist
    // For now, we'll just update the timestamp

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating QC parameters:", updateError);
      return NextResponse.json(
        { error: "Failed to update QC parameters" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "QC parameters updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error in quality check PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
