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
import { UserForm } from "@/components/dashboard/forms/user-form";
import { supabase } from "@/lib/supabase/client";
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
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Shield,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // CSV Upload
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch users with pagination and filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,mobile.ilike.%${filters.search}%`
        );
      }

      if (filters.role && filters.role !== "all") {
        query = query.eq("user_role", filters.role);
      }

      if (filters.status && filters.status !== "all") {
        query = query.eq("user_status", filters.status);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setUsers(data || []);
      setTotalUsers(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle user creation/update
  const handleUserSubmit = async (userData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingUser && editingUser.id) {
        // Update existing user
        const updateData = {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_role: userData.user_role,
          user_status: userData.user_status,
          mobile: userData.mobile,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          document_type: userData.document_type,
          document_number: userData.document_number,
          dob: userData.dob,
          profile_photo: userData.profile_photo,
          updated_at: new Date().toISOString(),
        };

        console.log("Updating user:", editingUser.id);
        console.log("Update data:", updateData);

        const { data, error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", editingUser.id)
          .select();

        console.log("Update result:", { data, error });

        if (error) {
          console.error("Update error:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn("Update succeeded but no data returned");
        }
      } else {
        // Create new user via API route
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create user");
        }

        console.log("User created successfully:", result);
      }

      await fetchUsers();
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error("User submission error:", err);
      let errorMessage = "Failed to save user";

      if (err instanceof Error) {
        if (err.message.includes("duplicate key")) {
          errorMessage = "A user with this email already exists.";
        } else if (err.message.includes("storage")) {
          errorMessage = "Failed to upload profile photo. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      console.log("Deleting user:", userId);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      console.log("dlete response----", response);

      // await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      console.log("User deleted successfully:", result);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
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

      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          throw new Error(
            `CSV validation failed:\n${result.details.join("\n")}`
          );
        }
        throw new Error(result.error || "Failed to upload CSV");
      }

      console.log("Bulk upload result:", result);
      await fetchUsers();
      setCsvFile(null);

      // Show success message with results
      if (result.results && result.results.failed > 0) {
        setError(
          `Upload completed with issues: ${result.results.success} succeeded, ${result.results.failed} failed. Check console for details.`
        );
        if (result.results.errors.length > 0) {
          console.error("Upload errors:", result.results.errors);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  // Download CSV template
  const downloadCsvTemplate = () => {
    const headers = [
      "email",
      "first_name",
      "last_name",
      "user_role",
      "user_status",
      "mobile",
      "address",
      "city",
      "state",
      "document_type",
      "document_number",
      "dob",
    ];

    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download current users as CSV
  const downloadUsersCsv = async () => {
    try {
      setLoading(true);

      // Fetch all users without pagination
      const { data: allUsers, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = [
        "email",
        "first_name",
        "last_name",
        "user_role",
        "user_status",
        "mobile",
        "address",
        "city",
        "state",
        "document_type",
        "document_number",
        "dob",
        "profile_photo",
        "created_at",
        "updated_at",
      ];

      const csvRows = [
        headers.join(","),
        ...(allUsers || []).map((user) =>
          [
            user.email || "",
            user.first_name || "",
            user.last_name || "",
            user.user_role || "",
            user.user_status || "",
            user.mobile || "",
            user.address || "",
            user.city || "",
            user.state || "",
            user.document_type || "",
            user.document_number || "",
            user.dob || "",
            user.profile_photo || "",
            user.created_at || "",
            user.updated_at || "",
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
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProfileImage = (firstName, lastName) => {
    const initials = `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&size=40`;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Pmanager":
        return "bg-blue-100 text-blue-800";
      case "Imanager":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadCsvTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={downloadUsersCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
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
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) =>
                  setFilters({ ...filters, role: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Pmanager">Project Manager</SelectItem>
                  <SelectItem value="Imanager">Inventory Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          user.profile_photo ||
                          getDefaultProfileImage(
                            user.first_name || "",
                            user.last_name || ""
                          )
                        }
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">
                          {user.first_name || ""} {user.last_name || ""}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.city || ""}, {user.state || ""}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.user_role || ""
                      )}`}
                    >
                      {user.user_role || ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        user.user_status || ""
                      )}`}
                    >
                      {user.user_status || ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.email || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.mobile || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {user.city || ""}, {user.state || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
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
        {!loading && users.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} of{" "}
              {totalUsers} users
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
                  Make sure your CSV file has the correct headers: email,
                  first_name, last_name, user_role, user_status, mobile,
                  address, city, state, document_type, document_number, dob
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

      {/* User Form Dialog */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUserSubmit}
        editingUser={editingUser}
        isLoading={isSubmitting}
      />

      {/* View User Details Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <img
                  src={
                    viewingUser.profile_photo ||
                    getDefaultProfileImage(
                      viewingUser.first_name || "",
                      viewingUser.last_name || ""
                    )
                  }
                  alt={`${viewingUser.first_name} ${viewingUser.last_name}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingUser.first_name || ""} {viewingUser.last_name || ""}
                  </h3>
                  <div className="flex space-x-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        viewingUser.user_role || ""
                      )}`}
                    >
                      {viewingUser.user_role || ""}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        viewingUser.user_status || ""
                      )}`}
                    >
                      {viewingUser.user_status || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Email:</strong> {viewingUser.email || ""}
                    </div>
                    <div>
                      <strong>Phone:</strong> {viewingUser.mobile || ""}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>{viewingUser.address || ""}</div>
                    <div>
                      {viewingUser.city || ""}, {viewingUser.state || ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Personal Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Date of Birth:</strong>{" "}
                      {viewingUser.dob
                        ? new Date(viewingUser.dob).toLocaleDateString()
                        : "Not specified"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Document Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Type:</strong>{" "}
                      {viewingUser.document_type || "Not specified"}
                    </div>
                    <div>
                      <strong>Number:</strong>{" "}
                      {viewingUser.document_number || "Not specified"}
                    </div>
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
                    <strong>User ID:</strong> {viewingUser.id}
                  </div>
                  <div>
                    <strong>Joined:</strong>{" "}
                    {new Date(viewingUser.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(viewingUser.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewingUser(null)}>
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
