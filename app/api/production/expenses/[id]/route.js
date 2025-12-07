import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: expense, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching expense:", error);
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ data: expense });
  } catch (error) {
    console.error("Error in expense GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["expense_date", "expense_type", "cost"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Only include fields that have values
    const updateData = {
      expense_date: body.expense_date,
      expense_type: body.expense_type,
      cost: body.cost,
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they have values
    if (body.challan_no !== undefined) {
      updateData.challan_no = body.challan_no;
    }
    if (body.challan_type !== undefined && body.challan_type.trim() !== "") {
      updateData.challan_type = body.challan_type;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.paid_to !== undefined) {
      updateData.paid_to = body.paid_to;
    }
    if (body.payment_mode !== undefined) {
      updateData.payment_mode = body.payment_mode;
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      return NextResponse.json(
        { error: "Failed to update expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: expense });
  } catch (error) {
    console.error("Error in expense PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      return NextResponse.json(
        { error: "Failed to delete expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in expense DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
