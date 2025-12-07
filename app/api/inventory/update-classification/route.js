import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { itemId, classification } = await request.json();

    if (!itemId || !classification) {
      return NextResponse.json(
        { error: "Missing required fields: itemId and classification" },
        { status: 400 }
      );
    }

    // Validate classification
    const validClassifications = ["good", "bad", "wastage", "unclassified"];
    if (!validClassifications.includes(classification)) {
      return NextResponse.json(
        { error: "Invalid classification value" },
        { status: 400 }
      );
    }

    // Map classification to quality values since inventory_classification doesn't exist
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

    // Update the quality field instead of non-existent inventory_classification
    let data, error;
    try {
      const result = await supabase
        .from("stitching_challans")
        .update({
          quality: qualityValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select();

      data = result.data;
      error = result.error;
    } catch (e) {
      console.log("Error updating classification in stitching_challans:", e);
      return NextResponse.json(
        {
          error:
            "Failed to update classification - quality field may not be accessible",
        },
        { status: 500 }
      );
    }

    if (error) {
      console.error("Error updating inventory classification:", error);
      return NextResponse.json(
        { error: "Failed to update inventory classification" },
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
      message: "Inventory classification updated successfully",
      data: data[0],
    });
  } catch (error) {
    console.error("Error in update-classification route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
