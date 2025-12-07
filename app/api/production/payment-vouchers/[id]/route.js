import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: voucher, error } = await supabase
      .from("payment_vouchers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching payment voucher:", error);
      return NextResponse.json(
        { error: "Payment voucher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: voucher });
  } catch (error) {
    console.error("Error in payment voucher GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Check if voucher exists
    const { data: existingVoucher } = await supabase
      .from("payment_vouchers")
      .select("id, voucher_no")
      .eq("id", params.id)
      .single();

    if (!existingVoucher) {
      return NextResponse.json(
        { error: "Payment voucher not found" },
        { status: 404 }
      );
    }

    // Check if voucher number conflicts with another record
    if (body.voucher_no && body.voucher_no !== existingVoucher.voucher_no) {
      const { data: conflictingVoucher } = await supabase
        .from("payment_vouchers")
        .select("voucher_no")
        .eq("voucher_no", body.voucher_no)
        .neq("id", params.id)
        .single();

      if (conflictingVoucher) {
        return NextResponse.json(
          { error: "Payment voucher with this number already exists" },
          { status: 409 }
        );
      }
    }

    // Only include fields that are being updated and have valid values
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Add fields only if they are provided in the body
    if (body.voucher_no !== undefined) updateData.voucher_no = body.voucher_no;
    if (body.payment_date !== undefined)
      updateData.payment_date = body.payment_date;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.payment_mode !== undefined)
      updateData.payment_mode = body.payment_mode;

    // Only include ledger_id if it's provided and not empty
    if (body.ledger_id !== undefined && body.ledger_id.trim() !== "") {
      updateData.ledger_id = body.ledger_id;
    }

    // Add optional fields only if they have values
    if (body.reference_no !== undefined && body.reference_no.trim() !== "") {
      updateData.reference_no = body.reference_no;
    }
    if (body.remarks !== undefined && body.remarks.trim() !== "") {
      updateData.remarks = body.remarks;
    }

    const { data: voucher, error } = await supabase
      .from("payment_vouchers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment voucher:", error);
      return NextResponse.json(
        { error: "Failed to update payment voucher" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: voucher });
  } catch (error) {
    console.error("Error in payment voucher PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();

    // Check if voucher exists
    const { data: existingVoucher } = await supabase
      .from("payment_vouchers")
      .select("id")
      .eq("id", params.id)
      .single();

    if (!existingVoucher) {
      return NextResponse.json(
        { error: "Payment voucher not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("payment_vouchers")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting payment voucher:", error);
      return NextResponse.json(
        { error: "Failed to delete payment voucher" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Payment voucher deleted successfully",
    });
  } catch (error) {
    console.error("Error in payment voucher DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
