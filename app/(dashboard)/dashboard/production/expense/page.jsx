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
import { ExpenseForm } from "@/components/forms/expense-form";
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
  Receipt,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    expenseType: "all",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch expenses with pagination and filters
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.expenseType && filters.expenseType !== "all") {
        params.append("expenseType", filters.expenseType);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/production/expenses?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch expenses");
      }

      setExpenses(result.data || []);
      setTotalExpenses(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle expense creation/update
  const handleExpenseSubmit = async (expenseData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingExpense?.id
        ? `/api/production/expenses/${editingExpense.id}`
        : "/api/production/expenses";

      const method = editingExpense?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save expense");
      }

      await fetchExpenses();
      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle expense deletion
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`/api/production/expenses/${expenseId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete expense");
      }

      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  // Download expenses as CSV
  const downloadExpensesCsv = async () => {
    try {
      setLoading(true);

      // Fetch all expenses without pagination
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.expenseType && filters.expenseType !== "all") {
        params.append("expenseType", filters.expenseType);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(`/api/production/expenses?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch expenses");
      }

      const headers = [
        "Expense Date",
        "Expense Type",
        "Challan No",
        "Challan Type",
        "Description",
        "Cost",
        "Paid To",
        "Payment Mode",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((expense) =>
          [
            expense.expense_date || "",
            expense.expense_type || "",
            expense.challan_no || "",
            expense.challan_type || "",
            expense.description || "",
            expense.cost || "",
            expense.paid_to || "",
            expense.payment_mode || "",
            expense.created_at || "",
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
      a.download = `expenses_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getExpenseTypeBadgeColor = (type) => {
    switch (type) {
      case "Transport":
        return "bg-blue-100 text-blue-800";
      case "Labor":
        return "bg-green-100 text-green-800";
      case "Job Work":
        return "bg-purple-100 text-purple-800";
      case "Material":
        return "bg-orange-100 text-orange-800";
      case "Other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentModeBadgeColor = (mode) => {
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
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground">
            Track and manage production expenses
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadExpensesCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
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
                  placeholder="Search expenses..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expenseType">Expense Type</Label>
              <Select
                value={filters.expenseType}
                onValueChange={(value) =>
                  setFilters({ ...filters, expenseType: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Labor">Labor</SelectItem>
                  <SelectItem value="Job Work">Job Work</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
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

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Challan No</TableHead>
              <TableHead>Paid To</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Payment Mode</TableHead>
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
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getExpenseTypeBadgeColor(
                        expense.expense_type || ""
                      )}`}
                    >
                      {expense.expense_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div
                      className="max-w-xs truncate"
                      title={expense.description}
                    >
                      {expense.description || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-blue-600">
                      {expense.challan_no || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{expense.paid_to || "-"}</TableCell>
                  <TableCell className="font-semibold">
                    <div className="flex items-center space-x-1">
                      <span>₹{expense.cost}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentModeBadgeColor(
                        expense.payment_mode || ""
                      )}`}
                    >
                      {expense.payment_mode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingExpense(expense)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          expense.id && handleDeleteExpense(expense.id)
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
        {!loading && expenses.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalExpenses)} of{" "}
              {totalExpenses} expenses
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

      {/* Expense Form Dialog */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        editingExpense={editingExpense}
        isLoading={isSubmitting}
      />

      {/* View Expense Details Dialog */}
      <Dialog
        open={!!viewingExpense}
        onOpenChange={() => setViewingExpense(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-6">
              {/* Expense Header */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingExpense.expense_type} Expense
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(viewingExpense.expense_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Expense Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Expense Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Expense Type:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getExpenseTypeBadgeColor(
                          viewingExpense.expense_type || ""
                        )}`}
                      >
                        {viewingExpense.expense_type}
                      </span>
                    </div>
                    <div>
                      <strong>Description:</strong>{" "}
                      {viewingExpense.description || "No description"}
                    </div>
                    <div>
                      <strong>Challan No:</strong>{" "}
                      {viewingExpense.challan_no || "N/A"}
                    </div>
                    <div>
                      <strong>Challan Type:</strong>{" "}
                      {viewingExpense.challan_type || "N/A"}
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
                      <strong>Cost:</strong>
                      <span className="ml-2 font-semibold text-lg">
                        ₹{viewingExpense.cost}
                      </span>
                    </div>
                    <div>
                      <strong>Paid To:</strong>{" "}
                      {viewingExpense.paid_to || "N/A"}
                    </div>
                    <div>
                      <strong>Payment Mode:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPaymentModeBadgeColor(
                          viewingExpense.payment_mode || ""
                        )}`}
                      >
                        {viewingExpense.payment_mode}
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
                    {viewingExpense.created_at
                      ? new Date(viewingExpense.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {viewingExpense.updated_at
                      ? new Date(viewingExpense.updated_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewingExpense(null)}
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
