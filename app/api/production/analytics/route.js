import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get raw material stock
    const { data: rawMaterialStock } = await supabase.rpc('fn_get_raw_material_stock');

    // Get material in production
    const { data: materialInProduction } = await supabase.rpc('fn_get_material_in_production');

    // Get finished goods
    const { data: finishedGoods } = await supabase.rpc('fn_get_finished_goods');

    // Get production efficiency
    const { data: productionEfficiency } = await supabase.rpc('fn_get_production_efficiency');

    // Get monthly expenses (last 6 months)
    const { data: monthlyExpenses } = await supabase.rpc('fn_get_monthly_expenses', { months_back: 6 });

    // Get ledger dues
    const { data: ledgerDues } = await supabase.rpc('fn_get_ledger_dues');

    // Get top products
    const { data: topProducts } = await supabase.rpc('fn_get_top_products', { limit_count: 10 });

    const analyticsData = {
      rawMaterialStock: rawMaterialStock || [],
      materialInProduction: materialInProduction || [],
      finishedGoods: finishedGoods || [],
      productionEfficiency: productionEfficiency || [],
      monthlyExpenses: monthlyExpenses || [],
      ledgerDues: ledgerDues || [],
      topProducts: topProducts || [],
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching production analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch production analytics" },
      { status: 500 }
    );
  }
}