"use client";

import { useState, useEffect } from "react";
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
import {
  AlertCircle,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Database } from "@/types/database";
import toast from "react-hot-toast";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface ProductConversionFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onRefresh: () => void;
}

interface ConversionData {
  selling_price?: number;
  reorder_level?: number;
  max_stock?: number;
  location?: string;
  inventory_classification?: "good" | "bad" | "wastage" | "unclassified";
  quality_grade?: string;
  notes?: string;
}

export function ProductConversionForm({
  isOpen,
  onClose,
  selectedProducts,
  onRefresh,
}: ProductConversionFormProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData>({
    selling_price: 0,
    reorder_level: 10,
    max_stock: 100,
    location: "Main Warehouse",
    inventory_classification: "good",
    quality_grade: "A",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConversionData({
        selling_price: 0,
        reorder_level: 10,
        max_stock: 100,
        location: "Main Warehouse",
        inventory_classification: "good",
        quality_grade: "A",
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (conversionData.selling_price && conversionData.selling_price <= 0) {
      newErrors.selling_price = "Selling price must be greater than 0";
    }

    if (conversionData.reorder_level && conversionData.reorder_level < 0) {
      newErrors.reorder_level = "Reorder level cannot be negative";
    }

    if (conversionData.max_stock && conversionData.max_stock <= 0) {
      newErrors.max_stock = "Max stock must be greater than 0";
    }

    if (
      conversionData.reorder_level &&
      conversionData.max_stock &&
      conversionData.reorder_level >= conversionData.max_stock
    ) {
      newErrors.reorder_level = "Reorder level must be less than max stock";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConvert = async () => {
    if (!validateForm()) {
      return;
    }

    setIsConverting(true);
    try {
      const productIds = selectedProducts.map((p) => p.id);

      const response = await fetch("/api/inventory/products/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds,
          conversionData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 207) {
          // Multi-status - partial success
          toast(
            `Partial conversion: ${result.converted}/${result.total} products converted`,
            {
              icon: "⚠️",
            }
          );
        } else {
          throw new Error(result.error || "Failed to convert products");
        }
      } else {
        toast.success(
          `Successfully converted ${result.converted} products to inventory!`
        );
        onRefresh();
        onClose();
      }
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast.error(error.message || "Failed to convert products");
    } finally {
      setIsConverting(false);
    }
  };

  const handleInputChange = (
    field: keyof ConversionData,
    value: string | number
  ) => {
    setConversionData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const canConvert = selectedProducts.length > 0; // Allow conversion of any products with proper classification

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Products to Inventory</DialogTitle>
          <DialogDescription>
            Convert selected products to inventory items with quality
            classification and tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Selected Products ({selectedProducts.length})
            </h3>

            {selectedProducts.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No products selected for conversion.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-40 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((product) => (
                    <tr key={product.id} className="border-t">
                      <td className="px-3 py-2 font-mono">
                        {product.product_sku}
                      </td>
                      <td className="px-3 py-2">{product.product_name}</td>
                      <td className="px-3 py-2">{product.product_category}</td>
                      <td className="px-3 py-2">{product.product_qty || 0}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm">
                            ₹{(product.manufacturing_cost || 0).toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inventory Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selling_price">Default Selling Price</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={conversionData.selling_price || 0}
                  onChange={(e) =>
                    handleInputChange(
                      "selling_price",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={errors.selling_price ? "border-red-500" : ""}
                  placeholder="0.00"
                />
                {errors.selling_price && (
                  <p className="text-red-500 text-sm">{errors.selling_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={conversionData.location || ""}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="e.g., Main Warehouse"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inventory_classification">
                  Inventory Classification
                </Label>
                <Select
                  value={conversionData.inventory_classification || "good"}
                  onValueChange={(
                    value: "good" | "bad" | "wastage" | "unclassified"
                  ) => handleInputChange("inventory_classification", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="bad">Bad</SelectItem>
                    <SelectItem value="wastage">Wastage</SelectItem>
                    <SelectItem value="unclassified">Unclassified</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Initial quality classification for inventory tracking
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality_grade">Quality Grade</Label>
                <Select
                  value={conversionData.quality_grade || "A"}
                  onValueChange={(value) =>
                    handleInputChange("quality_grade", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A (Premium)</SelectItem>
                    <SelectItem value="B">Grade B (Standard)</SelectItem>
                    <SelectItem value="C">Grade C (Economy)</SelectItem>
                    <SelectItem value="D">Grade D (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  value={conversionData.reorder_level || 10}
                  onChange={(e) =>
                    handleInputChange(
                      "reorder_level",
                      parseInt(e.target.value) || 10
                    )
                  }
                  className={errors.reorder_level ? "border-red-500" : ""}
                  placeholder="10"
                />
                {errors.reorder_level && (
                  <p className="text-red-500 text-sm">{errors.reorder_level}</p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum stock level before reordering
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_stock">Maximum Stock</Label>
                <Input
                  id="max_stock"
                  type="number"
                  value={conversionData.max_stock || 100}
                  onChange={(e) =>
                    handleInputChange(
                      "max_stock",
                      parseInt(e.target.value) || 100
                    )
                  }
                  className={errors.max_stock ? "border-red-500" : ""}
                  placeholder="100"
                />
                {errors.max_stock && (
                  <p className="text-red-500 text-sm">{errors.max_stock}</p>
                )}
                <p className="text-xs text-gray-500">Maximum stock capacity</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Conversion Notes</Label>
              <Textarea
                id="notes"
                value={conversionData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional notes about the conversion process..."
                rows={3}
              />
            </div>
          </div>

          {/* Conversion Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conversion Summary</h3>
            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <div className="flex justify-between">
                <span>Total Products:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Quantity:</span>
                <span className="font-medium">
                  {selectedProducts.reduce(
                    (sum, p) => sum + (p.product_qty || 0),
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Classification:</span>
                <span className="font-medium capitalize">
                  {conversionData.inventory_classification || "good"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Quality Grade:</span>
                <span className="font-medium">
                  Grade {conversionData.quality_grade || "A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Total Value:</span>
                <span className="font-medium text-green-600">
                  ₹
                  {selectedProducts
                    .reduce(
                      (sum, p) =>
                        sum +
                        (p.product_qty || 0) *
                          (conversionData.selling_price || 0),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConvert}
            disabled={selectedProducts.length === 0 || isConverting}
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Convert to Inventory
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
