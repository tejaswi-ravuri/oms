"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { LedgerForm } from "@/components/dashboard/forms/ledger-form";
import { supabase } from "@/lib/supabase/client";
import { Ledger, LedgerFormData } from "@/types/ledgers";

// Define Profile type locally since it's not in types/supabase
interface Profile {
  id: string;
  email: string;
  user_role: string | null;
  user_status: string | null;
  first_name?: string | null;
  last_name?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  dob?: string | null;
  profile_photo?: string | null;
  created_at: string;
  updated_at: string;
}
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  X,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";

// Use the Ledger type from types/ledgers

interface Filters {
  search: string;
  city: string;
  state: string;
  has_gst: string;
}

interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

const ITEMS_PER_PAGE = 10;

export default function LedgersPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [viewingLedger, setViewingLedger] = useState<Ledger | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLedgers, setTotalLedgers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: "",
    city: "",
    state: "",
    has_gst: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sort, setSort] = useState<SortOption>({
    field: "created_at",
    direction: "desc",
  });

  // Bulk operations
  const [selectedLedgers, setSelectedLedgers] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check user permissions
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
          return;
        }

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            // Set a default user role for testing
            setCurrentUser({
              id: user.id,
              email: user.email || "",
              user_role: "Admin", // Default to Admin for testing
              user_status: "Active",
              first_name: "Test",
              last_name: "User",
              mobile: "",
              address: "",
              city: "",
              state: "",
              country: "",
              document_type: "",
              document_number: "",
              dob: "",
              profile_photo: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            setCurrentUser(profile);
          }
        }
      } catch (error) {
        console.error("Error checking user:", error);
      }
    };
    checkUser();
  }, []);
  console.log("current user----", currentUser);
  // Check if user has edit/delete permissions
  const hasEditPermissions =
    currentUser?.user_role === "Admin" || currentUser?.user_role === "Pmanager";

  // Fetch ledgers with pagination, filters, and sorting
  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.city && { city: filters.city }),
        ...(filters.state && { state: filters.state }),
        ...(filters.has_gst &&
          filters.has_gst !== "all" && { has_gst: filters.has_gst }),
        ...(sort.field && { sort: sort.field }),
        ...(sort.direction && { order: sort.direction }),
      });

      console.log("🔍 Fetching ledgers with params:", params.toString());
      const response = await fetch(`/api/admin/ledgers?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Response Error:", response.status, errorText);
        throw new Error(`Failed to fetch ledgers: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ API Response:", data);
      setLedgers(data.ledgers || []);
      setTotalLedgers(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Fetch ledgers error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch ledgers");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sort]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  // Reset pagination when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort]);

  // Handle ledger creation/update
  const handleLedgerSubmit = async (ledgerData: LedgerFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingLedger && editingLedger.ledger_id) {
        console.log("ledger edit---", editingLedger);
        // Update existing ledger
        const response = await fetch(
          `/api/admin/ledgers/${editingLedger.ledger_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ledgerData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update ledger");
        }
      } else {
        // Create new ledger
        const response = await fetch("/api/admin/ledgers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ledgerData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create ledger");
        }
      }

      // Refresh the ledgers list
      await fetchLedgers();

      // Close form and reset
      setIsFormOpen(false);
      setEditingLedger(null);
    } catch (err) {
      console.error("Ledger submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to save ledger");
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle single ledger deletion
  const handleDeleteLedger = async (ledgerId: string) => {
    if (!confirm("Are you sure you want to delete this ledger?")) return;

    try {
      const response = await fetch(`/api/admin/ledgers/${ledgerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete ledger");
      }

      await fetchLedgers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ledger");
    }
  };

  // Handle bulk ledger deletion
  const handleBulkDeleteLedgers = async () => {
    if (selectedLedgers.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/ledgers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          ledger_ids: selectedLedgers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete ledgers");
      }

      setSelectedLedgers([]);
      setShowBulkDeleteDialog(false);
      await fetchLedgers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ledgers");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle CSV upload
  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch("/api/admin/ledgers/bulk", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload CSV");
      }

      console.log("📊 Bulk upload result:", result);

      // Reset to page 1 and refresh ledgers to show new records
      setCurrentPage(1);
      await fetchLedgers();
      setCsvFile(null);

      // Clear the file input value to allow re-uploading the same file
      const fileInput = document.getElementById(
        "csv-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      // Show success message
      if (result.imported > 0) {
        const message = `Successfully imported ${result.imported} of ${result.total} ledgers`;
        setSuccess(message);
        console.log(`✅ ${message}`);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }

      // Show detailed error information
      if (result.errors && result.errors.length > 0) {
        console.log("❌ Import errors:", result.errors);
        setError(`Import issues: ${result.errors.join("; ")}`);
      }

      // Show debug information
      if (result.debug) {
        console.log("🔍 Debug info:", result.debug);
        if (result.skipped > 0) {
          console.warn(`⚠️ ${result.skipped} rows were skipped without errors`);
        }
      }
    } catch (err) {
      console.error("❌ CSV upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  // Download CSV template
  const downloadCsvTemplate = () => {
    const headers = [
      "business_name",
      "contact_person_name",
      "mobile_number",
      "email",
      "address",
      "city",
      "district",
      "state",
      "country",
      "zip_code",
      "gst_number",
      "pan_number",
      "business_logo",
    ];

    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledgers_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle selection
  const handleSelectLedger = (ledgerId: string, checked: boolean) => {
    if (checked) {
      setSelectedLedgers((prev) => [...prev, ledgerId]);
    } else {
      setSelectedLedgers((prev) => prev.filter((id) => id !== ledgerId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLedgers(
        ledgers.map((ledger) => ledger.ledger_id || ledger.id)
      );
    } else {
      setSelectedLedgers([]);
    }
  };

  const getLedgerTypeIcon = (type: string) => {
    switch (type) {
      case "Asset":
        return "📈";
      case "Liability":
        return "📉";
      case "Equity":
        return "💼";
      case "Revenue":
        return "💰";
      case "Expense":
        return "💸";
      default:
        return "📊";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDefaultBusinessLogo = (businessName: string) => {
    const initials = businessName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&size=40`;
  };

  // Add this function to your LedgersPage component
  const handleExportData = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.city && { city: filters.city }),
        ...(filters.state && { state: filters.state }),
        ...(filters.has_gst &&
          filters.has_gst !== "all" && { has_gst: filters.has_gst }),
      });

      const response = await fetch(`/api/admin/ledgers/bulk?${params}`);

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgers_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ledgers Management</h1>
          <p className="text-muted-foreground">
            Manage financial ledgers and accounts
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedLedgers.length > 0 && hasEditPermissions && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedLedgers.length})
            </Button>
          )}
          <Button variant="outline" onClick={downloadCsvTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="hidden"
            ref={(input) => {
              if (input) {
                input.value = ""; // Clear the input value when component renders
              }
            }}
          />

          {hasEditPermissions && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ledger
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Filters & Sorting</h3>
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
                  placeholder="Search ledgers..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Filter by city..."
                value={filters.city}
                onChange={(e) =>
                  setFilters({ ...filters, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Filter by state..."
                value={filters.state}
                onChange={(e) =>
                  setFilters({ ...filters, state: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="has_gst">GST Status</Label>
              <Select
                value={filters.has_gst}
                onValueChange={(value) =>
                  setFilters({ ...filters, has_gst: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All businesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All businesses</SelectItem>
                  <SelectItem value="true">Has GST Number</SelectItem>
                  <SelectItem value="false">No GST Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Ledgers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {hasEditPermissions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedLedgers.length === ledgers.length &&
                      ledgers.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("business_name")}
                  className="p-0 h-auto font-semibold"
                >
                  Business
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Tax Info</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("created_at")}
                  className="p-0 h-auto font-semibold"
                >
                  Created
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={hasEditPermissions ? 7 : 6}
                  className="text-center py-8"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : ledgers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={hasEditPermissions ? 7 : 6}
                  className="text-center py-8 text-gray-500"
                >
                  No ledgers found
                </TableCell>
              </TableRow>
            ) : (
              ledgers.map((ledger) => (
                <TableRow key={ledger.ledger_id || ledger.id}>
                  {hasEditPermissions && (
                    <TableCell>
                      <Checkbox
                        checked={selectedLedgers.includes(
                          ledger.ledger_id || ledger.id
                        )}
                        onCheckedChange={(checked) =>
                          handleSelectLedger(
                            ledger.ledger_id || ledger.id,
                            checked as boolean
                          )
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          ledger.business_logo ||
                          getDefaultBusinessLogo(
                            ledger.business_name || "Unknown"
                          )
                        }
                        alt={ledger.business_name || "Business"}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getDefaultBusinessLogo(
                            ledger.business_name || "Unknown"
                          );
                        }}
                      />
                      <div>
                        <div className="font-medium">
                          {ledger.business_name || "Unknown Business"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {ledger.contact_person_name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {ledger.mobile_number && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {ledger.mobile_number}
                        </div>
                      )}
                      {ledger.email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          <span className="truncate max-w-32">
                            {ledger.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {ledger.city && ledger.state
                        ? `${ledger.city}, ${ledger.state}`
                        : ledger.city || ledger.state || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {ledger.gst_number && (
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-1 text-gray-400" />
                          GST: {ledger.gst_number}
                        </div>
                      )}
                      {ledger.pan_number && (
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-1 text-gray-400" />
                          PAN: {ledger.pan_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(ledger.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingLedger(ledger)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasEditPermissions && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLedger(ledger);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteLedger(ledger.ledger_id || ledger.id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && ledgers.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalLedgers)} of{" "}
              {totalLedgers} ledgers
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

      {/* CSV Upload Dialog */}
      {csvFile && (
        <Dialog open={!!csvFile} onOpenChange={() => setCsvFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload CSV File</DialogTitle>
              <DialogDescription>
                Selected file: {csvFile.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure your CSV file has the correct headers:
                  business_name, contact_person_name, mobile_number, email,
                  address, city, district, state, country, zip_code, gst_number,
                  pan_number, business_logo
                </AlertDescription>
              </Alert>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCsvFile(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCsvUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLedgers.length}{" "}
              ledger(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteLedgers}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ledger Form Dialog */}
      {hasEditPermissions && (
        <LedgerForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingLedger(null);
          }}
          onSubmit={handleLedgerSubmit}
          editingLedger={editingLedger}
          isLoading={isSubmitting}
          parentLedgers={ledgers}
        />
      )}

      {/* View Ledger Details Dialog */}
      <Dialog
        open={!!viewingLedger}
        onOpenChange={() => setViewingLedger(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ledger Details</DialogTitle>
          </DialogHeader>
          {viewingLedger && (
            <div className="space-y-6">
              {/* Business Header */}
              <div className="flex items-center space-x-4">
                <img
                  src={
                    viewingLedger.business_logo ||
                    getDefaultBusinessLogo(
                      viewingLedger.business_name || "Unknown"
                    )
                  }
                  alt={viewingLedger.business_name || "Business"}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getDefaultBusinessLogo(
                      viewingLedger.business_name || "Unknown"
                    );
                  }}
                />
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingLedger.business_name || "Unknown Business"}
                  </h3>
                  <div className="flex space-x-2 mt-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Business Ledger
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Contact Person:</strong>{" "}
                      {viewingLedger.contact_person_name || "Not specified"}
                    </div>
                    <div>
                      <strong>Mobile:</strong>{" "}
                      {viewingLedger.mobile_number || "Not specified"}
                    </div>
                    <div>
                      <strong>Email:</strong>{" "}
                      {viewingLedger.email || "Not specified"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Address:</strong>{" "}
                      {viewingLedger.address || "Not specified"}
                    </div>
                    <div>
                      <strong>City:</strong>{" "}
                      {viewingLedger.city || "Not specified"}
                    </div>
                    <div>
                      <strong>State:</strong>{" "}
                      {viewingLedger.state || "Not specified"}
                    </div>
                    <div>
                      <strong>Country:</strong>{" "}
                      {viewingLedger.country || "Not specified"}
                    </div>
                    <div>
                      <strong>ZIP Code:</strong>{" "}
                      {viewingLedger.zip_code || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Tax Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>GST Number:</strong>{" "}
                    {viewingLedger.gst_number || "Not specified"}
                  </div>
                  <div>
                    <strong>PAN Number:</strong>{" "}
                    {viewingLedger.pan_number || "Not specified"}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Account Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Ledger ID:</strong> {viewingLedger.ledger_id}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(viewingLedger.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(viewingLedger.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewingLedger(null)}
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
