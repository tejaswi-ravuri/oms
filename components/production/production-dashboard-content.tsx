"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Truck,
  Users,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { ProductionDashboardData } from "@/types/production";

interface ProductionDashboardContentProps {
  analyticsData: ProductionDashboardData | null;
}

export function ProductionDashboardContent({
  analyticsData,
}: ProductionDashboardContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<
    "overview" | "purchases" | "weaving" | "stitching" | "inventory"
  >("overview");

  // Calculate summary metrics
  const totalRawMaterial = useMemo(() => {
    if (!analyticsData?.rawMaterialStock) return 0;
    return analyticsData.rawMaterialStock.reduce(
      (sum, item) => sum + item.available_meters,
      0
    );
  }, [analyticsData]);

  const totalInProduction = useMemo(() => {
    if (!analyticsData?.materialInProduction) return 0;
    return analyticsData.materialInProduction.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }, [analyticsData]);

  const totalFinishedGoods = useMemo(() => {
    if (!analyticsData?.finishedGoods) return 0;
    return analyticsData.finishedGoods.reduce(
      (sum, item) => sum + item.total_quantity,
      0
    );
  }, [analyticsData]);

  const totalGoodProducts = useMemo(() => {
    if (!analyticsData?.finishedGoods) return 0;
    const goodItems = analyticsData.finishedGoods.find(
      (item) => item.condition_type === "GOOD"
    );
    return goodItems?.total_quantity || 0;
  }, [analyticsData]);

  const totalExpenses = useMemo(() => {
    if (!analyticsData?.monthlyExpenses) return 0;
    return analyticsData.monthlyExpenses.reduce(
      (sum, item) => sum + item.total_cost,
      0
    );
  }, [analyticsData]);

  const totalDues = useMemo(() => {
    if (!analyticsData?.ledgerDues) return 0;
    return analyticsData.ledgerDues.reduce(
      (sum, item) => sum + item.due_amount,
      0
    );
  }, [analyticsData]);

  const averageWeavingLoss = useMemo(() => {
    if (!analyticsData?.productionEfficiency) return 0;
    const weavingLoss = analyticsData.productionEfficiency.find(
      (item) => item.metric_name === "Average Weaving Loss %"
    );
    return weavingLoss?.value || 0;
  }, [analyticsData]);

  const averageStitchingLoss = useMemo(() => {
    if (!analyticsData?.productionEfficiency) return 0;
    const stitchingLoss = analyticsData.productionEfficiency.find(
      (item) => item.metric_name === "Average Stitching Loss %"
    );
    return stitchingLoss?.value || 0;
  }, [analyticsData]);

  const goodProductRate = useMemo(() => {
    if (!analyticsData?.productionEfficiency) return 0;
    const goodRate = analyticsData.productionEfficiency.find(
      (item) => item.metric_name === "Good Product Rate %"
    );
    return goodRate?.value || 0;
  }, [analyticsData]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Production Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Complete overview of your textile production lifecycle
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => handleNavigation("/dashboard/production/purchases")}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Purchase
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeView === "overview" ? "default" : "ghost"}
          className={activeView === "overview" ? "bg-white shadow" : ""}
          onClick={() => setActiveView("overview")}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeView === "purchases" ? "default" : "ghost"}
          className={activeView === "purchases" ? "bg-white shadow" : ""}
          onClick={() => setActiveView("purchases")}
        >
          <Package className="w-4 h-4 mr-2" />
          Purchases
        </Button>
        <Button
          variant={activeView === "weaving" ? "default" : "ghost"}
          className={activeView === "weaving" ? "bg-white shadow" : ""}
          onClick={() => setActiveView("weaving")}
        >
          <Truck className="w-4 h-4 mr-2" />
          Weaving
        </Button>
        <Button
          variant={activeView === "stitching" ? "default" : "ghost"}
          className={activeView === "stitching" ? "bg-white shadow" : ""}
          onClick={() => setActiveView("stitching")}
        >
          <Users className="w-4 h-4 mr-2" />
          Stitching
        </Button>
        <Button
          variant={activeView === "inventory" ? "default" : "ghost"}
          className={activeView === "inventory" ? "bg-white shadow" : ""}
          onClick={() => setActiveView("inventory")}
        >
          <Package className="w-4 h-4 mr-2" />
          Inventory
        </Button>
      </div>

      {activeView === "overview" && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Raw Material Stock
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalRawMaterial.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  meters available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Production
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalInProduction.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  units being processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Finished Goods
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFinishedGoods}</div>
                <p className="text-xs text-muted-foreground">total units</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Good Products
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGoodProducts}</div>
                <p className="text-xs text-muted-foreground">
                  quality units ({goodProductRate.toFixed(1)}%)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Production Efficiency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Weaving Loss
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {averageWeavingLoss.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average loss percentage
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stitching Loss
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {averageStitchingLoss.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average loss percentage
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{totalExpenses.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Raw Material Stock Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Raw Material Stock</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleNavigation("/dashboard/production/purchases")
                  }
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Type</TableHead>
                    <TableHead className="text-right">
                      Total Purchased
                    </TableHead>
                    <TableHead className="text-right">Sent to Weaver</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.rawMaterialStock?.map((stock) => (
                    <TableRow key={stock.material_type}>
                      <TableCell className="font-medium">
                        {stock.material_type}
                      </TableCell>
                      <TableCell className="text-right">
                        {stock.total_purchased_meters.toFixed(2)} m
                      </TableCell>
                      <TableCell className="text-right">
                        {stock.total_sent_to_weaver_meters.toFixed(2)} m
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            stock.available_meters < 100
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {stock.available_meters.toFixed(2)} m
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Products by Inventory</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation("/dashboard/Inventory")}
                >
                  View Inventory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Good Qty</TableHead>
                    <TableHead className="text-right">Bad Qty</TableHead>
                    <TableHead className="text-right">Waste Qty</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.topProducts?.slice(0, 5).map((product) => (
                    <TableRow key={product.product_sku}>
                      <TableCell className="font-medium">
                        {product.product_sku}
                      </TableCell>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {product.good_qty}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {product.bad_qty}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {product.waste_qty}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.total_qty}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Actions for other views */}
      {activeView !== "overview" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {activeView === "purchases" && "Purchase Management"}
                {activeView === "weaving" && "Weaving Operations"}
                {activeView === "stitching" && "Stitching Operations"}
                {activeView === "inventory" && "Inventory Management"}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeView === "purchases" &&
                  "Manage raw material purchases and vendor relationships"}
                {activeView === "weaving" &&
                  "Track weaver challans and monitor fabric production"}
                {activeView === "stitching" &&
                  "Manage stitching challans and quality control"}
                {activeView === "inventory" &&
                  "View finished goods inventory and stock levels"}
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => {
                    if (activeView === "purchases")
                      handleNavigation("/dashboard/production/purchases");
                    if (activeView === "weaving")
                      handleNavigation("/dashboard/production/weaver-challan");
                    if (activeView === "stitching")
                      handleNavigation(
                        "/dashboard/production/stitching-challan"
                      );
                    if (activeView === "inventory")
                      handleNavigation("/dashboard/Inventory");
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveView("overview")}
                >
                  Back to Overview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
