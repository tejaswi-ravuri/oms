import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentVoucherFormData } from "@/types/production";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("payment_vouchers")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("payment_date", { ascending: false });

    if (search) {
      query = query.or(
        `voucher_no.ilike.%${search}%,remarks.ilike.%${search}%,reference_no.ilike.%${search}%`
      );
    }

    const { data: vouchers, error, count } = await query;

    if (error) {
      console.error("Error fetching payment vouchers:", error);
      return NextResponse.json(
        { error: "Failed to fetch payment vouchers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: vouchers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in payment vouchers GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: PaymentVoucherFormData = await request.json();

    // Validate required fields
    const requiredFields = ["voucher_no", "payment_date", "payment_mode", "amount"];
    const missingFields = requiredFields.filter((field) => !body[field as keyof PaymentVoucherFormData]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Only include ledger_id if it's provided and not empty
    const insertData: any = {
      voucher_no: body.voucher_no,
      payment_date: body.payment_date,
      amount: body.amount,
      payment_mode: body.payment_mode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they have values
    if (body.ledger_id && body.ledger_id.trim() !== "") {
      insertData.ledger_id = body.ledger_id;
    }
    // Note: payment_for field is not in database yet, so we skip it for now
    if (body.reference_no && body.reference_no.trim() !== "") {
      insertData.reference_no = body.reference_no;
    }
    if (body.remarks && body.remarks.trim() !== "") {
      insertData.remarks = body.remarks;
    }

    const { data: voucher, error } = await supabase
      .from("payment_vouchers")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating payment voucher:", error);
      return NextResponse.json(
        { error: "Failed to create payment voucher" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: voucher }, { status: 201 });
  } catch (error) {
    console.error("Error in payment vouchers POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}