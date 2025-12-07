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
import { StitchingChallanForm } from "@/components/forms/stitching-challan-form";
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
  Users,
  Calendar,
  DollarSign,
  FileText,
  Package,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { StitchingChallan } from "@/types/production";

interface Filters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

const ITEMS_PER_PAGE = 10;

export default function StitchingChallanPage() {
  const [stitchingChallans, setStitchingChallans] = useState<
    StitchingChallan[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState<StitchingChallan | null>(
    null
  );
  const [viewingChallan, setViewingChallan] = useState<StitchingChallan | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChallans, setTotalChallans] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch stitching challans with pagination and filters
  const fetchStitchingChallans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(
        `/api/production/stitching-challans?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch stitching challans");
      }

      setStitchingChallans(result.data || []);
      setTotalChallans(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch stitching challans"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchStitchingChallans();
  }, [fetchStitchingChallans]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle stitching challan creation/update
  const handleChallanSubmit = async (challanData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingChallan?.id
        ? `/api/production/stitching-challans/${editingChallan.id}`
        : "/api/production/stitching-challans";

      const method = editingChallan?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(challanData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save stitching challan");
      }

      await fetchStitchingChallans();
      setIsFormOpen(false);
      setEditingChallan(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save stitching challan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle stitching challan deletion
  const handleDeleteChallan = async (challanId: number) => {
    if (!confirm("Are you sure you want to delete this stitching challan?"))
      return;

    try {
      const response = await fetch(
        `/api/production/stitching-challans/${challanId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete stitching challan");
      }

      await fetchStitchingChallans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete stitching challan"
      );
    }
  };

  // Handle convert to inventory
  const handleConvertToInventory = async (challanId: number) => {
    if (
      !confirm(
        "Are you sure you want to convert this challan to inventory? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/production/stitching-challans/${challanId}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to convert to inventory");
      }

      await fetchStitchingChallans();
      alert("Successfully converted to inventory!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to convert to inventory"
      );
    }
  };

  // Download stitching challans as CSV
  const downloadStitchingChallansCsv = async () => {
    try {
      setLoading(true);

      // Fetch all challans without pagination
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(
        `/api/production/stitching-challans?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch stitching challans");
      }

      const headers = [
        "Challan No",
        "Challan Date",
        "Ledger ID",
        "Product Name",
        "Product SKU",
        "Batch Numbers",
        "Quantity Sent",
        "Quantity Received",
        "Stitching Loss",
        "Loss Percentage",
        "Rate per Piece",
        "Amount Payable",
        "Status",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((challan: StitchingChallan) =>
          [
            challan.challan_no || "",
            challan.challan_date || "",
            challan.ledger_id || "",
            challan.product_name || "",
            challan.product_sku || "",
            (challan.batch_numbers || []).join(";"),
            challan.quantity_sent || "",
            challan.quantity_received || "",
            challan.stitching_loss || "",
            challan.loss_percentage || "",
            challan.rate_per_piece || "",
            challan.amount_payable || "",
            challan.status || "",
            challan.created_at || "",
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
      a.download = `stitching_challans_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export stitching challans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "QC Pending":
        return "bg-blue-100 text-blue-800";
      case "QC Done":
        return "bg-purple-100 text-purple-800";
      case "Converted":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stitching Challan Management</h1>
          <p className="text-muted-foreground">
            Manage stitching challans and quality control
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadStitchingChallansCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Stitching Challan
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
                  placeholder="Search challans..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="QC Pending">QC Pending</SelectItem>
                  <SelectItem value="QC Done">QC Done</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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

      {/* Stitching Challans Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challan No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Stitching Unit</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Loss %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : stitchingChallans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  No stitching challans found
                </TableCell>
              </TableRow>
            ) : (
              stitchingChallans.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell className="font-medium">
                    {challan.challan_no}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(challan.challan_date).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{challan.ledger_id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {challan.product_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {challan.product_sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{challan.quantity_sent}</TableCell>
                  <TableCell>{challan.quantity_received || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${
                        (challan.loss_percentage || 0) > 5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {challan.loss_percentage?.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        challan.status || ""
                      )}`}
                    >
                      {challan.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingChallan(challan)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingChallan(challan);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {challan.status === "QC Done" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            challan.id && handleConvertToInventory(challan.id)
                          }
                          className="text-green-600 hover:text-green-700"
                          title="Convert to Inventory"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          challan.id && handleDeleteChallan(challan.id)
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
        {!loading && stitchingChallans.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalChallans)} of{" "}
              {totalChallans} challans
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

      {/* Stitching Challan Form Dialog */}
      <StitchingChallanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChallan(null);
        }}
        onSubmit={handleChallanSubmit}
        editingChallan={editingChallan}
        isLoading={isSubmitting}
      />

      {/* View Stitching Challan Details Dialog */}
      <Dialog
        open={!!viewingChallan}
        onOpenChange={() => setViewingChallan(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stitching Challan Details</DialogTitle>
          </DialogHeader>
          {viewingChallan && (
            <div className="space-y-6">
              {/* Challan Header */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingChallan.challan_no}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(viewingChallan.challan_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Challan Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Challan Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Stitching Unit:</strong>{" "}
                      {viewingChallan.ledger_id}
                    </div>
                    <div>
                      <strong>Product Name:</strong>{" "}
                      {viewingChallan.product_name}
                    </div>
                    <div>
                      <strong>Product SKU:</strong> {viewingChallan.product_sku}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          viewingChallan.status || ""
                        )}`}
                      >
                        {viewingChallan.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Quantity Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Quantity Sent:</strong>{" "}
                      {viewingChallan.quantity_sent}
                    </div>
                    <div>
                      <strong>Quantity Received:</strong>{" "}
                      {viewingChallan.quantity_received || "N/A"}
                    </div>
                    <div>
                      <strong>Stitching Loss:</strong>{" "}
                      {viewingChallan.stitching_loss || "N/A"}
                    </div>
                    <div>
                      <strong>Loss Percentage:</strong>
                      <span
                        className={`ml-2 font-semibold ${
                          (viewingChallan.loss_percentage || 0) > 5
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {viewingChallan.loss_percentage?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Numbers */}
              {viewingChallan.batch_numbers &&
                viewingChallan.batch_numbers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Batch Numbers</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingChallan.batch_numbers.map((batch, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                        >
                          {batch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Rate per Piece:</strong> ₹
                      {viewingChallan.rate_per_piece || "N/A"}
                    </div>
                    <div>
                      <strong>Amount Payable:</strong> ₹
                      {viewingChallan.amount_payable || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Quality Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Good:</span>
                      <span className="font-semibold text-green-600">
                        {viewingChallan.total_good || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Bad:</span>
                      <span className="font-semibold text-yellow-600">
                        {viewingChallan.total_bad || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Wastage:</span>
                      <span className="font-semibold text-red-600">
                        {viewingChallan.total_wastage || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Additional Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Transport Name:</strong>{" "}
                    {viewingChallan.transport_name || "N/A"}
                  </div>
                  <div>
                    <strong>LR Number:</strong>{" "}
                    {viewingChallan.lr_number || "N/A"}
                  </div>
                  <div>
                    <strong>Transport Charge:</strong> ₹
                    {viewingChallan.transport_charge || "0"}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {viewingChallan.created_at
                      ? new Date(viewingChallan.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {viewingChallan.updated_at
                      ? new Date(viewingChallan.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {viewingChallan.status === "QC Done" && (
                  <Button
                    onClick={() =>
                      viewingChallan.id &&
                      handleConvertToInventory(viewingChallan.id)
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Convert to Inventory
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setViewingChallan(null)}
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
