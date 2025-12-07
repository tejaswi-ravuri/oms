import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: purchase, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching purchase:", error);
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: purchase });
  } catch (error) {
    console.error("Error in purchase GET:", error);
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

    // Check if purchase exists
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id, purchase_no")
      .eq("id", id)
      .single();

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Check if purchase number conflicts with another record
    if (body.purchase_no && body.purchase_no !== existingPurchase.purchase_no) {
      const { data: conflictingPurchase } = await supabase
        .from("purchases")
        .select("purchase_no")
        .eq("purchase_no", body.purchase_no)
        .neq("id", id)
        .single();

      if (conflictingPurchase) {
        return NextResponse.json(
          { error: "Purchase with this number already exists" },
          { status: 409 }
        );
      }
    }

    const { data: purchase, error } = await supabase
      .from("purchases")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchase:", error);
      return NextResponse.json(
        { error: "Failed to update purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: purchase });
  } catch (error) {
    console.error("Error in purchase PUT:", error);
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

    // Check if purchase exists
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("purchases").delete().eq("id", id);

    if (error) {
      console.error("Error deleting purchase:", error);
      return NextResponse.json(
        { error: "Failed to delete purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    console.error("Error in purchase DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
