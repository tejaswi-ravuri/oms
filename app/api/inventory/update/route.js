import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const item = await request.json();

    if (!item.id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Prepare update data - only include fields that exist in the database
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Add fields only if they exist in the request and database
    if (item.quantity !== undefined) {
      updateData.quantity = item.quantity;
    }

    // Handle quality field with error handling
    try {
      if (item.quality !== undefined) {
        updateData.quality = item.quality;
      }

      // Handle classification by mapping to quality field
      if (item.classification !== undefined) {
        let qualityValue = "Standard";
        switch (item.classification) {
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
        updateData.quality = qualityValue;
      }
    } catch (error) {
      console.log("Error setting quality field:", error);
      // Skip quality updates if the field is not accessible
    }

    // Skip price_per_piece and total_cost since they don't exist in database

    // Update the inventory item in stitching_challans table with error handling
    let data, error;
    try {
      const result = await supabase
        .from("stitching_challans")
        .update(updateData)
        .eq("id", item.id)
        .select();

      data = result.data;
      error = result.error;
    } catch (e) {
      console.log("Error updating stitching_challans:", e);
      // Try updating without quality field if it's causing issues
      const { quality, ...safeUpdateData } = updateData;
      const result = await supabase
        .from("stitching_challans")
        .update(safeUpdateData)
        .eq("id", item.id)
        .select();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error updating inventory item:", error);
      return NextResponse.json(
        { error: "Failed to update inventory item" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Inventory item updated successfully",
      data: data[0],
    });
  } catch (error) {
    console.error("Error in inventory update route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
