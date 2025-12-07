import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrdersContentEnhanced } from "@/components/orders/orders-content-enhanced";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function OrdersPage() {
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
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/onboarding");
  }

  // Check if user has access to orders
  const typedProfile = profile as Profile;
  if (
    typedProfile.user_role !== "Admin" &&
    typedProfile.user_role !== "Order Managing Executive"
  ) {
    redirect("/dashboard");
  }

  // Fetch orders data
  const ordersResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/orders`,
    {
      cache: "no-store",
    }
  );

  let orders = [];
  if (ordersResponse.ok) {
    const ordersResult = await ordersResponse.json();
    orders = ordersResult.data || [];
  } else {
    console.error("Error fetching orders:", ordersResponse.statusText);
  }

  return (
    <OrdersContentEnhanced
      orders={orders}
      userRole={typedProfile.user_role}
      profile={profile as any}
    />
  );
}
