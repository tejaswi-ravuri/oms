"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  isLoading = false,
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    product_name: "",
    product_sku: "",
    product_category: "",
    product_sub_category: null,
    product_size: null,
    product_color: null,
    product_description: null,
    product_material: null,
    product_brand: "Bhaktinandan",
    product_country: "India",
    product_status: "Active",
    product_qty: 0,
    wash_care: null,
    manufacturing_cost: 0,
    refurbished_cost: 0,
    is_refurbished: false,
    original_manufacturing_cost: 0,
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);

  // Fetch existing data for dropdowns
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Handle editing product data
  useEffect(() => {
    if (editingProduct && isOpen) {
      setFormData({
        product_name: editingProduct.product_name || "",
        product_sku: editingProduct.product_sku || "",
        product_category: editingProduct.product_category || "",
        product_sub_category: editingProduct.product_sub_category || null,
        product_size: editingProduct.product_size || null,
        product_color: editingProduct.product_color || null,
        product_description: editingProduct.product_description || null,
        product_material: editingProduct.product_material || null,
        product_brand: editingProduct.product_brand || "Bhaktinandan",
        product_country: editingProduct.product_country || "India",
        product_status: editingProduct.product_status || "Active",
        product_qty: editingProduct.product_qty || 0,
        wash_care: editingProduct.wash_care || null,
        manufacturing_cost: editingProduct.manufacturing_cost || 0,
        refurbished_cost: editingProduct.refurbished_cost || 0,
        is_refurbished: editingProduct.is_refurbished || false,
        original_manufacturing_cost:
          editingProduct.original_manufacturing_cost || 0,
      });
    } else if (!editingProduct && isOpen) {
      resetForm();
    }
  }, [editingProduct, isOpen]);

  const fetchDropdownData = async () => {
    try {
      const supabase = createClient();

      // Fetch unique categories, materials, and colors
      const [categoriesRes, materialsRes, colorsRes] = await Promise.all([
        supabase
          .from("products")
          .select("product_category")
          .not("product_category", "is", null),
        supabase
          .from("products")
          .select("product_material")
          .not("product_material", "is", null),
        supabase
          .from("products")
          .select("product_color")
          .not("product_color", "is", null),
      ]);

      if (categoriesRes.data) {
        const uniqueCategories = [
          ...new Set(categoriesRes.data.map((c) => c.product_category)),
        ];
        setCategories(uniqueCategories);
      }

      if (materialsRes.data) {
        const uniqueMaterials = [
          ...new Set(
            materialsRes.data
              .map((m) => m.product_material)
              .filter((m): m is string => Boolean(m))
          ),
        ];
        setMaterials(uniqueMaterials);
      }

      if (colorsRes.data) {
        const uniqueColors = [
          ...new Set(
            colorsRes.data
              .map((c) => c.product_color)
              .filter((c): c is string => Boolean(c))
          ),
        ];
        setColors(uniqueColors);
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      product_sku: "",
      product_category: "",
      product_sub_category: null,
      product_size: null,
      product_color: null,
      product_description: null,
      product_material: null,
      product_brand: "Bhaktinandan",
      product_country: "India",
      product_status: "Active",
      product_qty: 0,
      wash_care: null,
      manufacturing_cost: 0,
      refurbished_cost: 0,
      is_refurbished: false,
      original_manufacturing_cost: 0,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_name?.trim()) {
      newErrors.product_name = "Product name is required";
    }

    if (!formData.product_sku?.trim()) {
      newErrors.product_sku = "Product SKU is required";
    }

    if (!formData.product_category?.trim()) {
      newErrors.product_category = "Product category is required";
    }

    if (formData.product_qty && formData.product_qty < 0) {
      newErrors.product_qty = "Quantity cannot be negative";
    }

    if (formData.manufacturing_cost && formData.manufacturing_cost < 0) {
      newErrors.manufacturing_cost = "Manufacturing cost cannot be negative";
    }

    if (formData.refurbished_cost && formData.refurbished_cost < 0) {
      newErrors.refurbished_cost = "Refurbished cost cannot be negative";
    }

    if (
      formData.original_manufacturing_cost &&
      formData.original_manufacturing_cost < 0
    ) {
      newErrors.original_manufacturing_cost =
        "Original manufacturing cost cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);

      if (!editingProduct) {
        resetForm();
      }
      onClose();
      toast.success(
        editingProduct
          ? "Product updated successfully!"
          : "Product created successfully!"
      );
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save product. Please try again.";

      if (error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A product with this SKU already exists.";
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({
        ...errors,
        submit: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const generateSKU = () => {
    if (formData.product_name && formData.product_category) {
      const name = formData.product_name
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase();
      const category = formData.product_category
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const sku = `${name}-${category}-${random}`;
      handleInputChange("product_sku", sku);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {editingProduct
              ? "Update the product information below."
              : "Fill in the details to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name || ""}
                onChange={(e) =>
                  handleInputChange("product_name", e.target.value)
                }
                className={errors.product_name ? "border-red-500" : ""}
                placeholder="Enter product name"
              />
              {errors.product_name && (
                <p className="text-red-500 text-sm">{errors.product_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sku">Product SKU *</Label>
              <div className="flex gap-2">
                <Input
                  id="product_sku"
                  value={formData.product_sku || ""}
                  onChange={(e) =>
                    handleInputChange("product_sku", e.target.value)
                  }
                  className={errors.product_sku ? "border-red-500" : ""}
                  placeholder="Enter product SKU"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSKU}
                  disabled={
                    !formData.product_name || !formData.product_category
                  }
                >
                  Generate
                </Button>
              </div>
              {errors.product_sku && (
                <p className="text-red-500 text-sm">{errors.product_sku}</p>
              )}
            </div>
          </div>

          {/* Category and Sub-category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_category">Category *</Label>
              <div className="flex gap-2">
                <Input
                  id="product_category"
                  value={formData.product_category || ""}
                  onChange={(e) =>
                    handleInputChange("product_category", e.target.value)
                  }
                  className={errors.product_category ? "border-red-500" : ""}
                  placeholder="Enter category"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              {errors.product_category && (
                <p className="text-red-500 text-sm">
                  {errors.product_category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sub_category">Sub-category</Label>
              <Input
                id="product_sub_category"
                value={formData.product_sub_category || ""}
                onChange={(e) =>
                  handleInputChange("product_sub_category", e.target.value)
                }
                placeholder="Enter sub-category"
              />
            </div>
          </div>

          {/* Size, Color, Material */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_size">Size</Label>
              <Input
                id="product_size"
                value={formData.product_size || ""}
                onChange={(e) =>
                  handleInputChange("product_size", e.target.value)
                }
                placeholder="e.g., S, M, L, XL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_color">Color</Label>
              <Input
                id="product_color"
                value={formData.product_color || ""}
                onChange={(e) =>
                  handleInputChange("product_color", e.target.value)
                }
                placeholder="Enter color"
                list="colors"
              />
              <datalist id="colors">
                {colors.map((color) => (
                  <option key={color} value={color} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_material">Material</Label>
              <Input
                id="product_material"
                value={formData.product_material || ""}
                onChange={(e) =>
                  handleInputChange("product_material", e.target.value)
                }
                placeholder="Enter material"
                list="materials"
              />
              <datalist id="materials">
                {materials.map((material) => (
                  <option key={material} value={material} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Brand and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_brand">Brand</Label>
              <Input
                id="product_brand"
                value={formData.product_brand || ""}
                onChange={(e) =>
                  handleInputChange("product_brand", e.target.value)
                }
                placeholder="Enter brand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_country">Country</Label>
              <Input
                id="product_country"
                value={formData.product_country || ""}
                onChange={(e) =>
                  handleInputChange("product_country", e.target.value)
                }
                placeholder="Enter country"
              />
            </div>
          </div>

          {/* Status and Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_status">Status</Label>
              <Select
                value={formData.product_status || ""}
                onValueChange={(value) =>
                  handleInputChange("product_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_qty">Quantity</Label>
              <Input
                id="product_qty"
                type="number"
                value={formData.product_qty || 0}
                onChange={(e) =>
                  handleInputChange(
                    "product_qty",
                    parseInt(e.target.value) || 0
                  )
                }
                className={errors.product_qty ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.product_qty && (
                <p className="text-red-500 text-sm">{errors.product_qty}</p>
              )}
            </div>
          </div>

          {/* Cost Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cost Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturing_cost">Manufacturing Cost</Label>
                <Input
                  id="manufacturing_cost"
                  type="number"
                  step="0.01"
                  value={formData.manufacturing_cost || 0}
                  onChange={(e) =>
                    handleInputChange(
                      "manufacturing_cost",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={errors.manufacturing_cost ? "border-red-500" : ""}
                  placeholder="0.00"
                />
                {errors.manufacturing_cost && (
                  <p className="text-red-500 text-sm">
                    {errors.manufacturing_cost}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_manufacturing_cost">
                  Original Manufacturing Cost
                </Label>
                <Input
                  id="original_manufacturing_cost"
                  type="number"
                  step="0.01"
                  value={formData.original_manufacturing_cost || 0}
                  onChange={(e) =>
                    handleInputChange(
                      "original_manufacturing_cost",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refurbished_cost">Refurbished Cost</Label>
                <Input
                  id="refurbished_cost"
                  type="number"
                  step="0.01"
                  value={formData.refurbished_cost || 0}
                  onChange={(e) =>
                    handleInputChange(
                      "refurbished_cost",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_refurbished"
                checked={formData.is_refurbished || false}
                onChange={(e) =>
                  handleInputChange("is_refurbished", e.target.checked)
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_refurbished">Is Refurbished</Label>
            </div>
          </div>

          {/* Description and Wash Care */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_description">Product Description</Label>
              <Textarea
                id="product_description"
                value={formData.product_description || ""}
                onChange={(e) =>
                  handleInputChange("product_description", e.target.value)
                }
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wash_care">Wash Care Instructions</Label>
              <Textarea
                id="wash_care"
                value={formData.wash_care || ""}
                onChange={(e) => handleInputChange("wash_care", e.target.value)}
                placeholder="Enter wash care instructions"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingProduct ? "Updating..." : "Creating..."}
                </>
              ) : editingProduct ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
