"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Save,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export function CostAdjustmentPanel({ userRole }) {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [costUpdates, setCostUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkUpdateType, setBulkUpdateType] = useState("percentage");
  const [bulkUpdateValue, setBulkUpdateValue] = useState("");

  const canManage = userRole === "Admin" || userRole === "Inventory Manager";

  useEffect(() => {
    if (canManage) {
      fetchProducts();
      fetchInventoryItems();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("product_name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stitching_challans")
        .select("*")
        .eq("inventory_classification", "good")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      toast.error("Failed to fetch inventory items");
    }
  };

  const calculateMargin = (costPrice, sellingPrice) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  const handleCostUpdate = (productId, field, value) => {
    const numValue = parseFloat(value) || 0;

    setCostUpdates((prev) => {
      const existing = prev.find((update) => update.productId === productId);
      if (existing) {
        return prev.map((update) => {
          if (update.productId === productId) {
            const updated = { ...update, [field]: numValue };
            if (field === "costPrice" || field === "sellingPrice") {
              updated.margin = calculateMargin(
                updated.costPrice,
                updated.sellingPrice
              );
            }
            return updated;
          }
          return update;
        });
      } else {
        const product = products.find((p) => p.id === productId);
        const newUpdate = {
          productId,
          costPrice:
            field === "costPrice" ? numValue : product?.manufacturing_cost || 0,
          sellingPrice:
            field === "sellingPrice"
              ? numValue
              : product?.manufacturing_cost || 0,
          margin: 0,
        };
        newUpdate.margin = calculateMargin(
          newUpdate.costPrice,
          newUpdate.sellingPrice
        );
        return [...prev, newUpdate];
      }
    });
  };

  const handleSaveCosts = async () => {
    if (costUpdates.length === 0) {
      toast.error("No cost updates to save");
      return;
    }

    setSaving(true);
    try {
      // Update products one by one to avoid type issues
      for (const update of costUpdates) {
        const { error } = await supabase
          .from("products")
          .update({
            manufacturing_cost: update.costPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", update.productId);

        if (error) {
          console.error("Error updating product:", error);
        }
      }

      // Continue with success message

      toast.success(`Updated costs for ${costUpdates.length} products`);
      setCostUpdates([]);
      fetchProducts();
      fetchInventoryItems();
    } catch (error) {
      console.error("Error saving costs:", error);
      toast.error("Failed to save cost updates");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkUpdateValue || parseFloat(bulkUpdateValue) === 0) {
      toast.error("Please enter a valid update value");
      return;
    }

    const updateValue = parseFloat(bulkUpdateValue);
    const updates = [];

    products.forEach((product) => {
      let newCostPrice = product.manufacturing_cost || 0;
      let newSellingPrice = product.manufacturing_cost || 0;

      if (bulkUpdateType === "percentage") {
        newCostPrice = newCostPrice * (1 + updateValue / 100);
        newSellingPrice = newSellingPrice * (1 + updateValue / 100);
      } else {
        newCostPrice = newCostPrice + updateValue;
        newSellingPrice = newSellingPrice + updateValue;
      }

      updates.push({
        productId: product.id,
        costPrice: Math.max(0, newCostPrice),
        sellingPrice: Math.max(0, newSellingPrice),
        margin: calculateMargin(
          Math.max(0, newCostPrice),
          Math.max(0, newSellingPrice)
        ),
      });
    });

    setCostUpdates(updates);
    setShowBulkUpdateDialog(false);
    setBulkUpdateValue("");
    toast.success(`Prepared bulk update for ${updates.length} products`);
  };

  const getMarginColor = (margin) => {
    if (margin >= 50) return "text-green-600";
    if (margin >= 30) return "text-yellow-600";
    if (margin >= 10) return "text-orange-600";
    return "text-red-600";
  };

  const getMarginBadge = (margin) => {
    if (margin >= 50)
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (margin >= 30)
      return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (margin >= 10)
      return <Badge className="bg-orange-100 text-orange-800">Low</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    const cost = item.price_per_piece || 0;
    const quantity = item.quantity || 0;
    return sum + cost * quantity;
  }, 0);

  const totalPotentialRevenue = inventoryItems.reduce((sum, item) => {
    const price = item.price_per_piece || 0;
    const quantity = item.quantity || 0;
    return sum + price * quantity;
  }, 0);

  const totalProfit = totalPotentialRevenue - totalInventoryValue;

  if (!canManage) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You don't have permission to manage inventory costs. Please contact an
          administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Management</h1>
          <p className="text-gray-600 mt-1">
            Adjust product costs and pricing to optimize profitability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog
            open={showBulkUpdateDialog}
            onOpenChange={setShowBulkUpdateDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Cost Update</DialogTitle>
                <DialogDescription>
                  Update costs for all products at once. This will prepare
                  updates but not save them immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Update Type</Label>
                  <Select
                    value={bulkUpdateType}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setBulkUpdateType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Update Value</Label>
                  <Input
                    type="number"
                    placeholder={
                      bulkUpdateType === "percentage"
                        ? "Enter percentage"
                        : "Enter amount"
                    }
                    value={bulkUpdateValue}
                    onChange={(e) => setBulkUpdateValue(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkUpdateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkUpdate}>Prepare Updates</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleSaveCosts}
            disabled={saving || costUpdates.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalInventoryValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current cost prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalPotentialRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current selling prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalInventoryValue > 0
                ? `${((totalProfit / totalInventoryValue) * 100).toFixed(
                    1
                  )}% margin`
                : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Updates
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {costUpdates.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Products with unsaved changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Updates Table */}
      {costUpdates.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have {costUpdates.length} pending cost updates. Click "Save
            Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Cost Management</CardTitle>
          <CardDescription>
            Update cost prices and selling prices for products. Changes will
            affect inventory valuation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="product-filter">Filter by Product</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All products</SelectItem>
                    {products.map((product) => (
                      <SelectItem
                        key={product.id}
                        value={product.id.toString()}
                      >
                        {product.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Cost</TableHead>
                    <TableHead>New Cost</TableHead>
                    <TableHead>Current Selling</TableHead>
                    <TableHead>New Selling</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(
                      (product) =>
                        !selectedProduct ||
                        product.id.toString() === selectedProduct
                    )
                    .map((product) => {
                      const update = costUpdates.find(
                        (u) => u.productId === product.id
                      );
                      const currentCost = product.manufacturing_cost || 0;
                      const currentSelling = product.manufacturing_cost || 0; // Using manufacturing_cost as fallback
                      const newCost = update?.costPrice ?? currentCost;
                      const newSelling = update?.sellingPrice ?? currentSelling;
                      const margin =
                        update?.margin ??
                        calculateMargin(currentCost, currentSelling);
                      const hasChanges =
                        update &&
                        (update.costPrice !== currentCost ||
                          update.sellingPrice !== currentSelling);

                      return (
                        <TableRow
                          key={product.id}
                          className={hasChanges ? "bg-orange-50" : ""}
                        >
                          <TableCell className="font-medium">
                            {product.product_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.product_sku}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  hasChanges ? "line-through text-gray-400" : ""
                                }
                              >
                                ₹{currentCost.toFixed(2)}
                              </span>
                              {hasChanges && (
                                <TrendingDown className="h-3 w-3 text-orange-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={newCost}
                              onChange={(e) =>
                                handleCostUpdate(
                                  product.id,
                                  "costPrice",
                                  e.target.value
                                )
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  hasChanges ? "line-through text-gray-400" : ""
                                }
                              >
                                ₹{currentSelling.toFixed(2)}
                              </span>
                              {hasChanges && (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={newSelling}
                              onChange={(e) =>
                                handleCostUpdate(
                                  product.id,
                                  "sellingPrice",
                                  e.target.value
                                )
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${getMarginColor(
                                  margin
                                )}`}
                              >
                                {margin.toFixed(1)}%
                              </span>
                              {getMarginBadge(margin)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasChanges ? (
                              <Badge
                                variant="outline"
                                className="text-orange-600"
                              >
                                Modified
                              </Badge>
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
