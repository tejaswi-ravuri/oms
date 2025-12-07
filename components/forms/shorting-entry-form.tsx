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

export function ShortingEntryForm({
  isOpen,
  onClose,
  onSubmit,
  editingEntry,
  isLoading = false,
}) {
  const [weaverChallansList, setWeaverChallansList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);
  const [loadingWeaverChallans, setLoadingWeaverChallans] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const [formData, setFormData] = useState({
    entry_date: "",
    entry_no: "",
    weaver_challan_id: undefined,
    purchase_id: undefined,
    material_type: "",
    batch_number: "",
    total_pieces: 0,
    good_pieces: 0,
    damaged_pieces: 0,
    rejected_pieces: 0,
    size_breakdown: {},
    remarks: "",
  });

  const [errors, setErrors] = useState({});
  const [sizeBreakdown, setSizeBreakdown] = useState([
    { size: "", quantity: 0 },
  ]);

  // Fetch weaver challans and purchases when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchWeaverChallans();
      fetchPurchases();
    }
  }, [isOpen]);

  // Handle editing entry data
  useEffect(() => {
    if (editingEntry && isOpen) {
      console.log("Editing entry:", editingEntry);

      setFormData({
        entry_date: editingEntry.entry_date || "",
        entry_no: editingEntry.entry_no || "",
        weaver_challan_id: editingEntry.weaver_challan_id || undefined,
        purchase_id: editingEntry.purchase_id || undefined,
        material_type: editingEntry.material_type || "",
        batch_number: editingEntry.batch_number || "",
        total_pieces: editingEntry.total_pieces || 0,
        good_pieces: editingEntry.good_pieces || 0,
        damaged_pieces: editingEntry.damaged_pieces || 0,
        rejected_pieces: editingEntry.rejected_pieces || 0,
        size_breakdown: editingEntry.size_breakdown || {},
        remarks: editingEntry.remarks || "",
      });

      // Convert size_breakdown object to array for form
      if (
        editingEntry.size_breakdown &&
        typeof editingEntry.size_breakdown === "object"
      ) {
        const breakdownArray = Object.entries(editingEntry.size_breakdown).map(
          ([size, quantity]) => ({
            size,
            quantity: Number(quantity),
          })
        );
        setSizeBreakdown(
          breakdownArray.length > 0
            ? breakdownArray
            : [{ size: "", quantity: 0 }]
        );
      } else {
        setSizeBreakdown([{ size: "", quantity: 0 }]);
      }
    } else if (!editingEntry && isOpen) {
      resetForm();
    }
  }, [editingEntry, isOpen]);

  // Fetch weaver challans from API
  const fetchWeaverChallans = async () => {
    setLoadingWeaverChallans(true);
    try {
      const response = await fetch("/api/production/weaver-challans?limit=100");
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching weaver challans:", result.error);
        return;
      }

      setWeaverChallansList(result.data || []);
    } catch (error) {
      console.error("Error fetching weaver challans:", error);
    } finally {
      setLoadingWeaverChallans(false);
    }
  };

  // Fetch purchases from API
  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const response = await fetch("/api/production/purchases?limit=100");
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching purchases:", result.error);
        return;
      }

      setPurchasesList(result.data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split("T")[0],
      entry_no: "",
      weaver_challan_id: undefined,
      purchase_id: undefined,
      material_type: "",
      batch_number: "",
      total_pieces: 0,
      good_pieces: 0,
      damaged_pieces: 0,
      rejected_pieces: 0,
      size_breakdown: {},
      remarks: "",
    });
    setSizeBreakdown([{ size: "", quantity: 0 }]);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.entry_date) {
      newErrors.entry_date = "Entry date is required";
    }

    if (!formData.entry_no.trim()) {
      newErrors.entry_no = "Entry number is required";
    }

    if (!formData.material_type?.trim()) {
      newErrors.material_type = "Material type is required";
    }

    if (!formData.total_pieces || formData.total_pieces <= 0) {
      newErrors.total_pieces = "Total pieces must be greater than 0";
    }

    const totalQualityPieces =
      (formData.good_pieces || 0) +
      (formData.damaged_pieces || 0) +
      (formData.rejected_pieces || 0);
    if (totalQualityPieces > formData.total_pieces) {
      newErrors.good_pieces =
        "Sum of good, damaged, and rejected pieces cannot exceed total pieces";
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

      const submitData = {
        ...formData,
        size_breakdown:
          Object.keys(sizeBreakdownObj).length > 0
            ? sizeBreakdownObj
            : undefined,
      };

      await onSubmit(submitData);

      if (!editingEntry) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save shorting entry. Please try again.";

      if (error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "An entry with this number already exists.";
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

  const handleWeaverChallanChange = (challanId) => {
    const challan = weaverChallansList.find((c) => c.id === Number(challanId));
    if (challan) {
      setFormData((prev) => ({
        ...prev,
        weaver_challan_id: Number(challanId),
        material_type: challan.material_type || prev.material_type,
        batch_number: challan.batch_number || prev.batch_number,
      }));
    }
  };

  const handlePurchaseChange = (purchaseId) => {
    const purchase = purchasesList.find((p) => p.id === Number(purchaseId));
    if (purchase) {
      setFormData((prev) => ({
        ...prev,
        purchase_id: Number(purchaseId),
        material_type: purchase.material_type || prev.material_type,
      }));
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? "Edit Shorting Entry" : "Add New Shorting Entry"}
          </DialogTitle>
          <DialogDescription>
            {editingEntry
              ? "Update the shorting entry information below."
              : "Fill in the details to create a new shorting entry."}
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
              <Label htmlFor="entry_date">Entry Date *</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) =>
                  handleInputChange("entry_date", e.target.value)
                }
                className={errors.entry_date ? "border-red-500" : ""}
              />
              {errors.entry_date && (
                <p className="text-red-500 text-sm">{errors.entry_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_no">Entry Number *</Label>
              <Input
                id="entry_no"
                value={formData.entry_no}
                onChange={(e) => handleInputChange("entry_no", e.target.value)}
                className={errors.entry_no ? "border-red-500" : ""}
                placeholder="e.g., SE-2024-001"
              />
              {errors.entry_no && (
                <p className="text-red-500 text-sm">{errors.entry_no}</p>
              )}
            </div>
          </div>

          {/* Reference Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weaver_challan_id">
                Weaver Challan (Optional)
              </Label>
              <Select
                value={formData.weaver_challan_id?.toString() || ""}
                onValueChange={handleWeaverChallanChange}
                disabled={loadingWeaverChallans}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingWeaverChallans
                        ? "Loading..."
                        : "Select weaver challan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {weaverChallansList.length === 0 && !loadingWeaverChallans ? (
                    <div className="p-2 text-sm text-gray-500">
                      No weaver challans found
                    </div>
                  ) : (
                    weaverChallansList.map((challan) => (
                      <SelectItem
                        key={challan.id}
                        value={challan.id?.toString() || ""}
                      >
                        {challan.challan_no} - {challan.material_type || "N/A"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_id">Purchase (Optional)</Label>
              <Select
                value={formData.purchase_id?.toString() || ""}
                onValueChange={handlePurchaseChange}
                disabled={loadingPurchases}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingPurchases ? "Loading..." : "Select purchase"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {purchasesList.length === 0 && !loadingPurchases ? (
                    <div className="p-2 text-sm text-gray-500">
                      No purchases found
                    </div>
                  ) : (
                    purchasesList.map((purchase) => (
                      <SelectItem
                        key={purchase.id}
                        value={purchase.id?.toString() || ""}
                      >
                        {purchase.purchase_no} - {purchase.material_type}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Material Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_type">Material Type *</Label>
              <Input
                id="material_type"
                value={formData.material_type}
                onChange={(e) =>
                  handleInputChange("material_type", e.target.value)
                }
                className={errors.material_type ? "border-red-500" : ""}
                placeholder="e.g., Cotton, Silk, Polyester"
              />
              {errors.material_type && (
                <p className="text-red-500 text-sm">{errors.material_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) =>
                  handleInputChange("batch_number", e.target.value)
                }
                placeholder="e.g., BATCH-001"
              />
            </div>
          </div>

          {/* Quality Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Breakdown</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_pieces">Total Pieces *</Label>
                <Input
                  id="total_pieces"
                  type="number"
                  value={formData.total_pieces}
                  onChange={(e) =>
                    handleInputChange("total_pieces", Number(e.target.value))
                  }
                  className={errors.total_pieces ? "border-red-500" : ""}
                  placeholder="0"
                />
                {errors.total_pieces && (
                  <p className="text-red-500 text-sm">{errors.total_pieces}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="good_pieces">Good Pieces</Label>
                <Input
                  id="good_pieces"
                  type="number"
                  value={formData.good_pieces}
                  onChange={(e) =>
                    handleInputChange("good_pieces", Number(e.target.value))
                  }
                  className={errors.good_pieces ? "border-red-500" : ""}
                  placeholder="0"
                />
                {errors.good_pieces && (
                  <p className="text-red-500 text-sm">{errors.good_pieces}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="damaged_pieces">Damaged Pieces</Label>
                <Input
                  id="damaged_pieces"
                  type="number"
                  value={formData.damaged_pieces}
                  onChange={(e) =>
                    handleInputChange("damaged_pieces", Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejected_pieces">Rejected Pieces</Label>
                <Input
                  id="rejected_pieces"
                  type="number"
                  value={formData.rejected_pieces}
                  onChange={(e) =>
                    handleInputChange("rejected_pieces", Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Size Breakdown */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Size Breakdown</h3>
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

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Any additional notes or remarks"
              rows={3}
            />
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
                  {editingEntry ? "Updating..." : "Creating..."}
                </>
              ) : editingEntry ? (
                "Update Entry"
              ) : (
                "Create Entry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
