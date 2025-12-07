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
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PurchaseForm({
  isOpen,
  onClose,
  onSubmit,
  editingPurchase,
  isLoading = false,
  vendors = [],
}) {
  const [vendorsList, setVendorsList] = useState(vendors);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [formData, setFormData] = useState({
    purchase_date: "",
    purchase_no: "",
    vendor_ledger_id: "",
    material_type: "",
    total_meters: 0,
    rate_per_meter: 0,
    total_amount: 0,
    gst_percent: "Not Applicable",
    invoice_number: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({});

  // Fetch vendors when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  // Fetch vendors from API
  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ledgers")
        .select("ledger_id, business_name")
        .order("business_name");

      if (error) {
        console.error("Error fetching vendors:", error);
        return;
      }

      setVendorsList(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    if (editingPurchase) {
      setFormData({
        purchase_date: editingPurchase.purchase_date || "",
        purchase_no: editingPurchase.purchase_no || "",
        vendor_ledger_id: editingPurchase.vendor_ledger_id || "",
        material_type: editingPurchase.material_type || "",
        total_meters: editingPurchase.total_meters || 0,
        rate_per_meter: editingPurchase.rate_per_meter || 0,
        total_amount: editingPurchase.total_amount || 0,
        gst_percent: editingPurchase.gst_percent || "Not Applicable",
        invoice_number: editingPurchase.invoice_number || "",
        remarks: editingPurchase.remarks || "",
      });
    } else {
      resetForm();
    }
  }, [editingPurchase, isOpen]);

  const resetForm = () => {
    setFormData({
      purchase_date: new Date().toISOString().split("T")[0],
      purchase_no: "",
      vendor_ledger_id: "",
      material_type: "",
      total_meters: 0,
      rate_per_meter: 0,
      total_amount: 0,
      gst_percent: "Not Applicable",
      invoice_number: "",
      remarks: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    }

    if (!formData.purchase_no.trim()) {
      newErrors.purchase_no = "Purchase number is required";
    }

    if (!formData.material_type.trim()) {
      newErrors.material_type = "Material type is required";
    }

    if (!formData.total_meters || formData.total_meters <= 0) {
      newErrors.total_meters = "Total meters must be greater than 0";
    }

    if (!formData.rate_per_meter || formData.rate_per_meter <= 0) {
      newErrors.rate_per_meter = "Rate per meter must be greater than 0";
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
      // Calculate total amount if not provided
      const submitData = {
        ...formData,
        total_amount:
          formData.total_amount ||
          formData.total_meters * (formData.rate_per_meter || 0),
      };

      await onSubmit(submitData);

      if (!editingPurchase) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save purchase. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A purchase with this number already exists.";
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

    // Auto-calculate total amount when meters or rate changes
    if (field === "total_meters" || field === "rate_per_meter") {
      const meters =
        field === "total_meters" ? Number(value) : formData.total_meters;
      const rate =
        field === "rate_per_meter" ? Number(value) : formData.rate_per_meter;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        total_amount: meters * (rate || 0),
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPurchase ? "Edit Purchase" : "Add New Purchase"}
          </DialogTitle>
          <DialogDescription>
            {editingPurchase
              ? "Update the purchase information below."
              : "Fill in the details to create a new purchase entry."}
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
              <Label htmlFor="purchase_date">Purchase Date *</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  handleInputChange("purchase_date", e.target.value)
                }
                className={errors.purchase_date ? "border-red-500" : ""}
              />
              {errors.purchase_date && (
                <p className="text-red-500 text-sm">{errors.purchase_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_no">Purchase Number *</Label>
              <Input
                id="purchase_no"
                value={formData.purchase_no}
                onChange={(e) =>
                  handleInputChange("purchase_no", e.target.value)
                }
                className={errors.purchase_no ? "border-red-500" : ""}
                placeholder="e.g., PO-2024-001"
              />
              {errors.purchase_no && (
                <p className="text-red-500 text-sm">{errors.purchase_no}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_ledger_id">Vendor</Label>
              <Select
                value={formData.vendor_ledger_id}
                onValueChange={(value) =>
                  handleInputChange("vendor_ledger_id", value)
                }
                disabled={loadingVendors}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingVendors ? "Loading vendors..." : "Select vendor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {vendorsList.map((vendor) => (
                    <SelectItem key={vendor.ledger_id} value={vendor.ledger_id}>
                      {vendor.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_type">Material Type *</Label>
              <Select
                value={formData.material_type}
                onValueChange={(value) =>
                  handleInputChange("material_type", value)
                }
              >
                <SelectTrigger
                  className={errors.material_type ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cotton">Cotton</SelectItem>
                  <SelectItem value="Silk">Silk</SelectItem>
                  <SelectItem value="Wool">Wool</SelectItem>
                  <SelectItem value="Polyester">Polyester</SelectItem>
                  <SelectItem value="Linen">Linen</SelectItem>
                </SelectContent>
              </Select>
              {errors.material_type && (
                <p className="text-red-500 text-sm">{errors.material_type}</p>
              )}
            </div>
          </div>

          {/* Quantity and Rate */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_meters">Total Meters *</Label>
              <Input
                id="total_meters"
                type="number"
                step="0.01"
                value={formData.total_meters}
                onChange={(e) =>
                  handleInputChange("total_meters", Number(e.target.value))
                }
                className={errors.total_meters ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.total_meters && (
                <p className="text-red-500 text-sm">{errors.total_meters}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_per_meter">Rate per Meter *</Label>
              <Input
                id="rate_per_meter"
                type="number"
                step="0.01"
                value={formData.rate_per_meter}
                onChange={(e) =>
                  handleInputChange("rate_per_meter", Number(e.target.value))
                }
                className={errors.rate_per_meter ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.rate_per_meter && (
                <p className="text-red-500 text-sm">{errors.rate_per_meter}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) =>
                  handleInputChange("total_amount", Number(e.target.value))
                }
                placeholder="Auto-calculated"
                readOnly
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gst_percent">GST Percentage</Label>
              <Select
                value={formData.gst_percent}
                onValueChange={(value) =>
                  handleInputChange("gst_percent", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select GST %" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) =>
                  handleInputChange("invoice_number", e.target.value)
                }
                placeholder="e.g., INV-2024-001"
              />
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
                  {editingPurchase ? "Updating..." : "Creating..."}
                </>
              ) : editingPurchase ? (
                "Update Purchase"
              ) : (
                "Create Purchase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
