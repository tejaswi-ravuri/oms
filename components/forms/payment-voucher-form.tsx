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
import {
  PaymentVoucher,
  PaymentVoucherFormData,
  Ledger,
} from "@/types/production";
import { createClient } from "@/lib/supabase/client";

interface PaymentVoucherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (voucherData: PaymentVoucherFormData) => Promise<void>;
  editingVoucher?: PaymentVoucher | null;
  isLoading?: boolean;
  ledgers?: Ledger[]; // Optional, will fetch if not provided
}

export function PaymentVoucherForm({
  isOpen,
  onClose,
  onSubmit,
  editingVoucher,
  isLoading = false,
  ledgers = [],
}: PaymentVoucherFormProps) {
  const [formData, setFormData] = useState<PaymentVoucherFormData>(() => ({
    voucher_no: "",
    payment_date: "",
    ledger_id: "",
    payment_for: "",
    amount: 0,
    payment_mode: "",
    reference_no: "",
    remarks: "",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ledgersList, setLedgersList] = useState<Ledger[]>(ledgers);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  // Fetch ledgers when dialog opens
  useEffect(() => {
    if (isOpen && ledgers.length === 0) {
      fetchLedgers();
    } else {
      setLedgersList(ledgers);
    }
  }, [isOpen, ledgers]);

  // Fetch ledgers from API
  const fetchLedgers = async () => {
    setLoadingLedgers(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ledgers")
        .select("ledger_id, business_name")
        .order("business_name");

      if (error) {
        console.error("Error fetching ledgers:", error);
        return;
      }

      setLedgersList(data || []);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
    } finally {
      setLoadingLedgers(false);
    }
  };

  useEffect(() => {
    if (editingVoucher) {
      setFormData({
        voucher_no: editingVoucher.voucher_no || "",
        payment_date: editingVoucher.payment_date || "",
        ledger_id: editingVoucher.ledger_id || "",
        payment_for: editingVoucher.payment_for || "",
        amount: editingVoucher.amount || 0,
        payment_mode: editingVoucher.payment_mode || "",
        reference_no: editingVoucher.reference_no || "",
        remarks: editingVoucher.remarks || "",
      });
    } else {
      resetForm();
    }
  }, [editingVoucher, isOpen]);

  const resetForm = () => {
    setFormData({
      voucher_no: "",
      payment_date: new Date().toISOString().split("T")[0],
      ledger_id: "",
      payment_for: "",
      amount: 0,
      payment_mode: "",
      reference_no: "",
      remarks: "",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.payment_date) {
      newErrors.payment_date = "Payment date is required";
    }

    if (!formData.voucher_no.trim()) {
      newErrors.voucher_no = "Voucher number is required";
    }

    if (!formData.payment_mode.trim()) {
      newErrors.payment_mode = "Payment mode is required";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
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
      await onSubmit(formData);

      if (!editingVoucher) {
        resetForm();
      }
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save payment voucher. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErrors({
        ...errors,
        submit: errorMessage,
      });
    }
  };

  const handleInputChange = (
    field: keyof PaymentVoucherFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVoucher
              ? "Edit Payment Voucher"
              : "Add New Payment Voucher"}
          </DialogTitle>
          <DialogDescription>
            {editingVoucher
              ? "Update the payment voucher information below."
              : "Fill in the details to create a new payment voucher."}
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
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) =>
                  handleInputChange("payment_date", e.target.value)
                }
                className={errors.payment_date ? "border-red-500" : ""}
              />
              {errors.payment_date && (
                <p className="text-red-500 text-sm">{errors.payment_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher_no">Voucher Number *</Label>
              <Input
                id="voucher_no"
                value={formData.voucher_no}
                onChange={(e) =>
                  handleInputChange("voucher_no", e.target.value)
                }
                className={errors.voucher_no ? "border-red-500" : ""}
                placeholder="e.g., PV-2024-001"
              />
              {errors.voucher_no && (
                <p className="text-red-500 text-sm">{errors.voucher_no}</p>
              )}
            </div>
          </div>

          {/* Ledger Information */}
          <div className="space-y-2">
            <Label htmlFor="ledger_id">Ledger (Optional)</Label>
            <Select
              value={formData.ledger_id || "none"}
              onValueChange={(value) =>
                handleInputChange("ledger_id", value === "none" ? "" : value)
              }
              disabled={loadingLedgers}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingLedgers
                      ? "Loading ledgers..."
                      : "Select ledger (optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No ledger selected</SelectItem>
                {ledgersList.map((ledger) => (
                  <SelectItem key={ledger.ledger_id} value={ledger.ledger_id}>
                    {ledger.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment For */}
          <div className="space-y-2">
            <Label htmlFor="payment_for">Payment For</Label>
            <Input
              id="payment_for"
              value={formData.payment_for}
              onChange={(e) => handleInputChange("payment_for", e.target.value)}
              placeholder="e.g., Weaver payment, Material purchase, etc."
            />
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_mode">Payment Mode *</Label>
              <Select
                value={formData.payment_mode}
                onValueChange={(value) =>
                  handleInputChange("payment_mode", value)
                }
              >
                <SelectTrigger
                  className={errors.payment_mode ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_mode && (
                <p className="text-red-500 text-sm">{errors.payment_mode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_no">Reference Number</Label>
              <Input
                id="reference_no"
                value={formData.reference_no}
                onChange={(e) =>
                  handleInputChange("reference_no", e.target.value)
                }
                placeholder="e.g., Cheque number, Transaction ID"
              />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                handleInputChange("amount", Number(e.target.value))
              }
              className={errors.amount ? "border-red-500" : ""}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount}</p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Enter any additional remarks"
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
                  {editingVoucher ? "Updating..." : "Creating..."}
                </>
              ) : editingVoucher ? (
                "Update Voucher"
              ) : (
                "Create Voucher"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
