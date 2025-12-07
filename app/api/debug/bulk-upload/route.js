import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    // Parse CSV function
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

    // Parse sample rows (first 3 data rows)
    const sampleRows = [];
    for (let i = 1; i < Math.min(4, lines.length); i++) {
      const values = parseCSVLine(lines[i]);
      const rowData = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || "";
      });

      sampleRows.push({
        rowNumber: i + 1,
        data: rowData,
      });
    }

    // Check database connection
    const { data: testLedger, error: testError } = await supabase
      .from("ledgers")
      .select("ledger_id, business_name")
      .limit(1);

    return NextResponse.json({
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        totalLines: lines.length,
      },
      headers: {
        raw: headerValues,
        normalized: headers,
      },
      sampleRows,
      databaseTest: {
        connected: !testError,
        sampleData: testLedger,
        error: testError?.message,
      },
      validation: {
        hasBusinessName: headers.includes("business_name"),
        requiredHeaders: ["business_name"],
        missingHeaders: ["business_name"].filter((h) => !headers.includes(h)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
