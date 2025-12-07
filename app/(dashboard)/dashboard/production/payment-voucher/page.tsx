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
import { PaymentVoucherForm } from "@/components/forms/payment-voucher-form";
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
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { PaymentVoucher } from "@/types/production";

interface Filters {
  search: string;
  paymentMode: string;
  startDate: string;
  endDate: string;
}

const ITEMS_PER_PAGE = 10;

export default function PaymentVoucherPage() {
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<PaymentVoucher | null>(
    null
  );
  const [viewingVoucher, setViewingVoucher] = useState<PaymentVoucher | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVouchers, setTotalVouchers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: "",
    paymentMode: "all",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch payment vouchers with pagination and filters
  const fetchPaymentVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.paymentMode && filters.paymentMode !== "all") {
        params.append("paymentMode", filters.paymentMode);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(
        `/api/production/payment-vouchers?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch payment vouchers");
      }

      setPaymentVouchers(result.data || []);
      setTotalVouchers(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch payment vouchers"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchPaymentVouchers();
  }, [fetchPaymentVouchers]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle payment voucher creation/update
  const handleVoucherSubmit = async (voucherData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingVoucher?.id
        ? `/api/production/payment-vouchers/${editingVoucher.id}`
        : "/api/production/payment-vouchers";

      const method = editingVoucher?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voucherData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save payment voucher");
      }

      await fetchPaymentVouchers();
      setIsFormOpen(false);
      setEditingVoucher(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save payment voucher"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment voucher deletion
  const handleDeleteVoucher = async (voucherId: number) => {
    if (!confirm("Are you sure you want to delete this payment voucher?"))
      return;

    try {
      const response = await fetch(
        `/api/production/payment-vouchers/${voucherId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete payment voucher");
      }

      await fetchPaymentVouchers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete payment voucher"
      );
    }
  };

  // Download payment vouchers as CSV
  const downloadPaymentVouchersCsv = async () => {
    try {
      setLoading(true);

      // Fetch all vouchers without pagination
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.paymentMode && filters.paymentMode !== "all") {
        params.append("paymentMode", filters.paymentMode);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(
        `/api/production/payment-vouchers?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch payment vouchers");
      }

      const headers = [
        "ID",
        "Date",
        "Ledger ID",
        "Payment For",
        "Payment Type",
        "Amount",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((voucher: PaymentVoucher) =>
          [
            voucher.id || "",
            voucher.payment_date || "",
            voucher.ledger_id || "",
            voucher.payment_for || "",
            voucher.payment_mode || "",
            voucher.amount || "",
            voucher.created_at || "",
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
      a.download = `payment_vouchers_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export payment vouchers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentModeBadgeColor = (mode: string) => {
    switch (mode) {
      case "Cash":
        return "bg-green-100 text-green-800";
      case "Bank Transfer":
        return "bg-blue-100 text-blue-800";
      case "Cheque":
        return "bg-yellow-100 text-yellow-800";
      case "UPI":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Voucher Management</h1>
          <p className="text-muted-foreground">
            Manage payments to vendors, weavers, and stitchers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadPaymentVouchersCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Voucher
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
                  placeholder="Search vouchers..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select
                value={filters.paymentMode}
                onValueChange={(value) =>
                  setFilters({ ...filters, paymentMode: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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

      {/* Payment Vouchers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Ledger</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Payment For</TableHead>
              <TableHead>Status</TableHead>
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
            ) : paymentVouchers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  No payment vouchers found
                </TableCell>
              </TableRow>
            ) : (
              paymentVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium">#{voucher.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(voucher.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{voucher.ledger_id}</div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    <div className="flex items-center space-x-1">
                      <span>₹{voucher.amount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentModeBadgeColor(
                        voucher.payment_mode || ""
                      )}`}
                    >
                      {voucher.payment_mode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-blue-600">
                      {voucher.payment_for || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Paid</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingVoucher(voucher)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingVoucher(voucher);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          voucher.id && handleDeleteVoucher(voucher.id)
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
        {!loading && paymentVouchers.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalVouchers)} of{" "}
              {totalVouchers} vouchers
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

      {/* Payment Voucher Form Dialog */}
      <PaymentVoucherForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVoucher(null);
        }}
        onSubmit={handleVoucherSubmit}
        editingVoucher={editingVoucher}
        isLoading={isSubmitting}
        ledgers={[]} // TODO: Fetch ledgers from API
      />

      {/* View Payment Voucher Details Dialog */}
      <Dialog
        open={!!viewingVoucher}
        onOpenChange={() => setViewingVoucher(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Voucher Details</DialogTitle>
          </DialogHeader>
          {viewingVoucher && (
            <div className="space-y-6">
              {/* Voucher Header */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    Payment Voucher #{viewingVoucher.id}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(viewingVoucher.payment_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Voucher Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Voucher Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Ledger ID:</strong> {viewingVoucher.ledger_id}
                    </div>
                    <div>
                      <strong>Payment Type:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPaymentModeBadgeColor(
                          viewingVoucher.payment_mode || ""
                        )}`}
                      >
                        {viewingVoucher.payment_mode}
                      </span>
                    </div>
                    <div>
                      <strong>Payment For:</strong>{" "}
                      {viewingVoucher.payment_for || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Amount:</strong>
                      <span className="ml-2 font-semibold text-lg">
                        ₹{viewingVoucher.amount}
                      </span>
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
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
                    <strong>Created:</strong>{" "}
                    {viewingVoucher.created_at
                      ? new Date(viewingVoucher.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {viewingVoucher.updated_at
                      ? new Date(viewingVoucher.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewingVoucher(null)}
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
