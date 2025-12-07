import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ProductRecord {
  product_name: string;
  product_sku: string;
  product_category: string;
  product_sub_category?: string;
  product_size?: string;
  product_color?: string;
  product_description?: string;
  product_material?: string;
  product_brand?: string;
  product_country?: string;
  product_status?: string;
  product_qty?: string;
  wash_care?: string;
  manufacturing_cost?: string;
  refurbished_cost?: string;
  is_refurbished?: string;
  original_manufacturing_cost?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }
    
    // Read and parse CSV file
    const csvText = await file.text();
    const lines = csvText.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain at least a header and one data row" },
        { status: 400 }
      );
    }
    
    // Parse headers
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    
    // Parse records
    const records: ProductRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || "";
      });
      
      records.push(record as ProductRecord);
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Validate and prepare records
    const validatedRecords: any[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // CSV row numbers start at 2 (1 is header)
      
      // Check required fields
      const requiredFields = ["product_name", "product_sku", "product_category"];
      const missingFields = requiredFields.filter(field => !record[field]);
      
      if (missingFields.length > 0) {
        errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(", ")}`);
        continue;
      }
      
      // Check if SKU already exists
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("product_sku", record.product_sku)
        .single();
      
      if (existingProduct) {
        errors.push(`Row ${rowNumber}: Product with SKU "${record.product_sku}" already exists`);
        continue;
      }
      
      // Prepare product data
      const productData = {
        product_name: record.product_name,
        product_sku: record.product_sku,
        product_category: record.product_category,
        product_sub_category: record.product_sub_category || null,
        product_size: record.product_size || null,
        product_color: record.product_color || null,
        product_description: record.product_description || null,
        product_material: record.product_material || null,
        product_brand: record.product_brand || "Bhaktinandan",
        product_country: record.product_country || "India",
        product_status: record.product_status || "Active",
        product_qty: parseInt(record.product_qty || "0") || 0,
        wash_care: record.wash_care || null,
        manufacturing_cost: parseFloat(record.manufacturing_cost || "0") || 0,
        refurbished_cost: parseFloat(record.refurbished_cost || "0") || 0,
        is_refurbished: record.is_refurbished === "true" || record.is_refurbished === "TRUE",
        original_manufacturing_cost: parseFloat(record.original_manufacturing_cost || "0") || 0,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };
      
      validatedRecords.push(productData);
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: "Validation errors found", 
          details: errors,
          imported: 0,
          total: records.length
        },
        { status: 400 }
      );
    }
    
    // Insert products in batches
    const batchSize = 50;
    let importedCount = 0;
    const importErrors: string[] = [];
    
    for (let i = 0; i < validatedRecords.length; i += batchSize) {
      const batch = validatedRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from("products")
        .insert(batch)
        .select();
      
      if (error) {
        importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        importedCount += data?.length || 0;
      }
    }
    
    if (importErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Some batches failed to import",
          details: importErrors,
          imported: importedCount,
          total: validatedRecords.length
        },
        { status: 207 } // Multi-Status
      );
    }
    
    return NextResponse.json({
      message: "Products imported successfully",
      imported: importedCount,
      total: validatedRecords.length
    });
    
  } catch (error) {
    console.error("Error in bulk products POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    
    if (format !== "csv") {
      return NextResponse.json(
        { error: "Only CSV format is supported" },
        { status: 400 }
      );
    }
    
    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        product_name,
        product_sku,
        product_category,
        product_sub_category,
        product_size,
        product_color,
        product_description,
        product_material,
        product_brand,
        product_country,
        product_status,
        product_qty,
        wash_care,
        manufacturing_cost,
        refurbished_cost,
        is_refurbished,
        original_manufacturing_cost
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching products for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
    
    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found to export" },
        { status: 404 }
      );
    }
    
    // Convert to CSV
    const headers = [
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
      "original_manufacturing_cost"
    ];
    
    const csvRows = [
      headers.join(","), // Header row
      ...products.map(product => 
        headers.map(header => {
          const value = product[header as keyof typeof product];
          // Handle values that might contain commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        }).join(",")
      )
    ];
    
    const csvContent = csvRows.join("\n");
    
    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
    
  } catch (error) {
    console.error("Error in bulk products GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}