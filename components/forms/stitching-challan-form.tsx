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
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function StitchingChallanForm({
  isOpen,
  onClose,
  onSubmit,
  editingChallan,
  isLoading = false,
  stitchingUnits = [],
}) {
  const [stitchingUnitsList, setStitchingUnitsList] = useState(stitchingUnits);
  const [loadingStitchingUnits, setLoadingStitchingUnits] = useState(false);
  const [formData, setFormData] = useState({
    challan_no: "",
    challan_date: "",
    ledger_id: "",
    batch_numbers: [],
    product_name: "",
    product_sku: "",
    quantity_sent: 0,
    quantity_received: 0,
    rate_per_piece: 0,
    transport_name: "",
    lr_number: "",
    transport_charge: 0,
    status: "Pending",
  });

  const [errors, setErrors] = useState({});
  const [sizeBreakdown, setSizeBreakdown] = useState([
    { size: "", quantity: 0 },
  ]);
  const [batchNumbers, setBatchNumbers] = useState([""]);

  // Fetch stitching units when dialog opens
  useEffect(() => {
    if (isOpen && stitchingUnits.length === 0) {
      fetchStitchingUnits();
    } else {
      setStitchingUnitsList(stitchingUnits);
    }
  }, [isOpen]); // Remove stitchingUnits from dependency array to prevent infinite loop

  // Fetch stitching units from API
  const fetchStitchingUnits = async () => {
    setLoadingStitchingUnits(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ledgers")
        .select("ledger_id, business_name")
        .order("business_name");

      if (error) {
        console.error("Error fetching stitching units:", error);
        return;
      }

      setStitchingUnitsList(data || []);
    } catch (error) {
      console.error("Error fetching stitching units:", error);
    } finally {
      setLoadingStitchingUnits(false);
    }
  };

  useEffect(() => {
    if (editingChallan) {
      setFormData({
        challan_no: editingChallan.challan_no || "",
        challan_date: editingChallan.challan_date || "",
        ledger_id: editingChallan.ledger_id || "",
        batch_numbers: editingChallan.batch_numbers || [],
        product_name: editingChallan.product_name || "",
        product_sku: editingChallan.product_sku || "",
        quantity_sent: editingChallan.quantity_sent || 0,
        quantity_received: editingChallan.quantity_received || 0,
        rate_per_piece: editingChallan.rate_per_piece || 0,
        transport_name: editingChallan.transport_name || "",
        lr_number: editingChallan.lr_number || "",
        transport_charge: editingChallan.transport_charge || 0,
        status: editingChallan.status || "",
      });

      // Convert size_breakdown object to array for form
      if (editingChallan.size_breakdown) {
        const breakdownArray = Object.entries(
          editingChallan.size_breakdown
        ).map(([size, quantity]) => ({
          size,
          quantity: Number(quantity),
        }));
        setSizeBreakdown(
          breakdownArray.length > 0
            ? breakdownArray
            : [{ size: "", quantity: 0 }]
        );
      }

      // Set batch numbers
      if (
        editingChallan.batch_numbers &&
        editingChallan.batch_numbers.length > 0
      ) {
        setBatchNumbers(editingChallan.batch_numbers);
      }
    } else {
      resetForm();
    }
  }, [editingChallan, isOpen]);

  const resetForm = () => {
    setFormData({
      challan_no: "",
      challan_date: new Date().toISOString().split("T")[0],
      ledger_id: "",
      batch_numbers: [],
      product_name: "",
      product_sku: "",
      quantity_sent: 0,
      quantity_received: 0,
      rate_per_piece: 0,
      transport_name: "",
      lr_number: "",
      transport_charge: 0,
      status: "Pending",
    });
    setSizeBreakdown([{ size: "", quantity: 0 }]);
    setBatchNumbers([""]);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.challan_date) {
      newErrors.challan_date = "Date is required";
    }

    if (!formData.challan_no.trim()) {
      newErrors.challan_no = "Challan number is required";
    }

    if (!formData.ledger_id) {
      newErrors.ledger_id = "Stitching unit is required";
    }

    if (!formData.quantity_sent || formData.quantity_sent <= 0) {
      newErrors.quantity_sent = "Quantity must be greater than 0";
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
      // Convert size breakdown array to object
      const sizeBreakdownObj = {};
      sizeBreakdown.forEach((item) => {
        if (item.size && item.quantity > 0) {
          sizeBreakdownObj[item.size] = item.quantity;
        }
      });

      // Filter out empty batch numbers
      const validBatchNumbers = batchNumbers.filter(
        (batch) => batch.trim() !== ""
      );

      const submitData = {
        ...formData,
        size_breakdown: sizeBreakdownObj,
        batch_numbers: validBatchNumbers,
      };

      await onSubmit(submitData);

      if (!editingChallan) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save stitching challan. Please try again.";

      if (error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A challan with this number already exists.";
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({
        ...errors,
        submit: errorMessage,
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addSizeBreakdownRow = () => {
    setSizeBreakdown([...sizeBreakdown, { size: "", quantity: 0 }]);
  };

  const removeSizeBreakdownRow = (index) => {
    const newBreakdown = sizeBreakdown.filter((_, i) => i !== index);
    setSizeBreakdown(
      newBreakdown.length > 0 ? newBreakdown : [{ size: "", quantity: 0 }]
    );
  };

  const updateSizeBreakdown = (index, field, value) => {
    const newBreakdown = [...sizeBreakdown];
    newBreakdown[index] = {
      ...newBreakdown[index],
      [field]: field === "quantity" ? Number(value) : value,
    };
    setSizeBreakdown(newBreakdown);
  };

  const addBatchNumber = () => {
    setBatchNumbers([...batchNumbers, ""]);
  };

  const removeBatchNumber = (index) => {
    const newBatches = batchNumbers.filter((_, i) => i !== index);
    setBatchNumbers(newBatches.length > 0 ? newBatches : [""]);
  };

  const updateBatchNumber = (index, value) => {
    const newBatches = [...batchNumbers];
    newBatches[index] = value;
    setBatchNumbers(newBatches);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingChallan
              ? "Edit Stitching Challan"
              : "Add New Stitching Challan"}
          </DialogTitle>
          <DialogDescription>
            {editingChallan
              ? "Update the stitching challan information below."
              : "Fill in the details to create a new stitching challan."}
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
              <Label htmlFor="challan_date">Date *</Label>
              <Input
                id="challan_date"
                type="date"
                value={formData.challan_date}
                onChange={(e) =>
                  handleInputChange("challan_date", e.target.value)
                }
                className={errors.challan_date ? "border-red-500" : ""}
              />
              {errors.challan_date && (
                <p className="text-red-500 text-sm">{errors.challan_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="challan_no">Challan Number *</Label>
              <Input
                id="challan_no"
                value={formData.challan_no}
                onChange={(e) =>
                  handleInputChange("challan_no", e.target.value)
                }
                className={errors.challan_no ? "border-red-500" : ""}
                placeholder="e.g., SC-2024-001"
              />
              {errors.challan_no && (
                <p className="text-red-500 text-sm">{errors.challan_no}</p>
              )}
            </div>
          </div>

          {/* Stitching Unit and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ledger_id">Stitching Unit *</Label>
              <Select
                value={formData.ledger_id?.toString()}
                onValueChange={(value) => handleInputChange("ledger_id", value)}
                disabled={loadingStitchingUnits}
              >
                <SelectTrigger
                  className={errors.ledger_id ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      loadingStitchingUnits
                        ? "Loading units..."
                        : "Select stitching unit"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {stitchingUnitsList.map((unit) => (
                    <SelectItem key={unit.ledger_id} value={unit.ledger_id}>
                      {unit.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ledger_id && (
                <p className="text-red-500 text-sm">{errors.ledger_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="QC Pending">QC Pending</SelectItem>
                  <SelectItem value="QC Done">QC Done</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) =>
                  handleInputChange("product_name", e.target.value)
                }
                placeholder="e.g., Men's Shirt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sku">Product SKU</Label>
              <Input
                id="product_sku"
                value={formData.product_sku}
                onChange={(e) =>
                  handleInputChange("product_sku", e.target.value)
                }
                placeholder="e.g., SHIRT-M-001"
              />
            </div>
          </div>

          {/* Batch Numbers */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Batch Numbers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBatchNumber}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Batch
              </Button>
            </div>

            <div className="space-y-2">
              {batchNumbers.map((batch, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={batch}
                      onChange={(e) => updateBatchNumber(index, e.target.value)}
                      placeholder="e.g., BATCH-001"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeBatchNumber(index)}
                    disabled={batchNumbers.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_sent">Quantity Sent *</Label>
              <Input
                id="quantity_sent"
                type="number"
                value={formData.quantity_sent}
                onChange={(e) =>
                  handleInputChange("quantity_sent", Number(e.target.value))
                }
                className={errors.quantity_sent ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.quantity_sent && (
                <p className="text-red-500 text-sm">{errors.quantity_sent}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_received">Quantity Received</Label>
              <Input
                id="quantity_received"
                type="number"
                value={formData.quantity_received}
                onChange={(e) =>
                  handleInputChange("quantity_received", Number(e.target.value))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_per_piece">Rate per Piece</Label>
              <Input
                id="rate_per_piece"
                type="number"
                step="0.01"
                value={formData.rate_per_piece}
                onChange={(e) =>
                  handleInputChange("rate_per_piece", Number(e.target.value))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Product Size Breakdown */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Product Size Breakdown</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSizeBreakdownRow}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </div>

            <div className="space-y-2">
              {sizeBreakdown.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Input
                      value={item.size}
                      onChange={(e) =>
                        updateSizeBreakdown(index, "size", e.target.value)
                      }
                      placeholder="e.g., S, M, L, XL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateSizeBreakdown(index, "quantity", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSizeBreakdownRow(index)}
                      disabled={sizeBreakdown.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transport Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport_name">Transport Name</Label>
              <Input
                id="transport_name"
                value={formData.transport_name}
                onChange={(e) =>
                  handleInputChange("transport_name", e.target.value)
                }
                placeholder="e.g., ABC Transport"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lr_number">LR Number</Label>
              <Input
                id="lr_number"
                value={formData.lr_number}
                onChange={(e) => handleInputChange("lr_number", e.target.value)}
                placeholder="e.g., LR123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport_charge">Transport Charge</Label>
              <Input
                id="transport_charge"
                type="number"
                step="0.01"
                value={formData.transport_charge}
                onChange={(e) =>
                  handleInputChange("transport_charge", Number(e.target.value))
                }
                placeholder="0.00"
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
                  {editingChallan ? "Updating..." : "Creating..."}
                </>
              ) : editingChallan ? (
                "Update Challan"
              ) : (
                "Create Challan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
