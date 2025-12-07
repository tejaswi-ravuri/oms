"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";
import { CostAdjustmentPanel } from "@/components/inventory/cost-adjustment-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  Package,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalValue: number;
  totalQuantity: number;
  lowStockProducts: number;
  categories: { name: string; count: number }[];
  qcStats: {
    passed: number;
    failed: number;
    pending: number;
    in_progress: number;
    requires_rework: number;
  };
  conversionStats: {
    converted: number;
    pending: number;
    failed: number;
  };
}

export default function InventoryAnalyticsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchProductAnalytics();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductAnalytics = async () => {
    try {
      // Fetch products analytics
      const [productsResponse, qcResponse, conversionResponse] =
        await Promise.all([
          fetch("/api/inventory/products?limit=1000"),
          fetch("/api/inventory/products/quality-check"),
          fetch("/api/inventory/products/convert"),
        ]);

      const productsData = await productsResponse.json();
      const qcData = await qcResponse.json();
      const conversionData = await conversionResponse.json();

      if (productsResponse.ok) {
        const products = productsData.data || [];
        const totalValue = products.reduce(
          (sum: number, p: any) => sum + p.selling_price * (p.product_qty || 0),
          0
        );
        const totalQuantity = products.reduce(
          (sum: number, p: any) => sum + (p.product_qty || 0),
          0
        );

        // Group by category
        const categoryMap = new Map<string, number>();
        products.forEach((p: any) => {
          const category = p.product_category || "Unknown";
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });

        const categories = Array.from(categoryMap.entries()).map(
          ([name, count]) => ({
            name,
            count,
          })
        );

        setAnalytics({
          totalProducts: products.length,
          activeProducts: products.filter(
            (p: any) => p.product_status === "Active"
          ).length,
          inactiveProducts: products.filter(
            (p: any) => p.product_status === "Inactive"
          ).length,
          totalValue,
          totalQuantity,
          lowStockProducts: products.filter(
            (p: any) => (p.product_qty || 0) < 10
          ).length,
          categories,
          qcStats: qcData.stats || {
            passed: 0,
            failed: 0,
            pending: 0,
            in_progress: 0,
            requires_rework: 0,
          },
          conversionStats: conversionData.stats || {
            converted: 0,
            pending: 0,
            failed: 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching product analytics:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Profile Not Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Unable to load your profile. Please try logging in again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManageCosts =
    profile.user_role === "Admin" || profile.user_role === "Inventory Manager";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Inventory Analytics
        </h1>
        <p className="text-gray-600 mt-1">
          Comprehensive inventory insights, cost analysis, and management tools
        </p>
      </div>

      {/* Product Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeProducts} active, {analytics.inactiveProducts}{" "}
                inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{analytics.totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalQuantity} total units
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Items
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.lowStockProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                Products with less than 10 units
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QC Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.qcStats.passed}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.qcStats.failed} failed, {analytics.qcStats.pending}{" "}
                pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
              <CardDescription>
                Distribution of products across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.categories.slice(0, 5).map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (category.count / analytics.totalProducts) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {category.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quality Check Status */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Check Status</CardTitle>
              <CardDescription>
                Current QC status of all products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Passed</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.qcStats.passed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.qcStats.failed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.qcStats.in_progress}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.qcStats.pending}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Status */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Conversion</CardTitle>
              <CardDescription>
                Product conversion to inventory status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Converted</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.conversionStats.converted}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.conversionStats.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analytics.conversionStats.failed}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common product management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/dashboard/Inventory/products")}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Manage Products
                </button>
                <button
                  onClick={() =>
                    router.push("/dashboard/Inventory/unifiedInventory")
                  }
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  View Unified Inventory
                </button>
                <button
                  onClick={() => router.push("/dashboard/Inventory/products")}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Quality Check Queue
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="cost-management"
            disabled={!canManageCosts}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Cost Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <InventoryDashboard userRole={profile.user_role} />
        </TabsContent>

        <TabsContent value="cost-management" className="space-y-6">
          {canManageCosts ? (
            <CostAdjustmentPanel userRole={profile.user_role} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Access Restricted</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You don't have permission to manage inventory costs. Please
                    contact an administrator if you need access to this feature.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
