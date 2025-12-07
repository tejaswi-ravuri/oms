import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { Calendar } from "lucide-react";
import { CurrentDateDisplay } from "@/components/ui/date-display";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, user_role, profile_photo")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  const typedProfile = profile;
  const displayName =
    typedProfile?.first_name && typedProfile?.last_name
      ? `${typedProfile.first_name} ${typedProfile.last_name}`
      : user.email?.split("@")[0] || "User";

  // Fetch dashboard statistics
  const [
    ordersResult,
    productsResult,
    ledgersResult,
    challansResult,
    expensesResult,
  ] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, status, created_at, total_amount", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, product_name, created_at", { count: "exact" })
      .eq("product_status", "active"),
    supabase
      .from("ledgers")
      .select("id, business_name, created_at", { count: "exact" }),
    supabase
      .from("weaver_challans")
      .select("id, batch_number, created_at, challan_no")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("expenses")
      .select("id, cost, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Get today's statistics
  const today = new Date().toISOString().split("T")[0];
  const [todayOrdersResult, todayExpensesResult] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, total_amount", { count: "exact" })
      .gte("created_at", today),
    supabase
      .from("expenses")
      .select("id, cost", { count: "exact", head: true })
      .gte("created_at", today),
  ]);

  // Calculate totals
  const totalOrderValue =
    ordersResult.data?.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    ) || 0;
  const todayOrderValue =
    todayOrdersResult.data?.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    ) || 0;
  const todayExpenseTotal =
    todayExpensesResult.data?.reduce(
      (sum, expense) => sum + (expense.cost || 0),
      0
    ) || 0;

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-500">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome back, {displayName}!
          </h1>
          <p className="text-xl text-muted-foreground">
            Here's what's happening with your textile business today.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <CurrentDateDisplay />
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {typedProfile?.user_role}
          </Badge>
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage
              src={typedProfile?.profile_photo || ""}
              alt={displayName}
            />
            <AvatarFallback className="text-lg font-semibold">
              {typedProfile?.first_name?.charAt(0) ||
                user.email?.charAt(0) ||
                "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Enhanced Dashboard Widgets */}
      <DashboardWidgets userRole={typedProfile?.user_role || ""} />
    </div>
  );
}
