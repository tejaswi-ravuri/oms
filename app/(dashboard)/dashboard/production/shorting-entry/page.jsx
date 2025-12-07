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
import { ShortingEntryForm } from "@/components/forms/shorting-entry-form";
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
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function ShortingEntryPage() {
  const [shortingEntries, setShortingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    batchNumber: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch shorting entries with pagination and filters
  const fetchShortingEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.batchNumber)
        params.append("batchNumber", filters.batchNumber);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(
        `/api/production/shorting-entries?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch shorting entries");
      }

      setShortingEntries(result.data || []);
      setTotalEntries(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch shorting entries"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchShortingEntries();
  }, [fetchShortingEntries]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle shorting entry creation/update
  const handleEntrySubmit = async (entryData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingEntry?.id
        ? `/api/production/shorting-entries/${editingEntry.id}`
        : "/api/production/shorting-entries";

      const method = editingEntry?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save shorting entry");
      }

      await fetchShortingEntries();
      setIsFormOpen(false);
      setEditingEntry(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save shorting entry"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle shorting entry deletion
  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Are you sure you want to delete this shorting entry?"))
      return;

    try {
      const response = await fetch(
        `/api/production/shorting-entries/${entryId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete shorting entry");
      }

      await fetchShortingEntries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete shorting entry"
      );
    }
  };

  // Download shorting entries as CSV
  const downloadShortingEntriesCsv = async () => {
    try {
      setLoading(true);

      // Fetch all entries without pagination
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.batchNumber)
        params.append("batchNumber", filters.batchNumber);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(
        `/api/production/shorting-entries?${params}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch shorting entries");
      }

      const headers = [
        "Entry No",
        "Entry Date",
        "Weaver Challan ID",
        "Purchase ID",
        "Material Type",
        "Batch Number",
        "Total Pieces",
        "Good Pieces",
        "Damaged Pieces",
        "Rejected Pieces",
        "Size Breakdown",
        "Remarks",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((entry) =>
          [
            entry.entry_no || "",
            entry.entry_date || "",
            entry.weaver_challan_id || "",
            entry.purchase_id || "",
            entry.material_type || "",
            entry.batch_number || "",
            entry.total_pieces || "",
            entry.good_pieces || "",
            entry.damaged_pieces || "",
            entry.rejected_pieces || "",
            JSON.stringify(entry.size_breakdown || {}),
            entry.remarks || "",
            entry.created_at || "",
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
      a.download = `shorting_entries_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export shorting entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getQualityRate = (entry) => {
    if (!entry.total_pieces) return "0"; // Return "0" as string instead of 0
    return (((entry.good_pieces || 0) / entry.total_pieces) * 100).toFixed(1);
  };

  const getQualityBadgeColor = (rate) => {
    const rateNum = parseFloat(rate);
    if (rateNum >= 90) return "bg-green-100 text-green-800";
    if (rateNum >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shorting Entry Management</h1>
          <p className="text-muted-foreground">
            Quality check and piece-wise breakdown after weaving
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadShortingEntriesCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shorting Entry
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
                  placeholder="Search entries..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                placeholder="Enter batch number"
                value={filters.batchNumber}
                onChange={(e) =>
                  setFilters({ ...filters, batchNumber: e.target.value })
                }
              />
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

      {/* Shorting Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entry No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Material Type</TableHead>
              <TableHead>Total Pieces</TableHead>
              <TableHead>Good</TableHead>
              <TableHead>Damaged</TableHead>
              <TableHead>Rejected</TableHead>
              <TableHead>Quality Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : shortingEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-gray-500"
                >
                  No shorting entries found
                </TableCell>
              </TableRow>
            ) : (
              shortingEntries.map((entry) => {
                const qualityRate = getQualityRate(entry);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.entry_no}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {entry.batch_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {entry.material_type}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {entry.total_pieces}
                    </TableCell>
                    <TableCell className="text-green-600">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>{entry.good_pieces || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-yellow-600">
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{entry.damaged_pieces}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-red-600">
                      <div className="flex items-center space-x-1">
                        <XCircle className="w-4 h-4" />
                        <span>{entry.rejected_pieces}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(
                          qualityRate
                        )}`}
                      >
                        {qualityRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingEntry(entry)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            entry.id && handleDeleteEntry(entry.id)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && shortingEntries.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalEntries)} of{" "}
              {totalEntries} entries
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

      {/* Shorting Entry Form Dialog */}
      <ShortingEntryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={handleEntrySubmit}
        editingEntry={editingEntry}
        isLoading={isSubmitting}
        weaverChallans={[]} // TODO: Fetch weaver challans from API
        purchases={[]} // TODO: Fetch purchases from API
      />

      {/* View Shorting Entry Details Dialog */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shorting Entry Details</DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-6">
              {/* Entry Header */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingEntry.entry_no}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(viewingEntry.entry_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Entry Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Entry Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Batch Number:</strong> {viewingEntry.batch_number}
                    </div>
                    <div>
                      <strong>Material Type:</strong>{" "}
                      {viewingEntry.material_type}
                    </div>
                    <div>
                      <strong>Weaver Challan ID:</strong>{" "}
                      {viewingEntry.weaver_challan_id || "N/A"}
                    </div>
                    <div>
                      <strong>Purchase ID:</strong>{" "}
                      {viewingEntry.purchase_id || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Quality Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Pieces:</span>
                      <span className="font-semibold">
                        {viewingEntry.total_pieces}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Good Pieces:</span>
                      <span className="font-semibold">
                        {viewingEntry.good_pieces}
                      </span>
                    </div>
                    <div className="flex justify-between text-yellow-600">
                      <span>Damaged Pieces:</span>
                      <span className="font-semibold">
                        {viewingEntry.damaged_pieces}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Rejected Pieces:</span>
                      <span className="font-semibold">
                        {viewingEntry.rejected_pieces}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Rate:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(
                          getQualityRate(viewingEntry)
                        )}`}
                      >
                        {getQualityRate(viewingEntry)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Size Breakdown */}
              {viewingEntry.size_breakdown && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Size Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(viewingEntry.size_breakdown).map(
                      ([size, quantity]) => (
                        <div
                          key={size}
                          className="bg-gray-50 p-2 rounded text-sm"
                        >
                          <div className="font-medium">{size}</div>
                          <div className="text-gray-600">{quantity} pieces</div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Additional Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Remarks:</strong>{" "}
                    {viewingEntry.remarks || "No remarks"}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {viewingEntry.created_at
                      ? new Date(viewingEntry.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {viewingEntry.updated_at
                      ? new Date(viewingEntry.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewingEntry(null)}>
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
