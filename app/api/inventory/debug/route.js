import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();

    // First, let's check what columns actually exist in stitching_challans
    const { data: tableInfo, error: tableError } = await supabase
      .from("stitching_challans")
      .select("*")
      .limit(1);

    if (tableError) {
      return NextResponse.json(
        {
          error: "Error accessing stitching_challans table",
          details: tableError,
        },
        { status: 500 }
      );
    }

    // Get a sample of actual data to see what fields are populated
    const { data: sampleData, error: sampleError } = await supabase
      .from("stitching_challans")
      .select(
        "id, challan_no, date, quality, quantity, product_name, product_sku, created_at"
      )
      .limit(5);

    if (sampleError) {
      return NextResponse.json(
        {
          error: "Error getting sample data",
          details: sampleError,
        },
        { status: 500 }
      );
    }

    // Check if we can query the quality column specifically
    let qualityTest = null;
    let qualityError = null;
    try {
      const { data: qualityData, error: qError } = await supabase
        .from("stitching_challans")
        .select("quality")
        .limit(1);

      qualityError = qError;
      qualityTest = qualityData;
    } catch (e) {
      qualityError = e;
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from("stitching_challans")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      message: "Debug info for stitching_challans table",
      tableColumns:
        tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [],
      sampleData: sampleData || [],
      qualityTest: {
        success: !qualityError,
        data: qualityTest,
        error: qualityError,
      },
      totalCount: count,
      countError: countError,
    });
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      {
        error: "Debug route failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
