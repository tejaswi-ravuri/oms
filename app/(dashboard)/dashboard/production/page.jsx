import { ProductionDashboardContent } from "@/components/production/production-dashboard-content";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProductionDashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch analytics data from the new API
  const analyticsResponse = await fetch(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/production/analytics`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  let analyticsData = null;

  if (analyticsResponse.ok) {
    try {
      analyticsData = await analyticsResponse.json();
    } catch (error) {
      console.error("Error parsing analytics data:", error);
    }
  } else {
    console.error(
      "Error fetching analytics data:",
      analyticsResponse.statusText
    );
  }

  return <ProductionDashboardContent analyticsData={analyticsData} />;
}
