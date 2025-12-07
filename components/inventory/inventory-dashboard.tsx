"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

type IsteachingChallan =
  Database["public"]["Tables"]["stitching_challans"]["Row"] & {
    ledgers?: {
      business_name: string;
    };
    products?: {
      product_name: string;
      product_sku: string;
      cost_price?: number;
      selling_price?: number;
    };
  } & {
    inventory_classification:
      | "good"
      | "bad"
      | "wastage"
      | "shorting"
      | "unclassified"
      | null;
    top_qty: number | null;
    bottom_qty: number | null;
    both_selected: boolean | null;
  };

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["user_role"];

interface InventoryDashboardProps {
  userRole: UserRole;
}

interface InventoryAlert {
  id: string;
  type: "low_stock" | "high_wastage" | "cost_anomaly" | "quality_issue";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  itemId?: number;
  itemName?: string;
  timestamp: string;
  acknowledged: boolean;
}

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  goodInventory: number;
  badInventory: number;
  wastageInventory: number;
  shortageInventory: number;
  lowStockItems: number;
  criticalStockItems: number;
  totalCost: number;
  potentialRevenue: number;
  wastageCost: number;
  qualityScore: number;
}

export function InventoryDashboard({ userRole }: InventoryDashboardProps) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  const canManage = userRole === "Admin" || userRole === "Inventory Manager";

  useEffect(() => {
    fetchInventoryData();
    const interval = setInterval(fetchInventoryData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch inventory data using only existing columns
      const { data: inventoryData, error } = await supabase
        .from("stitching_challans")
        .select("*");

      if (error) throw error;

      const processedData = inventoryData as any[];

      // Calculate metrics
      const calculatedMetrics = calculateMetrics(processedData);
      setMetrics(calculatedMetrics);

      // Generate alerts
      const generatedAlerts = generateAlerts(processedData, calculatedMetrics);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data: any[]): InventoryMetrics => {
    // Determine classification based on quality field since inventory_classification doesn't exist
    const getClassification = (item: any) => {
      const quality = (item.quality || "").toLowerCase();
      if (["a", "b", "premium", "good"].includes(quality)) return "good";
      if (["c", "d", "poor", "bad"].includes(quality)) return "bad";
      if (["waste", "damaged", "rejected"].includes(quality)) return "wastage";
      return "unclassified";
    };

    const goodInventory = data.filter(
      (item) => getClassification(item) === "good"
    );
    const badInventory = data.filter(
      (item) => getClassification(item) === "bad"
    );
    const wastageInventory = data.filter(
      (item) => getClassification(item) === "wastage"
    );
    const shortageInventory = []; // No shortage classification in current data

    // Calculate total values - no cost data available in stitching_challans
    const totalCost = 0;
    const totalValue = 0;
    const wastageCost = 0;

    // Calculate quality score (0-100)
    const totalClassified =
      goodInventory.length + badInventory.length + wastageInventory.length;
    const qualityScore =
      totalClassified > 0
        ? Math.round((goodInventory.length / totalClassified) * 100)
        : 0;

    // Identify low stock items (less than 10 quantity)
    const lowStockItems = goodInventory.filter(
      (item) => (item.quantity || 0) < 10
    ).length;
    const criticalStockItems = goodInventory.filter(
      (item) => (item.quantity || 0) < 5
    ).length;

    return {
      totalItems: data.length,
      totalValue,
      goodInventory: goodInventory.length,
      badInventory: badInventory.length,
      wastageInventory: wastageInventory.length,
      shortageInventory: shortageInventory.length,
      lowStockItems,
      criticalStockItems,
      totalCost,
      potentialRevenue: totalValue - totalCost,
      wastageCost,
      qualityScore,
    };
  };

  const generateAlerts = (
    data: IsteachingChallan[],
    metrics: InventoryMetrics
  ): InventoryAlert[] => {
    const alerts: InventoryAlert[] = [];
    const now = new Date().toISOString();

    // Low stock alerts
    const lowStockItems = data.filter(
      (item) =>
        item.inventory_classification === "good" && (item.quantity || 0) < 10
    );

    lowStockItems.forEach((item) => {
      alerts.push({
        id: `low_stock_${item.id}`,
        type: "low_stock",
        title: "Low Stock Alert",
        description: `${item.products?.product_name || "Item"} has only ${
          item.quantity
        } units remaining`,
        severity: (item.quantity || 0) < 5 ? "critical" : "medium",
        itemId: item.id,
        itemName: item.products?.product_name,
        timestamp: now,
        acknowledged: false,
      });
    });

    // High wastage alerts
    if (metrics.wastageCost > metrics.totalCost * 0.1) {
      alerts.push({
        id: "high_wastage_cost",
        type: "high_wastage",
        title: "High Wastage Cost",
        description: `Wastage cost (${metrics.wastageCost.toFixed(
          2
        )}) exceeds 10% of total inventory value`,
        severity: "high",
        timestamp: now,
        acknowledged: false,
      });
    }

    // Quality score alerts
    if (metrics.qualityScore < 70) {
      alerts.push({
        id: "low_quality_score",
        type: "quality_issue",
        title: "Low Quality Score",
        description: `Overall quality score is ${metrics.qualityScore}%, below recommended 70%`,
        severity: metrics.qualityScore < 50 ? "critical" : "medium",
        timestamp: now,
        acknowledged: false,
      });
    }

    // Critical stock alerts
    if (metrics.criticalStockItems > 0) {
      alerts.push({
        id: "critical_stock_items",
        type: "low_stock",
        title: "Critical Stock Levels",
        description: `${metrics.criticalStockItems} items have less than 5 units remaining`,
        severity: "critical",
        timestamp: now,
        acknowledged: false,
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast.success("Alert acknowledged");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Package className="h-4 w-4" />;
      case "high_wastage":
        return <TrendingDown className="h-4 w-4" />;
      case "cost_anomaly":
        return <DollarSign className="h-4 w-4" />;
      case "quality_issue":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          Unable to load inventory metrics. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time inventory insights and cost analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventoryData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {unacknowledgedAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unacknowledgedAlerts.length} Active Alerts
            </Badge>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts ({unacknowledgedAlerts.length})
          </h3>
          <div className="grid gap-2">
            {unacknowledgedAlerts.slice(0, 3).map((alert) => (
              <Alert
                key={alert.id}
                className={getSeverityColor(alert.severity)}
              >
                {getAlertIcon(alert.type)}
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.title}</span>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="h-6 px-2"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                </AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            ))}
          </div>
          {unacknowledgedAlerts.length > 3 && (
            <Button variant="outline" size="sm" className="w-full">
              View All {unacknowledgedAlerts.length} Alerts
            </Button>
          )}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
          <TabsTrigger value="quality-metrics">Quality Metrics</TabsTrigger>
          <TabsTrigger value="alerts">All Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Items
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.goodInventory} good, {metrics.badInventory} bad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{metrics.totalValue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Potential profit: ₹{metrics.potentialRevenue.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quality Score
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.qualityScore}%
                </div>
                <Progress value={metrics.qualityScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Items
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.criticalStockItems} critical
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Classification</CardTitle>
                <CardDescription>
                  Distribution of inventory by classification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Good Inventory</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(metrics.goodInventory / metrics.totalItems) * 100}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {metrics.goodInventory}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bad Inventory</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(metrics.badInventory / metrics.totalItems) * 100}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {metrics.badInventory}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wastage</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        (metrics.wastageInventory / metrics.totalItems) * 100
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {metrics.wastageInventory}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Shortage</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        (metrics.shortageInventory / metrics.totalItems) * 100
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {metrics.shortageInventory}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>
                  Financial overview of inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="text-sm font-bold">
                    ₹{metrics.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Potential Revenue</span>
                  <span className="text-sm font-bold text-green-600">
                    +₹{metrics.totalValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wastage Cost</span>
                  <span className="text-sm font-bold text-red-600">
                    -₹{metrics.wastageCost.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Net Profit Potential
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{metrics.potentialRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Revenue Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ₹{metrics.totalValue.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on current selling prices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Total Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ₹{metrics.totalCost.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total cost of all inventory
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Wastage Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ₹{metrics.wastageCost.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {((metrics.wastageCost / metrics.totalCost) * 100).toFixed(1)}
                  % of total cost
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality-metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
                <CardDescription>
                  Breakdown of inventory quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">
                        Good Quality
                      </span>
                      <span className="text-sm font-bold">
                        {(
                          (metrics.goodInventory / metrics.totalItems) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(metrics.goodInventory / metrics.totalItems) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-600">
                        Bad Quality
                      </span>
                      <span className="text-sm font-bold">
                        {(
                          (metrics.badInventory / metrics.totalItems) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(metrics.badInventory / metrics.totalItems) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-600">
                        Wastage
                      </span>
                      <span className="text-sm font-bold">
                        {(
                          (metrics.wastageInventory / metrics.totalItems) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (metrics.wastageInventory / metrics.totalItems) * 100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Score Analysis</CardTitle>
                <CardDescription>
                  Overall inventory health assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold">
                    <span
                      className={
                        metrics.qualityScore >= 70
                          ? "text-green-600"
                          : metrics.qualityScore >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    >
                      {metrics.qualityScore}%
                    </span>
                  </div>
                  <div>
                    {metrics.qualityScore >= 70 ? (
                      <Badge className="bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    ) : metrics.qualityScore >= 50 ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Needs Improvement
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        Critical
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {metrics.qualityScore >= 70
                      ? "Your inventory quality is excellent!"
                      : metrics.qualityScore >= 50
                      ? "Consider quality improvement measures."
                      : "Immediate action required for quality improvement."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-green-600">
                      All Clear!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No active alerts at this time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  className={getSeverityColor(alert.severity)}
                >
                  {getAlertIcon(alert.type)}
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {!alert.acknowledged && canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="h-6 px-2"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
