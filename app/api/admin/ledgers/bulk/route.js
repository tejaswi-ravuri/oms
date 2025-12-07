import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/ledgers/bulk - Import ledgers from CSV
export async function POST(request) {
  try {
    const supabase = await createClient();

    // Check user permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (!profile || !["Admin", "Pmanager"].includes(profile.user_role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header and one data row" },
        { status: 400 }
      );
    }

    // Improved CSV parsing function
    const parseCSVLine = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result;
    };

    // Parse headers
    const headerValues = parseCSVLine(lines[0]);
    const headers = headerValues.map((h) => h.trim().toLowerCase());

    console.log("🔍 CSV Headers found:", headers);

    const errors = [];
    const insertedLedgers = [];
    const insertErrors = [];

    // Validate headers
    const requiredHeaders = ["business_name"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required headers: ${missingHeaders.join(
            ", "
          )}. Found headers: ${headers.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const rowData = {};

        headers.forEach((header, index) => {
          rowData[header] = values[index] || "";
        });

        console.log(`🔍 Processing row ${i + 1}:`, rowData);

        // Validate required fields
        if (!rowData.business_name || !rowData.business_name.trim()) {
          errors.push(`Row ${i + 1}: Missing or empty business_name`);
          continue;
        }

        // Check if business name already exists (skip if exists)
        const { data: existingLedger } = await supabase
          .from("ledgers")
          .select("ledger_id")
          .ilike("business_name", rowData.business_name.trim())
          .single();

        if (existingLedger) {
          console.log(
            `⚠️ Row ${i + 1}: Business name "${
              rowData.business_name
            }" already exists - skipping`
          );
          errors.push(
            `Row ${i + 1}: Business name "${
              rowData.business_name
            }" already exists - skipping`
          );
          continue;
        } else {
          console.log(
            `✅ Row ${i + 1}: Business name "${
              rowData.business_name
            }" is unique - proceeding`
          );
        }

        // Validate email if provided
        if (rowData.email && rowData.email.trim()) {
          const email = rowData.email.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.log(`❌ Row ${i + 1}: Invalid email format: ${email}`);
            errors.push(`Row ${i + 1}: Invalid email format: ${email}`);
            continue;
          }
        }

        // Validate GST number if provided
        if (rowData.gst_number && rowData.gst_number.trim()) {
          const gstNumber = rowData.gst_number.replace(/\s/g, "").toUpperCase();
          if (gstNumber && !/^[0-9A-Z]{15}$/.test(gstNumber)) {
            console.log(
              `❌ Row ${i + 1}: Invalid GST number format: ${gstNumber}`
            );
            errors.push(
              `Row ${
                i + 1
              }: Invalid GST number format: ${gstNumber}. Must be 15 alphanumeric characters`
            );
            continue;
          }
        }

        // Validate PAN number if provided
        if (rowData.pan_number && rowData.pan_number.trim()) {
          const panNumber = rowData.pan_number.replace(/\s/g, "").toUpperCase();
          if (panNumber && !/^[0-9A-Z]{10}$/.test(panNumber)) {
            console.log(
              `❌ Row ${i + 1}: Invalid PAN number format: ${panNumber}`
            );
            errors.push(
              `Row ${
                i + 1
              }: Invalid PAN number format: ${panNumber}. Must be 10 alphanumeric characters`
            );
            continue;
          }
        }

        console.log(
          `✅ Row ${i + 1}: All validations passed - preparing to insert`
        );

        // Generate unique ledger_id
        const ledger_id = `LDG-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`;

        // Prepare insert data
        const insertData = {
          ledger_id,
          business_name: rowData.business_name.trim(),
          contact_person_name: rowData.contact_person_name?.trim() || null,
          mobile_number: rowData.mobile_number?.trim() || null,
          email: rowData.email?.trim() || null,
          address: rowData.address?.trim() || null,
          city: rowData.city?.trim() || null,
          district: rowData.district?.trim() || null,
          state: rowData.state?.trim() || null,
          country: rowData.country?.trim() || "India",
          zip_code: rowData.zip_code?.trim() || null,
          gst_number:
            rowData.gst_number?.replace(/\s/g, "").toUpperCase() || null,
          pan_number:
            rowData.pan_number?.replace(/\s/g, "").toUpperCase() || null,
          business_logo: rowData.business_logo?.trim() || null,
          created_by: user.id,
        };

        console.log(`🔍 Inserting ledger:`, insertData);

        // Insert ledger
        const { data: insertedLedger, error } = await supabase
          .from("ledgers")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error inserting row ${i + 1}:`, error);
          insertErrors.push(`Row ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Successfully inserted row ${i + 1}:`, insertedLedger);
          insertedLedgers.push(insertedLedger);
        }
      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error);
        insertErrors.push(
          `Row ${i + 1}: Failed to process row - ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    const allErrors = [...errors, ...insertErrors];

    console.log(`📊 Import Summary:`, {
      total: lines.length - 1,
      imported: insertedLedgers.length,
      errors: allErrors.length,
      errorDetails: allErrors,
      skippedRows: lines.length - 1 - insertedLedgers.length - allErrors.length,
    });

    // Always return errors for debugging, even if empty
    return NextResponse.json({
      message: `Successfully imported ${insertedLedgers.length} of ${
        lines.length - 1
      } ledgers`,
      imported: insertedLedgers.length,
      total: lines.length - 1,
      errors: allErrors.length > 0 ? allErrors : [],
      skipped: lines.length - 1 - insertedLedgers.length - allErrors.length,
      ledgers: insertedLedgers,
      debug: {
        totalRows: lines.length - 1,
        successfulInserts: insertedLedgers.length,
        validationErrors: errors.length,
        insertErrors: insertErrors.length,
      },
    });
  } catch (error) {
    console.error("Error in ledgers bulk import:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/admin/ledgers/bulk - Export ledgers to CSV
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters for filtering
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const has_gst = searchParams.get("has_gst") || "";

    // Build query
    let query = supabase.from("ledgers").select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,contact_person_name.ilike.%${search}%,email.ilike.%${search}%,mobile_number.ilike.%${search}%`
      );
    }

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    if (state) {
      query = query.ilike("state", `%${state}%`);
    }

    if (has_gst !== "") {
      if (has_gst === "true") {
        query = query.not("gst_number", "is", null);
      } else {
        query = query.is("gst_number", null);
      }
    }

    const { data: ledgers, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching ledgers for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch ledgers" },
        { status: 500 }
      );
    }

    // Generate CSV
    const headers = [
      "Ledger ID",
      "Business Name",
      "Contact Person",
      "Mobile Number",
      "Email",
      "Address",
      "City",
      "District",
      "State",
      "Country",
      "ZIP Code",
      "GST Number",
      "PAN Number",
      "Business Logo",
      "Created At",
      "Updated At",
    ];

    const csvRows = [
      headers.join(","),
      ...(ledgers || []).map((ledger) =>
        [
          `"${(ledger.ledger_id || "").replace(/"/g, '""')}"`,
          `"${(ledger.business_name || "").replace(/"/g, '""')}"`,
          `"${(ledger.contact_person_name || "").replace(/"/g, '""')}"`,
          `"${(ledger.mobile_number || "").replace(/"/g, '""')}"`,
          `"${(ledger.email || "").replace(/"/g, '""')}"`,
          `"${(ledger.address || "").replace(/"/g, '""')}"`,
          `"${(ledger.city || "").replace(/"/g, '""')}"`,
          `"${(ledger.district || "").replace(/"/g, '""')}"`,
          `"${(ledger.state || "").replace(/"/g, '""')}"`,
          `"${(ledger.country || "").replace(/"/g, '""')}"`,
          `"${(ledger.zip_code || "").replace(/"/g, '""')}"`,
          `"${(ledger.gst_number || "").replace(/"/g, '""')}"`,
          `"${(ledger.pan_number || "").replace(/"/g, '""')}"`,
          `"${(ledger.business_logo || "").replace(/"/g, '""')}"`,
          `"${(ledger.created_at || "").replace(/"/g, '""')}"`,
          `"${(ledger.updated_at || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="ledgers_export_${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Error in ledgers bulk export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
