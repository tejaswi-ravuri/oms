import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "1000");
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const classification = searchParams.get("classification");
    const quality = searchParams.get("quality");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Build query - select from stitching_challans only
    let query = supabase
      .from("stitching_challans")
      .select(`
        id,
        challan_no,
        challan_date,
        product_name,
        product_sku,
        quantity_received,
        quantity_sent,
        rate_per_piece,
        amount_payable,
        total_good,
        total_bad,
        total_wastage,
        status,
        created_at,
        updated_at
      `);

    // Apply classification filter based on totals
    if (classification && classification !== "all") {
      if (classification === "good") {
        query = query.gt("total_good", 0);
      } else if (classification === "bad") {
        query = query.gt("total_bad", 0);
      } else if (classification === "wastage") {
        query = query.gt("total_wastage", 0);
      }
    }

    // Apply date filters
    if (startDate) {
      query = query.gte("challan_date", startDate);
    }
    if (endDate) {
      query = query.lte("challan_date", endDate);
    }

    // Apply search filter
    if (search) {
      query = query.or(`
        challan_no.ilike.%${search}%,
        product_name.ilike.%${search}%,
        product_sku.ilike.%${search}%
      `);
    }

    // Execute query with sorting and pagination
    const { data: items, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching inventory items:", error);
      return NextResponse.json(
        { error: "Failed to fetch inventory items", details: error.message },
        { status: 500 }
      );
    }

    // Get product details separately for SKUs we have
    const skus = [...new Set(items?.map(item => item.product_sku).filter(Boolean))];
    let productsMap = new Map();

    if (skus.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("product_sku, product_name, product_category, manufacturing_cost")
        .in("product_sku", skus);

      if (products) {
        products.forEach(p => {
          productsMap.set(p.product_sku, p);
        });
      }
    }

    // Transform the data to match the InventoryItem interface
    const transformedItems = items?.map(item => {
      // Get product info from products table if available
      const productInfo = item.product_sku ? productsMap.get(item.product_sku) : null;
      
      // Determine primary classification based on which total is highest
      let classification: "good" | "bad" | "wastage" | "unclassified" = "unclassified";
      const good = item.total_good || 0;
      const bad = item.total_bad || 0;
      const wastage = item.total_wastage || 0;

      if (good > 0 || bad > 0 || wastage > 0) {
        if (good >= bad && good >= wastage) {
          classification = "good";
        } else if (bad >= good && bad >= wastage) {
          classification = "bad";
        } else {
          classification = "wastage";
        }
      }

      // Calculate costs
      const quantity = item.quantity_received || 0;
      const pricePerPiece = item.rate_per_piece || productInfo?.manufacturing_cost || 0;
      const totalCost = quantity * pricePerPiece;

      return {
        id: item.id,
        inventory_number: `INV-${item.challan_no}`,
        challan_no: item.challan_no,
        date: item.challan_date || item.created_at,
        quality: item.status || "Standard",
        quantity: quantity,
        product_name: productInfo?.product_name || item.product_name || "Unknown Product",
        product_sku: item.product_sku || "N/A",
        classification: classification,
        price_per_piece: pricePerPiece,
        total_cost: totalCost,
        // Additional fields for detailed view
        total_good: good,
        total_bad: bad,
        total_wastage: wastage,
        quantity_sent: item.quantity_sent,
        amount_payable: item.amount_payable || 0,
      };
    }) || [];

    // Get unique qualities/statuses for filter
    const { data: statusData } = await supabase
      .from("stitching_challans")
      .select("status")
      .not("status", "is", null);

    const uniqueQualities = [...new Set(statusData?.map(s => s.status) || [])].sort();

    // Calculate summary statistics
    const summary = {
      total_items: transformedItems.length,
      total_good: transformedItems.reduce((sum, item) => sum + (item.total_good || 0), 0),
      total_bad: transformedItems.reduce((sum, item) => sum + (item.total_bad || 0), 0),
      total_wastage: transformedItems.reduce((sum, item) => sum + (item.total_wastage || 0), 0),
      total_cost: transformedItems.reduce((sum, item) => sum + item.total_cost, 0),
      good_items: transformedItems.filter(i => i.classification === "good").length,
      bad_items: transformedItems.filter(i => i.classification === "bad").length,
      wastage_items: transformedItems.filter(i => i.classification === "wastage").length,
    };

    return NextResponse.json({
      data: transformedItems,
      summary,
      filters: {
        qualities: uniqueQualities,
      },
      pagination: {
        page,
        limit,
        total: transformedItems.length,
      },
    });

  } catch (error) {
    console.error("Error in inventory items GET:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}