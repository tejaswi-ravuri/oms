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
import { WeaverChallanForm } from "@/components/forms/weaver-challan-form";
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
  Truck,
  Calendar,
  DollarSign,
  FileText,
  Package,
} from "lucide-react";
import { WeaverChallan, Ledger, Purchase } from "@/types/production";
import { createClient } from "@/lib/supabase/client";

interface Filters {
  search: string;
  status: string;
  materialType: string;
  startDate: string;
  endDate: string;
}

const ITEMS_PER_PAGE = 10;

export default function WeaverChallanPage() {
  const [weaverChallans, setWeaverChallans] = useState<WeaverChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState<WeaverChallan | null>(
    null
  );
  const [viewingChallan, setViewingChallan] = useState<WeaverChallan | null>(
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
    materialType: "all",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [weavers, setWeavers] = useState<Ledger[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Fetch weaver challans with pagination and filters
  const fetchWeaverChallans = useCallback(async () => {
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
      if (filters.materialType && filters.materialType !== "all") {
        params.append("materialType", filters.materialType);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/production/weaver-challans?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch weaver challans");
      }

      setWeaverChallans(result.data || []);
      setTotalChallans(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch weaver challans"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchWeaverChallans();
  }, [fetchWeaverChallans]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch weavers and purchases when component mounts
  useEffect(() => {
    fetchWeavers();
    fetchPurchases();
  }, []);

  // Fetch weavers from API
  const fetchWeavers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ledgers")
        .select("ledger_id, business_name")
        .order("business_name");

      if (error) {
        console.error("Error fetching weavers:", error);
        return;
      }

      console.log("Fetched weavers in page:", data); // Debug log
      setWeavers(data || []);
    } catch (error) {
      console.error("Error fetching weavers:", error);
    }
  };

  // Fetch purchases from API
  const fetchPurchases = async () => {
    try {
      const response = await fetch("/api/production/purchases?limit=100");
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching purchases:", result.error);
        return;
      }

      setPurchases(result.data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  // Handle weaver challan creation/update
  const handleChallanSubmit = async (challanData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingChallan?.id
        ? `/api/production/weaver-challans/${editingChallan.id}`
        : "/api/production/weaver-challans";

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
        throw new Error(result.error || "Failed to save weaver challan");
      }

      await fetchWeaverChallans();
      setIsFormOpen(false);
      setEditingChallan(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save weaver challan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle weaver challan deletion
  const handleDeleteChallan = async (challanId: number) => {
    if (!confirm("Are you sure you want to delete this weaver challan?"))
      return;

    try {
      const response = await fetch(
        `/api/production/weaver-challans/${challanId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete weaver challan");
      }

      await fetchWeaverChallans();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete weaver challan"
      );
    }
  };

  // Download weaver challans as CSV
  const downloadWeaverChallansCsv = async () => {
    try {
      setLoading(true);

      // Fetch all challans without pagination
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.materialType && filters.materialType !== "all") {
        params.append("materialType", filters.materialType);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(`/api/production/weaver-challans?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch weaver challans");
      }

      const headers = [
        "Challan No",
        "Challan Date",
        "Purchase ID",
        "Weaver Ledger ID",
        "Material Type",
        "Quantity Sent (meters)",
        "Quantity Received (meters)",
        "Weaving Loss (meters)",
        "Loss Percentage",
        "Rate per Meter",
        "Vendor Amount",
        "Transport Name",
        "LR Number",
        "Transport Charge",
        "Status",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((challan: WeaverChallan) =>
          [
            challan.challan_no || "",
            challan.challan_date || "",
            challan.purchase_id || "",
            challan.weaver_ledger_id || "",
            challan.material_type || "",
            challan.quantity_sent_meters || "",
            challan.quantity_received_meters || "",
            challan.weaving_loss_meters || "",
            challan.loss_percentage || "",
            challan.rate_per_meter || "",
            challan.vendor_amount || "",
            challan.transport_name || "",
            challan.lr_number || "",
            challan.transport_charge || "",
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
      a.download = `weaver_challans_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export weaver challans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Received":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Weaver Challan Management</h1>
          <p className="text-muted-foreground">
            Track cloth sent to weavers and monitor fabric production
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadWeaverChallansCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Weaver Challan
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Weaver Challans Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challan No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Weaver</TableHead>
              <TableHead>Material Type</TableHead>
              <TableHead>Sent (m)</TableHead>
              <TableHead>Received (m)</TableHead>
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
            ) : weaverChallans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  No weaver challans found
                </TableCell>
              </TableRow>
            ) : (
              weaverChallans.map((challan) => (
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
                  <TableCell>{challan.weaver_ledger_id}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {challan.material_type}
                    </span>
                  </TableCell>
                  <TableCell>{challan.quantity_sent_meters}</TableCell>
                  <TableCell>{challan.quantity_received_meters}</TableCell>
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
        {!loading && weaverChallans.length > 0 && (
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

      {/* Weaver Challan Form Dialog */}
      <WeaverChallanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChallan(null);
        }}
        onSubmit={handleChallanSubmit}
        editingChallan={editingChallan}
        isLoading={isSubmitting}
        weavers={weavers}
        purchases={purchases}
      />

      {/* View Weaver Challan Details Dialog */}
      <Dialog
        open={!!viewingChallan}
        onOpenChange={() => setViewingChallan(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Weaver Challan Details</DialogTitle>
          </DialogHeader>
          {viewingChallan && (
            <div className="space-y-6">
              {/* Challan Header */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Truck className="w-6 h-6 text-blue-600" />
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
                      <strong>Weaver:</strong> {viewingChallan.weaver_ledger_id}
                    </div>
                    <div>
                      <strong>Material Type:</strong>{" "}
                      {viewingChallan.material_type}
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
                      {viewingChallan.quantity_sent_meters} meters
                    </div>
                    <div>
                      <strong>Quantity Received:</strong>{" "}
                      {viewingChallan.quantity_received_meters} meters
                    </div>
                    <div>
                      <strong>Weaving Loss:</strong>{" "}
                      {viewingChallan.weaving_loss_meters} meters
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

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Rate per Meter:</strong> ₹
                      {viewingChallan.rate_per_meter}
                    </div>
                    <div>
                      <strong>Vendor Amount:</strong> ₹
                      {viewingChallan.vendor_amount}
                    </div>
                    <div>
                      <strong>Transport Charge:</strong> ₹
                      {viewingChallan.transport_charge}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Transport Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Transport Name:</strong>{" "}
                      {viewingChallan.transport_name || "N/A"}
                    </div>
                    <div>
                      <strong>LR Number:</strong>{" "}
                      {viewingChallan.lr_number || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Additional Information</h4>
                <div className="space-y-2 text-sm">
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

              <div className="flex justify-end">
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
