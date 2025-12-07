"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Eye,
  Edit,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UnifiedInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("User");
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("all");
  const [quality, setQuality] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [editing, setEditing] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selected, setSelected] = useState(new Set());
  const [sortKey, setSortKey] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [toast, setToast] = useState(null);

  const canEdit = ["Admin", "Inventory Manager", "Production Manager"].includes(
    userRole
  );

  const notify = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch inventory data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inventory/items?limit=1000");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch inventory items");
      }

      setItems(result.data || []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      notify("Failed to load inventory data", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      const s = search.toLowerCase();
      const searchMatch =
        !search ||
        i.inventory_number.toLowerCase().includes(s) ||
        i.challan_no.toLowerCase().includes(s) ||
        i.product_name.toLowerCase().includes(s) ||
        i.product_sku.toLowerCase().includes(s);
      const classMatch =
        classification === "all" || i.classification === classification;
      const qualMatch = quality === "all" || i.quality === quality;
      const dateMatch =
        (!dateStart || i.date >= dateStart) && (!dateEnd || i.date <= dateEnd);
      return searchMatch && classMatch && qualMatch && dateMatch;
    });
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [
    items,
    search,
    classification,
    quality,
    dateStart,
    dateEnd,
    sortKey,
    sortOrder,
  ]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const analytics = useMemo(() => {
    const good = filtered.filter((i) => i.classification === "good");
    const bad = filtered.filter((i) => i.classification === "bad");
    const wastage = filtered.filter((i) => i.classification === "wastage");
    const totalCost = filtered.reduce((s, i) => s + i.total_cost, 0);
    const totalQty = filtered.reduce((s, i) => s + i.quantity, 0);
    return {
      total: { count: filtered.length, cost: totalCost, qty: totalQty },
      good: {
        count: good.length,
        cost: good.reduce((s, i) => s + i.total_cost, 0),
        qty: good.reduce((s, i) => s + i.quantity, 0),
      },
      bad: {
        count: bad.length,
        cost: bad.reduce((s, i) => s + i.total_cost, 0),
        qty: bad.reduce((s, i) => s + i.quantity, 0),
      },
      wastage: {
        count: wastage.length,
        cost: wastage.reduce((s, i) => s + i.total_cost, 0),
        qty: wastage.reduce((s, i) => s + i.quantity, 0),
      },
      wastagePerc:
        totalQty > 0
          ? (wastage.reduce((s, i) => s + i.quantity, 0) / totalQty) * 100
          : 0,
      goodPerc:
        totalQty > 0
          ? (good.reduce((s, i) => s + i.quantity, 0) / totalQty) * 100
          : 0,
      defectPerc:
        totalQty > 0
          ? ((bad.reduce((s, i) => s + i.quantity, 0) +
              wastage.reduce((s, i) => s + i.quantity, 0)) /
              totalQty) *
            100
          : 0,
    };
  }, [filtered]);

  const qualities = useMemo(
    () => Array.from(new Set(items.map((i) => i.quality))).sort(),
    [items]
  );

  const updateClass = async (id, newClass) => {
    try {
      const res = await fetch("/api/inventory/update-classification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, classification: newClass }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, classification: newClass } : i
          )
        );
        notify("Updated successfully", "success");
      } else notify("Update failed", "error");
    } catch (e) {
      notify("Error occurred", "error");
    }
  };

  const bulkUpdate = async (newClass) => {
    for (const id of Array.from(selected)) await updateClass(id, newClass);
    setSelected(new Set());
  };

  const saveEdit = async (item) => {
    try {
      const res = await fetch("/api/inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
        notify("Saved successfully", "success");
        setShowEdit(false);
        setEditing(null);
      } else notify("Save failed", "error");
    } catch (e) {
      notify("Error occurred", "error");
    }
  };

  const badge = (c) => {
    const styles = {
      good: "bg-green-100 text-green-700",
      bad: "bg-yellow-100 text-yellow-700",
      wastage: "bg-red-100 text-red-700",
      unclassified: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={styles[c]} variant="secondary">
        {c.charAt(0).toUpperCase() + c.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            } text-white`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Unified Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            Complete inventory with cost analytics and wastage tracking
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.total.count}
                </div>
                <div className="text-sm text-gray-600">Total Items</div>
                <div className="text-xs text-gray-500">
                  {analytics.total.qty} pieces
                </div>
              </div>
              <Package className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
            <div className="mt-2 text-sm font-semibold text-blue-600">
              ₹
              {analytics.total.cost.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.good.count}
                </div>
                <div className="text-sm text-gray-600">Good Inventory</div>
                <div className="text-xs text-gray-500">
                  {analytics.goodPerc.toFixed(1)}% efficiency
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
            <div className="mt-2 text-sm font-semibold text-green-600">
              ₹
              {analytics.good.cost.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {analytics.bad.count}
                </div>
                <div className="text-sm text-gray-600">Bad Inventory</div>
                <div className="text-xs text-gray-500">
                  {analytics.bad.qty} pieces
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
            <div className="mt-2 text-sm font-semibold text-yellow-600">
              ₹
              {analytics.bad.cost.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.wastage.count}
                </div>
                <div className="text-sm text-gray-600">Wastage</div>
                <div className="text-xs text-gray-500">
                  {analytics.wastagePerc.toFixed(1)}% loss
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 opacity-50" />
            </div>
            <div className="mt-2 text-sm font-semibold text-red-600">
              ₹
              {analytics.wastage.cost.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Cost Analysis & Loss Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">
                Manufacturing Efficiency
              </div>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${analytics.goodPerc}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-3 text-sm font-semibold">
                  {analytics.goodPerc.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Defect Rate</div>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${analytics.defectPerc}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-3 text-sm font-semibold">
                  {analytics.defectPerc.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Total Loss</div>
              <div className="text-2xl font-bold text-red-600">
                ₹
                {(analytics.bad.cost + analytics.wastage.cost).toLocaleString(
                  "en-IN",
                  { maximumFractionDigits: 2 }
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Bad + Wastage combined
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search inventory #, challan, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Classification</Label>
              <Select
                value={classification}
                onValueChange={(v) => setClassification(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="bad">Bad</SelectItem>
                  <SelectItem value="wastage">Wastage</SelectItem>
                  <SelectItem value="unclassified">Unclassified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quality</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {qualities.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-sm text-gray-600">
              Showing {paginated.length} of {filtered.length} items
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setClassification("all");
                setQuality("all");
                setDateStart("");
                setDateEnd("");
                setSearch("");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {canEdit && selected.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                {selected.size} item(s) selected
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdate("good")}
                >
                  Mark as Good
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdate("bad")}
                >
                  Mark as Bad
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdate("wastage")}
                >
                  Mark as Wastage
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {canEdit && (
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={
                          selected.size === paginated.length &&
                          paginated.length > 0
                        }
                        onCheckedChange={() =>
                          selected.size === paginated.length
                            ? setSelected(new Set())
                            : setSelected(new Set(paginated.map((i) => i.id)))
                        }
                      />
                    </th>
                  )}
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => setSortKey("inventory_number")}
                  >
                    Inv#{" "}
                    {sortKey === "inventory_number" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => setSortKey("challan_no")}
                  >
                    Challan{" "}
                    {sortKey === "challan_no" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => setSortKey("date")}
                  >
                    Date{" "}
                    {sortKey === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Quality</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Price/Pc</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    {canEdit && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(i.id)}
                          onCheckedChange={() => {
                            const n = new Set(selected);
                            n.has(i.id) ? n.delete(i.id) : n.add(i.id);
                            setSelected(n);
                          }}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono font-medium">
                      {i.inventory_number}
                    </td>
                    <td className="px-4 py-3 font-mono">{i.challan_no}</td>
                    <td className="px-4 py-3">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {i.date ? new Date(i.date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{i.product_name}</div>
                      <div className="text-xs text-gray-500">
                        {i.product_sku}
                      </div>
                    </td>
                    <td className="px-4 py-3">{i.quality}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {i.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {i.price_per_piece > 0
                        ? `₹${i.price_per_piece.toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {i.total_cost > 0 ? `₹${i.total_cost.toFixed(2)}` : "N/A"}
                    </td>
                    <td className="px-4 py-3">{badge(i.classification)}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(i);
                              setShowEdit(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(i);
                                setShowEdit(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center p-4 border-t">
            <div className="flex items-center gap-2">
              <Label>Per page:</Label>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => {
                  setPerPage(parseInt(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update inventory details, classification, and costs
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Inventory Number</Label>
                <Input
                  value={editing.inventory_number}
                  disabled
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Classification</Label>
                <Select
                  value={editing.classification}
                  onValueChange={(v) =>
                    setEditing({ ...editing, classification: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="bad">Bad</SelectItem>
                    <SelectItem value="wastage">Wastage</SelectItem>
                    <SelectItem value="unclassified">Unclassified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={editing.quantity}
                  onChange={(e) => {
                    const q = parseInt(e.target.value) || 0;
                    setEditing({
                      ...editing,
                      quantity: q,
                      total_cost: q * editing.price_per_piece,
                    });
                  }}
                />
              </div>
              <div>
                <Label>Price per Piece (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.price_per_piece}
                  onChange={(e) => {
                    const p = parseFloat(e.target.value) || 0;
                    setEditing({
                      ...editing,
                      price_per_piece: p,
                      total_cost: p * editing.quantity,
                    });
                  }}
                  placeholder="Cost data not available"
                />
              </div>
              <div>
                <Label>Quality</Label>
                <Input
                  value={editing.quality}
                  onChange={(e) =>
                    setEditing({ ...editing, quality: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Total Cost (₹)</Label>
                <Input
                  value={
                    editing.total_cost > 0
                      ? editing.total_cost.toFixed(2)
                      : "N/A"
                  }
                  disabled
                  className="font-mono font-semibold"
                />
              </div>
              <div className="col-span-2">
                <Label>Product</Label>
                <Input
                  value={`${editing.product_name} (${editing.product_sku})`}
                  disabled
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEdit(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => saveEdit(editing)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
