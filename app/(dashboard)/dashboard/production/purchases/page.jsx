"use client";
import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PurchaseForm } from "@/components/forms/purchase-form";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    materialType: "all",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch purchases with pagination and filters
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.materialType && filters.materialType !== "all") {
        params.append("materialType", filters.materialType);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/production/purchases?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch purchases");
      }

      setPurchases(result.data || []);
      setTotalPurchases(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch purchases"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle purchase creation/update
  const handlePurchaseSubmit = async (purchaseData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingPurchase?.id
        ? `/api/production/purchases/${editingPurchase.id}`
        : "/api/production/purchases";

      const method = editingPurchase?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save purchase");
      }

      await fetchPurchases();
      setIsFormOpen(false);
      setEditingPurchase(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle purchase deletion
  const handleDeletePurchase = async (purchaseId) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;

    try {
      const response = await fetch(`/api/production/purchases/${purchaseId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete purchase");
      }

      await fetchPurchases();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete purchase"
      );
    }
  };

  // Download purchases as CSV
  const downloadPurchasesCsv = async () => {
    try {
      setLoading(true);

      // Fetch all purchases without pagination
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.materialType && filters.materialType !== "all") {
        params.append("materialType", filters.materialType);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(`/api/production/purchases?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch purchases");
      }

      const headers = [
        "Purchase No",
        "Purchase Date",
        "Vendor Ledger ID",
        "Material Type",
        "Total Meters",
        "Rate Per Meter",
        "Total Amount",
        "GST Percent",
        "Invoice Number",
        "Remarks",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((purchase) =>
          [
            purchase.purchase_no || "",
            purchase.purchase_date || "",
            purchase.vendor_ledger_id || "",
            purchase.material_type || "",
            purchase.total_meters || "",
            purchase.rate_per_meter || "",
            purchase.total_amount || "",
            purchase.gst_percent || "",
            purchase.invoice_number || "",
            purchase.remarks || "",
            purchase.created_at || "",
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purchases_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === "Active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Management</h1>
          <p className="text-muted-foreground">
            Manage raw material purchases and vendor relationships
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadPurchasesCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search purchases..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="materialType">Material Type</Label>
              <Select
                value={filters.materialType}
                onValueChange={(value) =>
                  setFilters({ ...filters, materialType: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All materials</SelectItem>
                  <SelectItem value="Cotton">Cotton</SelectItem>
                  <SelectItem value="Silk">Silk</SelectItem>
                  <SelectItem value="Wool">Wool</SelectItem>
                  <SelectItem value="Polyester">Polyester</SelectItem>
                  <SelectItem value="Linen">Linen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Material Type</TableHead>
              <TableHead>Total Meters</TableHead>
              <TableHead>Rate/Meter</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  No purchases found
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.purchase_no}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(purchase.purchase_date).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{purchase.vendor_ledger_id}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {purchase.material_type}
                    </span>
                  </TableCell>
                  <TableCell>{purchase.total_meters} m</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span>₹{purchase.rate_per_meter}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{purchase.total_amount}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingPurchase(purchase)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPurchase(purchase);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          purchase.id && handleDeletePurchase(purchase.id)
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && purchases.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalPurchases)} of{" "}
              {totalPurchases} purchases
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="flex items-center px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Purchase Form Dialog */}
      <PurchaseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPurchase(null);
        }}
        onSubmit={handlePurchaseSubmit}
        editingPurchase={editingPurchase}
        isLoading={isSubmitting}
        vendors={[]} // TODO: Fetch vendors from ledgers API
      />

      {/* View Purchase Details Dialog */}
      <Dialog
        open={!!viewingPurchase}
        onOpenChange={() => setViewingPurchase(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-6">
              {/* Purchase Header */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingPurchase.purchase_no}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(
                      viewingPurchase.purchase_date
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Purchase Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Purchase Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Vendor:</strong>{" "}
                      {viewingPurchase.vendor_ledger_id}
                    </div>
                    <div>
                      <strong>Material Type:</strong>{" "}
                      {viewingPurchase.material_type}
                    </div>
                    <div>
                      <strong>Invoice Number:</strong>{" "}
                      {viewingPurchase.invoice_number || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Total Meters:</strong>{" "}
                      {viewingPurchase.total_meters} m
                    </div>
                    <div>
                      <strong>Rate per Meter:</strong> ₹
                      {viewingPurchase.rate_per_meter}
                    </div>
                    <div>
                      <strong>Total Amount:</strong> ₹
                      {viewingPurchase.total_amount}
                    </div>
                    <div>
                      <strong>GST:</strong> {viewingPurchase.gst_percent}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Additional Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Remarks:</strong>{" "}
                    {viewingPurchase.remarks || "No remarks"}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {viewingPurchase.created_at
                      ? new Date(viewingPurchase.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {viewingPurchase.updated_at
                      ? new Date(viewingPurchase.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewingPurchase(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
