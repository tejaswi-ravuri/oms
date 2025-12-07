"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { BulkOperations } from "@/components/inventory/bulk-operations";
import { ProductConversionForm } from "@/components/inventory/product-conversion-form";
import { QualityCheckForm } from "@/components/inventory/quality-check-form";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    categories: [],
    materials: [],
    colors: [],
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    category: "all",
    status: "all",
    material: "all",
    color: "all",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showConversionForm, setShowConversionForm] = useState(false);
  const [showQCForm, setShowQCForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Check permissions
  const canEdit =
    profile?.user_role &&
    ["Admin", "Pmanager", "Imanager"].includes(profile.user_role);
  const canAdd = canEdit;
  const canDelete = canEdit;

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchProducts();
    }
  }, [profile, pagination.page, activeFilters, searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [activeFilters, searchTerm]);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: activeFilters.sortBy,
        sortOrder: activeFilters.sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (activeFilters.category && activeFilters.category !== "all")
        params.append("category", activeFilters.category);
      if (activeFilters.status && activeFilters.status !== "all")
        params.append("status", activeFilters.status);
      if (activeFilters.material && activeFilters.material !== "all")
        params.append("material", activeFilters.material);
      if (activeFilters.color && activeFilters.color !== "all")
        params.append("color", activeFilters.color);

      const response = await fetch(`/api/inventory/products?${params}`);
      const result = await response.json();

      if (response.ok) {
        setProducts(result.data);
        setPagination(result.pagination);
        setFilters(result.filters);
      } else {
        const errorResult = result;
        setError(errorResult.error || "Failed to fetch products");
        toast.error(errorResult.error || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
      toast.error("Failed to fetch products");
    }
  };

  const handleProductSubmit = async (productData) => {
    try {
      const url = editingProduct
        ? `/api/inventory/products/${editingProduct.id}`
        : "/api/inventory/products";

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save product");
      }

      await fetchProducts();
      setShowProductForm(false);
      setEditingProduct(null);
      toast.success(
        editingProduct
          ? "Product updated successfully!"
          : "Product created successfully!"
      );
    } catch (error) {
      console.error("Error saving product:", error);
      setError(error.message || "Failed to save product");
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    setDeletingProductId(productId);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/inventory/products/${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully!");
      await fetchProducts();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError(error.message || "Failed to delete product");
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
      setDeletingProductId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    setIsDeleting(true);
    try {
      // Delete products one by one since there's no bulk delete endpoint
      const deletePromises = selectedProducts.map(async (productId) => {
        const response = await fetch(`/api/inventory/products/${productId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(
            result.error || `Failed to delete product ${productId}`
          );
        }

        return productId;
      });

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        toast.error(`Deleted ${successful} products, ${failed} failed`);
      } else {
        toast.success(`Deleted ${successful} products successfully!`);
      }

      setSelectedProducts([]);
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting products:", error);
      setError(error.message || "Failed to delete products");
      toast.error(error.message || "Failed to delete products");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "Inactive":
        return <Badge className="bg-red-100 text-red-700">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getQCStatusIcon = (status) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getInventoryStatusBadge = (status) => {
    switch (status) {
      case "converted":
        return <Badge className="bg-blue-100 text-blue-700">Converted</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  // Download products as CSV
  const downloadProductsCsv = async () => {
    try {
      setLoading(true);

      // Fetch all products without pagination
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (activeFilters.category && activeFilters.category !== "all")
        params.append("category", activeFilters.category);
      if (activeFilters.status && activeFilters.status !== "all")
        params.append("status", activeFilters.status);
      if (activeFilters.material && activeFilters.material !== "all")
        params.append("material", activeFilters.material);
      if (activeFilters.color && activeFilters.color !== "all")
        params.append("color", activeFilters.color);
      params.append("limit", "1000"); // Get all records

      const response = await fetch(`/api/inventory/products?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch products");
      }

      const headers = [
        "ID",
        "SKU",
        "Name",
        "Category",
        "Quantity",
        "Status",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...(result.data || []).map((product) =>
          [
            product.id || "",
            product.product_sku || "",
            product.product_name || "",
            product.product_category || "",
            product.product_qty || 0,
            product.product_status || "",
            product.created_at || "",
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
      a.download = `products_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load your profile. Please try logging in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadProductsCsv}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canAdd && (
            <Button
              onClick={() => setShowBulkOperations(true)}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Operations
            </Button>
          )}
          {canAdd && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={activeFilters.category}
                onValueChange={(value) =>
                  setActiveFilters({ ...activeFilters, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filters.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={activeFilters.status}
                onValueChange={(value) =>
                  setActiveFilters({ ...activeFilters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Select
                value={activeFilters.material}
                onValueChange={(value) =>
                  setActiveFilters({ ...activeFilters, material: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {filters.materials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
          <span className="text-sm font-medium">
            {selectedProducts.length} product
            {selectedProducts.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQCForm(true)}
            >
              Quality Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConversionForm(true)}
            >
              Convert to Inventory
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Selected"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedProducts.length === products.length &&
                    products.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) =>
                        handleSelectProduct(product.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                      {product.product_image ? (
                        <img
                          src={product.product_image}
                          alt={product.product_name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.product_sku}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.product_name}</div>
                      {product.product_description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.product_description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.product_category}</TableCell>
                  <TableCell>{product.product_qty || 0}</TableCell>
                  <TableCell>
                    {getStatusBadge(product.product_status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewingProduct(product);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingProductId(product.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} products
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="flex items-center px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page >= pagination.pages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showProductForm && (
        <ProductForm
          isOpen={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSubmit={handleProductSubmit}
          editingProduct={editingProduct}
        />
      )}

      {showBulkOperations && (
        <BulkOperations
          isOpen={showBulkOperations}
          onClose={() => setShowBulkOperations(false)}
          onRefresh={fetchProducts}
        />
      )}

      {showConversionForm && (
        <ProductConversionForm
          isOpen={showConversionForm}
          onClose={() => setShowConversionForm(false)}
          selectedProducts={products.filter((p) =>
            selectedProducts.includes(p.id)
          )}
          onRefresh={fetchProducts}
        />
      )}

      {showQCForm && (
        <QualityCheckForm
          isOpen={showQCForm}
          onClose={() => setShowQCForm(false)}
          selectedProducts={products.filter((p) =>
            selectedProducts.includes(p.id)
          )}
          onRefresh={fetchProducts}
        />
      )}

      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this product? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deletingProductId && handleDeleteProduct(deletingProductId)
                }
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Product Details Dialog */}
      <Dialog
        open={showViewDialog}
        onOpenChange={() => setShowViewDialog(false)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                  {viewingProduct.product_image ? (
                    <img
                      src={viewingProduct.product_image}
                      alt={viewingProduct.product_name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingProduct.product_name}
                  </h3>
                  <div className="text-sm text-gray-500">
                    SKU: {viewingProduct.product_sku}
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Category:</strong>{" "}
                      {viewingProduct.product_category}
                    </div>
                    <div>
                      <strong>Sub Category:</strong>{" "}
                      {viewingProduct.product_sub_category || "N/A"}
                    </div>
                    <div>
                      <strong>Size:</strong>{" "}
                      {viewingProduct.product_size || "N/A"}
                    </div>
                    <div>
                      <strong>Color:</strong>{" "}
                      {viewingProduct.product_color || "N/A"}
                    </div>
                    <div>
                      <strong>Material:</strong>{" "}
                      {viewingProduct.product_material || "N/A"}
                    </div>
                    <div>
                      <strong>Quantity:</strong>{" "}
                      {viewingProduct.product_qty || 0}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span className="ml-2">
                        {getStatusBadge(viewingProduct.product_status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Additional Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Brand:</strong>{" "}
                      {viewingProduct.product_brand || "N/A"}
                    </div>
                    <div>
                      <strong>Country:</strong>{" "}
                      {viewingProduct.product_country || "N/A"}
                    </div>
                    {viewingProduct.product_description && (
                      <div>
                        <strong>Description:</strong>{" "}
                        {viewingProduct.product_description}
                      </div>
                    )}
                    <div>
                      <strong>Created:</strong>{" "}
                      {viewingProduct.created_at
                        ? new Date(viewingProduct.created_at).toLocaleString()
                        : "N/A"}
                    </div>
                    <div>
                      <strong>Updated:</strong>{" "}
                      {viewingProduct.updated_at
                        ? new Date(viewingProduct.updated_at).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
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
