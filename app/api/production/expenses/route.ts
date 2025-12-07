import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ExpenseFormData } from "@/types/production";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("expense_date", { ascending: false });

    if (search) {
      query = query.or(
        `challan_no.ilike.%${search}%,description.ilike.%${search}%,paid_to.ilike.%${search}%`
      );
    }

    const { data: expenses, error, count } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      return NextResponse.json(
        { error: "Failed to fetch expenses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: expenses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in expenses GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: ExpenseFormData = await request.json();

    // Validate required fields
    const requiredFields = ["expense_date", "expense_type", "cost"];
    const missingFields = requiredFields.filter((field) => !body[field as keyof ExpenseFormData]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Only include fields that have values
    const insertData: any = {
      expense_date: body.expense_date,
      expense_type: body.expense_type,
      cost: body.cost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they have values
    if (body.challan_no && body.challan_no.trim() !== "") {
      insertData.challan_no = body.challan_no;
    }
    if (body.challan_type && body.challan_type.trim() !== "") {
      insertData.challan_type = body.challan_type;
    }
    if (body.description && body.description.trim() !== "") {
      insertData.description = body.description;
    }
    if (body.paid_to && body.paid_to.trim() !== "") {
      insertData.paid_to = body.paid_to;
    }
    if (body.payment_mode && body.payment_mode.trim() !== "") {
      insertData.payment_mode = body.payment_mode;
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return NextResponse.json(
        { error: "Failed to create expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    console.error("Error in expenses POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}