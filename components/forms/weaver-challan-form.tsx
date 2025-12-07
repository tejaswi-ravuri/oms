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
import {
  WeaverChallan,
  WeaverChallanFormData,
  Ledger,
  Purchase,
} from "@/types/production";

interface WeaverChallanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (challanData: WeaverChallanFormData) => Promise<void>;
  editingChallan?: WeaverChallan | null;
  isLoading?: boolean;
  weavers: Ledger[];
  purchases: Purchase[];
}

export function WeaverChallanForm({
  isOpen,
  onClose,
  onSubmit,
  editingChallan,
  isLoading = false,
  weavers = [],
  purchases = [],
}: WeaverChallanFormProps) {
  const [weaversList, setWeaversList] = useState<Ledger[]>(weavers);
  const [purchasesList, setPurchasesList] = useState<Purchase[]>(purchases);
  const [loadingWeavers, setLoadingWeavers] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [formData, setFormData] = useState<WeaverChallanFormData>({
    challan_no: "",
    challan_date: "",
    purchase_id: undefined,
    weaver_ledger_id: "",
    material_type: "",
    quantity_sent_meters: 0,
    quantity_received_meters: 0,
    rate_per_meter: 0,
    vendor_amount: 0,
    transport_name: "",
    lr_number: "",
    transport_charge: 0,
    status: "Sent",
    ms_party_name: "",
    batch_number: "",
    total_grey_mtr: 0,
    taka: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch weavers and purchases when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchWeavers();
      fetchPurchases();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingChallan) {
      setFormData({
        challan_no: editingChallan.challan_no || "",
        challan_date: editingChallan.challan_date || "",
        purchase_id: editingChallan.purchase_id,
        weaver_ledger_id: editingChallan.weaver_ledger_id || "",
        material_type: editingChallan.material_type || "",
        quantity_sent_meters: editingChallan.quantity_sent_meters || 0,
        quantity_received_meters: editingChallan.quantity_received_meters || 0,
        rate_per_meter: editingChallan.rate_per_meter || 0,
        vendor_amount: editingChallan.vendor_amount || 0,
        transport_name: editingChallan.transport_name || "",
        lr_number: editingChallan.lr_number || "",
        transport_charge: editingChallan.transport_charge || 0,
        status: editingChallan.status || "Sent",
        ms_party_name: editingChallan.ms_party_name || "",
        batch_number: editingChallan.batch_number || "",
        total_grey_mtr: editingChallan.total_grey_mtr || 0,
        taka: editingChallan.taka || 0,
      });
    } else {
      resetForm();
    }
  }, [editingChallan, isOpen]);

  // Fetch weavers from API
  const fetchWeavers = async () => {
    setLoadingWeavers(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ledgers")
        .select("ledger_id, business_name")
        .order("business_name");

      if (error) {
        console.error("Error fetching weavers:", error);
        return;
      }

      console.log("Fetched weavers:", data); // Debug log
      setWeaversList(data || []);
    } catch (error) {
      console.error("Error fetching weavers:", error);
    } finally {
      setLoadingWeavers(false);
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
      challan_no: "",
      challan_date: new Date().toISOString().split("T")[0],
      purchase_id: undefined,
      weaver_ledger_id: "",
      material_type: "",
      quantity_sent_meters: 0,
      quantity_received_meters: 0,
      rate_per_meter: 0,
      vendor_amount: 0,
      transport_name: "",
      lr_number: "",
      transport_charge: 0,
      status: "Sent",
      ms_party_name: "",
      batch_number: "",
      total_grey_mtr: 0,
      taka: 0,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.challan_date) {
      newErrors.challan_date = "Challan date is required";
    }

    if (!formData.challan_no.trim()) {
      newErrors.challan_no = "Challan number is required";
    }

    if (!formData.weaver_ledger_id) {
      newErrors.weaver_ledger_id = "Weaver is required";
    }

    if (!formData.material_type?.trim()) {
      newErrors.material_type = "Material type is required";
    }

    if (!formData.ms_party_name?.trim()) {
      newErrors.ms_party_name = "MS Party name is required";
    }

    if (!formData.batch_number?.trim()) {
      newErrors.batch_number = "Batch number is required";
    }

    if (!formData.total_grey_mtr || formData.total_grey_mtr <= 0) {
      newErrors.total_grey_mtr = "Total grey meters must be greater than 0";
    }

    if (!formData.taka || formData.taka <= 0) {
      newErrors.taka = "Taka must be greater than 0";
    }

    if (!formData.quantity_sent_meters || formData.quantity_sent_meters <= 0) {
      newErrors.quantity_sent_meters = "Quantity sent must be greater than 0";
    }

    if (
      formData.quantity_received_meters &&
      formData.quantity_received_meters > formData.quantity_sent_meters
    ) {
      newErrors.quantity_received_meters =
        "Quantity received cannot be greater than quantity sent";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Calculate vendor amount if not provided
      const submitData = {
        ...formData,
        vendor_amount:
          formData.vendor_amount ||
          (formData.quantity_received_meters || 0) *
            (formData.rate_per_meter || 0),
      };

      await onSubmit(submitData);

      if (!editingChallan) {
        resetForm();
      }
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save weaver challan. Please try again.";

      if (error instanceof Error) {
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

  const handleInputChange = (
    field: keyof WeaverChallanFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate vendor amount when rate or received quantity changes
    if (field === "rate_per_meter" || field === "quantity_received_meters") {
      const rate =
        field === "rate_per_meter" ? Number(value) : formData.rate_per_meter;
      const received =
        field === "quantity_received_meters"
          ? Number(value)
          : formData.quantity_received_meters;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        vendor_amount: (received || 0) * (rate || 0),
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePurchaseChange = (purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === Number(purchaseId));
    if (purchase) {
      setFormData((prev) => ({
        ...prev,
        purchase_id: Number(purchaseId),
        material_type: purchase.material_type,
        rate_per_meter: purchase.rate_per_meter || 0,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingChallan ? "Edit Weaver Challan" : "Add New Weaver Challan"}
          </DialogTitle>
          <DialogDescription>
            {editingChallan
              ? "Update the weaver challan information below."
              : "Fill in the details to create a new weaver challan."}
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
              <Label htmlFor="challan_date">Challan Date *</Label>
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
                placeholder="e.g., WC-2024-001"
              />
              {errors.challan_no && (
                <p className="text-red-500 text-sm">{errors.challan_no}</p>
              )}
            </div>
          </div>

          {/* Purchase and Weaver Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_id">Purchase (Optional)</Label>
              <Select
                value={formData.purchase_id?.toString() || ""}
                onValueChange={handlePurchaseChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purchase" />
                </SelectTrigger>
                <SelectContent>
                  {purchasesList.map((purchase) => (
                    <SelectItem
                      key={purchase.id}
                      value={purchase.id?.toString() || ""}
                    >
                      {purchase.purchase_no} - {purchase.material_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaver_ledger_id">Weaver *</Label>
              <Select
                value={formData.weaver_ledger_id}
                onValueChange={(value) =>
                  handleInputChange("weaver_ledger_id", value)
                }
                disabled={loadingWeavers}
              >
                <SelectTrigger
                  className={errors.weaver_ledger_id ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      loadingWeavers ? "Loading weavers..." : "Select weaver"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {weaversList.map((weaver) => (
                    <SelectItem key={weaver.ledger_id} value={weaver.ledger_id}>
                      {weaver.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.weaver_ledger_id && (
                <p className="text-red-500 text-sm">
                  {errors.weaver_ledger_id}
                </p>
              )}
            </div>
          </div>

          {/* Party and Batch Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ms_party_name">MS Party Name *</Label>
              <Input
                id="ms_party_name"
                value={formData.ms_party_name}
                onChange={(e) =>
                  handleInputChange("ms_party_name", e.target.value)
                }
                className={errors.ms_party_name ? "border-red-500" : ""}
                placeholder="Enter MS party name"
              />
              {errors.ms_party_name && (
                <p className="text-red-500 text-sm">{errors.ms_party_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) =>
                  handleInputChange("batch_number", e.target.value)
                }
                className={errors.batch_number ? "border-red-500" : ""}
                placeholder="Enter batch number"
              />
              {errors.batch_number && (
                <p className="text-red-500 text-sm">{errors.batch_number}</p>
              )}
            </div>
          </div>

          {/* Material Information */}
          <div className="grid grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="total_grey_mtr">Total Grey Meters *</Label>
              <Input
                id="total_grey_mtr"
                type="number"
                step="0.01"
                value={formData.total_grey_mtr}
                onChange={(e) =>
                  handleInputChange("total_grey_mtr", Number(e.target.value))
                }
                className={errors.total_grey_mtr ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.total_grey_mtr && (
                <p className="text-red-500 text-sm">{errors.total_grey_mtr}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taka">Taka *</Label>
              <Input
                id="taka"
                type="number"
                step="1"
                value={formData.taka}
                onChange={(e) =>
                  handleInputChange("taka", Number(e.target.value))
                }
                className={errors.taka ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.taka && (
                <p className="text-red-500 text-sm">{errors.taka}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_sent_meters">
                Quantity Sent (meters) *
              </Label>
              <Input
                id="quantity_sent_meters"
                type="number"
                step="0.01"
                value={formData.quantity_sent_meters}
                onChange={(e) =>
                  handleInputChange(
                    "quantity_sent_meters",
                    Number(e.target.value)
                  )
                }
                className={errors.quantity_sent_meters ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.quantity_sent_meters && (
                <p className="text-red-500 text-sm">
                  {errors.quantity_sent_meters}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_received_meters">
                Quantity Received (meters)
              </Label>
              <Input
                id="quantity_received_meters"
                type="number"
                step="0.01"
                value={formData.quantity_received_meters}
                onChange={(e) =>
                  handleInputChange(
                    "quantity_received_meters",
                    Number(e.target.value)
                  )
                }
                className={
                  errors.quantity_received_meters ? "border-red-500" : ""
                }
                placeholder="0.00"
              />
              {errors.quantity_received_meters && (
                <p className="text-red-500 text-sm">
                  {errors.quantity_received_meters}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_per_meter">Rate per Meter</Label>
              <Input
                id="rate_per_meter"
                type="number"
                step="0.01"
                value={formData.rate_per_meter}
                onChange={(e) =>
                  handleInputChange("rate_per_meter", Number(e.target.value))
                }
                placeholder="0.00"
              />
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

          {/* Vendor Amount (Calculated) */}
          <div className="space-y-2">
            <Label htmlFor="vendor_amount">Vendor Amount</Label>
            <Input
              id="vendor_amount"
              type="number"
              step="0.01"
              value={formData.vendor_amount}
              onChange={(e) =>
                handleInputChange("vendor_amount", Number(e.target.value))
              }
              placeholder="Auto-calculated"
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
