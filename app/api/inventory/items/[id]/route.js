import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req, context) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // if (id) {
    //   return NextResponse.json(
    //     { error: "Invalid inventory item ID" },
    //     { status: 400 }
    //   );
    // }

    // Fetch inventory item with related data
    const { data, error } = await supabase
      .from("stitching_challans")
      .select(
        `
        *,
        products(
          id,
          product_name,
          product_sku,
          product_category,
          manufacturing_cost
        ),
        ledgers(business_name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching inventory item:", error);
      return NextResponse.json(
        { error: "Failed to fetch inventory item" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Transform the data to match expected format using existing columns
    const getClassification = (item) => {
      const quality = (item.quality || "").toLowerCase();
      if (["a", "b", "premium", "good"].includes(quality)) return "good";
      if (["c", "d", "poor", "bad"].includes(quality)) return "bad";
      if (["waste", "damaged", "rejected"].includes(quality)) return "wastage";
      return "unclassified";
    };

    const transformedItem = {
      id: data.id,
      inventory_number: data.challan_no || `INV-${data.id}`,
      challan_no: data.challan_no,
      date: data.date,
      quality: data.quality,
      quantity: data.quantity,
      product_name: data.product_name,
      product_sku: data.product_sku,
      classification: getClassification(data),
      price_per_piece: 0, // No cost data available
      total_cost: 0, // No cost data available
      // Additional fields
      ledger_name: data.ledgers?.business_name,
      product_details: data.products,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
    };

    return NextResponse.json({ data: transformedItem });
  } catch (error) {
    console.error("Error in inventory item GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const supabase = await createClient();
    const { id } = await context.params; // use string UUID directly
    const body = await req.json();

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allowed fields
    const validFields = [
      "quantity",
      "quality",
      "challan_no",
      "date",
      "ledger_id",
      "batch_number",
      "product_name",
      "product_description",
      "product_image",
      "product_sku",
      "product_color",
      "product_size",
      "category",
      "sub_category",
      "status",
      "brand",
      "made_in",
      "transport_name",
      "lr_number",
      "transport_charge",
    ];

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    validFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from("stitching_challans")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating inventory item:", error);
      return NextResponse.json(
        { error: "Failed to update inventory item" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Inventory item updated successfully",
      data,
    });
  } catch (error) {
    console.error("Error in inventory item PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // if (isNaN(id)) {
    //   return NextResponse.json(
    //     { error: "Invalid inventory item ID" },
    //     { status: 400 }
    //   );
    // }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if inventory item exists
    const { data: existingItem } = await supabase
      .from("stitching_challans")
      .select("id, challan_no")
      .eq("id", id)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Delete the inventory item
    const { error } = await supabase
      .from("stitching_challans")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting inventory item:", error);
      return NextResponse.json(
        { error: "Failed to delete inventory item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Inventory item deleted successfully",
      deletedItem: {
        id,
        challan_no: existingItem.challan_no,
      },
    });
  } catch (error) {
    console.error("Error in inventory item DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const body = await request.json();

    // if (isNaN(id)) {
    //   return NextResponse.json(
    //     { error: "Invalid inventory item ID" },
    //     { status: 400 }
    //   );
    // }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle specific operations
    const { operation, ...updateFields } = body;

    if (operation === "classify") {
      // Special operation for classification
      const { classification } = updateFields;

      if (!classification) {
        return NextResponse.json(
          { error: "Classification is required for classify operation" },
          { status: 400 }
        );
      }

      const validClassifications = ["good", "bad", "wastage", "unclassified"];
      if (!validClassifications.includes(classification)) {
        return NextResponse.json(
          { error: "Invalid classification" },
          { status: 400 }
        );
      }

      // Map classification to quality value since inventory_classification doesn't exist
      let qualityValue = "Standard";
      switch (classification) {
        case "good":
          qualityValue = "A";
          break;
        case "bad":
          qualityValue = "C";
          break;
        case "wastage":
          qualityValue = "Waste";
          break;
        case "unclassified":
          qualityValue = "Standard";
          break;
      }

      const { data, error } = await supabase
        .from("stitching_challans")
        .update({
          quality: qualityValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update classification" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Classification updated successfully",
        data,
      });
    }

    if (operation === "adjust_stock") {
      // Special operation for stock adjustment
      const { quantity, price_per_piece } = updateFields;

      if (quantity === undefined || quantity < 0) {
        return NextResponse.json(
          { error: "Valid quantity is required for stock adjustment" },
          { status: 400 }
        );
      }

      const updateData = {
        quantity,
        updated_at: new Date().toISOString(),
      };

      // Skip price_per_piece and total_cost since they don't exist

      const { data, error } = await supabase
        .from("stitching_challans")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to adjust stock" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Stock adjusted successfully",
        data,
      });
    }

    // Default PATCH behavior - partial update
    const validFields = ["quantity", "quality"];

    const patchData = {
      updated_at: new Date().toISOString(),
    };

    validFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        patchData[field] = updateFields[field];
      }
    });

    // Skip cost calculation since price_per_piece and total_cost don't exist

    const { data, error } = await supabase
      .from("stitching_challans")
      .update(patchData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update inventory item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Inventory item updated successfully",
      data,
    });
  } catch (error) {
    console.error("Error in inventory item PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
