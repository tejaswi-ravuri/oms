import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface InventoryRecord {
  inventory_number: string;
  challan_no: string;
  date: string;
  quality: string;
  quantity: number;
  product_name: string;
  product_sku: string;
  classification: "good" | "bad" | "wastage" | "unclassified";
  price_per_piece: number;
  total_cost: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const operation = formData.get("operation") as string;
    
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

    if (!["import", "update"].includes(operation)) {
      return NextResponse.json(
        { error: "Invalid operation. Must be 'import' or 'update'" },
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
    const records: InventoryRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || "";
      });
      
      records.push(record as InventoryRecord);
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
      const requiredFields = ["product_name", "product_sku", "quantity", "classification"];
      const missingFields = requiredFields.filter(field => !record[field]);
      
      if (missingFields.length > 0) {
        errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(", ")}`);
        continue;
      }
      
      // Validate classification
      const validClassifications = ["good", "bad", "wastage", "unclassified"];
      if (!validClassifications.includes(record.classification)) {
        errors.push(`Row ${rowNumber}: Invalid classification "${record.classification}". Must be one of: ${validClassifications.join(", ")}`);
        continue;
      }
      
      // Validate numeric fields
      const quantity = parseInt(String(record.quantity || "0"));
      const pricePerPiece = parseFloat(String(record.price_per_piece || "0"));
      
      if (isNaN(quantity) || quantity < 0) {
        errors.push(`Row ${rowNumber}: Invalid quantity "${record.quantity}"`);
        continue;
      }
      
      if (isNaN(pricePerPiece) || pricePerPiece < 0) {
        errors.push(`Row ${rowNumber}: Invalid price_per_piece "${record.price_per_piece}"`);
        continue;
      }
      
      // Prepare inventory data
      const inventoryData = {
        challan_no: record.challan_no || `INV-${record.product_sku}-${Date.now()}-${i}`,
        date: record.date || new Date().toISOString().split('T')[0],
        ledger_id: null,
        quality: record.quality || "Standard",
        batch_number: [record.product_sku],
        quantity,
        product_name: record.product_name,
        product_description: null,
        product_image: null,
        product_sku: record.product_sku,
        product_color: null,
        product_size: null,
        category: null,
        sub_category: null,
        status: "imported",
        brand: "Bhaktinandan",
        made_in: "India",
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Inventory-specific fields
        inventory_classification: record.classification,
        inventory_number: record.inventory_number || `INV-${Date.now()}-${i}`,
        price_per_piece: pricePerPiece,
        total_cost: quantity * pricePerPiece,
        selected_product_id: null,
      };
      
      validatedRecords.push(inventoryData);
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
    
    if (operation === "update") {
      // For update operation, we need to find existing records and update them
      let updatedCount = 0;
      const updateErrors: string[] = [];
      
      for (const record of validatedRecords) {
        try {
          const { error } = await supabase
            .from("stitching_challans")
            .update({
              inventory_classification: record.inventory_classification,
              quantity: record.quantity,
              price_per_piece: record.price_per_piece,
              total_cost: record.total_cost,
              quality: record.quality,
              updated_at: new Date().toISOString(),
            })
            .eq("product_sku", record.product_sku);
          
          if (error) {
            updateErrors.push(`Failed to update ${record.product_sku}: ${error.message}`);
          } else {
            updatedCount++;
          }
        } catch (error) {
          updateErrors.push(`Failed to update ${record.product_sku}: Unexpected error`);
        }
      }
      
      if (updateErrors.length > 0) {
        return NextResponse.json(
          {
            error: "Some records failed to update",
            details: updateErrors,
            updated: updatedCount,
            total: validatedRecords.length
          },
          { status: 207 }
        );
      }
      
      return NextResponse.json({
        message: "Inventory records updated successfully",
        updated: updatedCount,
        total: validatedRecords.length
      });
    } else {
      // For import operation, insert new records
      const batchSize = 50;
      let importedCount = 0;
      const importErrors: string[] = [];
      
      for (let i = 0; i < validatedRecords.length; i += batchSize) {
        const batch = validatedRecords.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from("stitching_challans")
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
          { status: 207 }
        );
      }
      
      return NextResponse.json({
        message: "Inventory records imported successfully",
        imported: importedCount,
        total: validatedRecords.length
      });
    }
    
  } catch (error) {
    console.error("Error in bulk inventory POST:", error);
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
    const classification = searchParams.get("classification");
    
    if (format !== "csv") {
      return NextResponse.json(
        { error: "Only CSV format is supported" },
        { status: 400 }
      );
    }
    
    // Build query
    let query = supabase
      .from("stitching_challans")
      .select(`
        inventory_number,
        challan_no,
        date,
        quality,
        quantity,
        product_name,
        product_sku,
        inventory_classification,
        price_per_piece,
        total_cost
      `)
      .not("inventory_classification", "is", null)
      .order("created_at", { ascending: false });
    
    // Apply classification filter if provided
    if (classification && classification !== "all") {
      query = query.eq("inventory_classification", classification);
    }
    
    const { data: inventoryItems, error } = await query;
    
    if (error) {
      console.error("Error fetching inventory items for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch inventory items" },
        { status: 500 }
      );
    }
    
    if (!inventoryItems || inventoryItems.length === 0) {
      return NextResponse.json(
        { error: "No inventory items found to export" },
        { status: 404 }
      );
    }
    
    // Convert to CSV
    const headers = [
      "inventory_number",
      "challan_no", 
      "date",
      "quality",
      "quantity",
      "product_name",
      "product_sku",
      "classification",
      "price_per_piece",
      "total_cost"
    ];
    
    const csvRows = [
      headers.join(","), // Header row
      ...inventoryItems.map(item => {
        const row = [
          item.inventory_number || "",
          item.challan_no || "",
          item.date || "",
          item.quality || "",
          item.quantity || 0,
          item.product_name || "",
          item.product_sku || "",
          item.inventory_classification || "",
          item.price_per_piece || 0,
          item.total_cost || 0
        ];
        
        return row.map(value => {
          // Handle values that might contain commas or quotes
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(",");
      })
    ];
    
    const csvContent = csvRows.join("\n");
    
    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inventory-export-${classification || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
    
  } catch (error) {
    console.error("Error in bulk inventory GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { itemIds, updates } = body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Item IDs are required" },
        { status: 400 }
      );
    }
    
    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Update data is required" },
        { status: 400 }
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
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Add valid update fields
    const validFields = [
      "inventory_classification",
      "quantity", 
      "price_per_piece",
      "total_cost",
      "quality"
    ];
    
    validFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    // Calculate total_cost if quantity and price_per_piece are provided
    if (updates.quantity !== undefined && updates.price_per_piece !== undefined) {
      updateData.total_cost = updates.quantity * updates.price_per_piece;
    }
    
    // Update items
    const { data, error } = await supabase
      .from("stitching_challans")
      .update(updateData)
      .in("id", itemIds)
      .select();
    
    if (error) {
      console.error("Error in bulk inventory PUT:", error);
      return NextResponse.json(
        { error: "Failed to update inventory items" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Inventory items updated successfully",
      updated: data?.length || 0,
      data
    });
    
  } catch (error) {
    console.error("Error in bulk inventory PUT:", error);
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
        { error: "Inventory item IDs are required" },
        { status: 400 }
      );
    }
    
    const itemIds = ids.split(",").map(id => parseInt(id.trim()));
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Delete items
    const { error } = await supabase
      .from("stitching_challans")
      .delete()
      .in("id", itemIds);
    
    if (error) {
      console.error("Error in bulk inventory DELETE:", error);
      return NextResponse.json(
        { error: "Failed to delete inventory items" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Inventory items deleted successfully",
      deleted: itemIds.length
    });
    
  } catch (error) {
    console.error("Error in bulk inventory DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}