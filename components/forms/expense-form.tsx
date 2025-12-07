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
import { Expense, ExpenseFormData } from "@/types/production";

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: ExpenseFormData) => Promise<void>;
  editingExpense?: Expense | null;
  isLoading?: boolean;
}

export function ExpenseForm({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
  isLoading = false,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(() => ({
    expense_date: "",
    expense_type: "",
    cost: 0,
    challan_no: "",
    challan_type: "",
    description: "",
    paid_to: "",
    payment_mode: "",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        expense_date: editingExpense.expense_date || "",
        expense_type: editingExpense.expense_type || "",
        cost: editingExpense.cost || 0,
        challan_no: editingExpense.challan_no || "",
        challan_type: editingExpense.challan_type || "",
        description: editingExpense.description || "",
        paid_to: editingExpense.paid_to || "",
        payment_mode: editingExpense.payment_mode || "",
      });
    } else {
      resetForm();
    }
  }, [editingExpense, isOpen]);

  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split("T")[0],
      expense_type: "",
      cost: 0,
      challan_no: "",
      challan_type: "",
      description: "",
      paid_to: "",
      payment_mode: "",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.expense_date) {
      newErrors.expense_date = "Expense date is required";
    }

    if (!formData.expense_type) {
      newErrors.expense_type = "Expense type is required";
    }

    if (!formData.cost || formData.cost <= 0) {
      newErrors.cost = "Cost must be greater than 0";
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

      if (!editingExpense) {
        resetForm();
      }
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save expense. Please try again.";

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
    field: keyof ExpenseFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const expenseTypes = ["Transport", "Labor", "Job Work", "Material", "Other"];

  const challanTypes = ["Weaver", "Stitching", "Purchase", "Other"];

  const paymentModes = ["Cash", "Bank Transfer", "Cheque", "UPI", "Other"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
          <DialogDescription>
            {editingExpense
              ? "Update the expense information below."
              : "Fill in the details to create a new expense entry."}
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
              <Label htmlFor="expense_date">Expense Date *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) =>
                  handleInputChange("expense_date", e.target.value)
                }
                className={errors.expense_date ? "border-red-500" : ""}
              />
              {errors.expense_date && (
                <p className="text-red-500 text-sm">{errors.expense_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_type">Expense Type *</Label>
              <Select
                value={formData.expense_type}
                onValueChange={(value) =>
                  handleInputChange("expense_type", value)
                }
              >
                <SelectTrigger
                  className={errors.expense_type ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expense_type && (
                <p className="text-red-500 text-sm">{errors.expense_type}</p>
              )}
            </div>
          </div>

          {/* Challan Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="challan_no">Challan Number</Label>
              <Input
                id="challan_no"
                value={formData.challan_no}
                onChange={(e) =>
                  handleInputChange("challan_no", e.target.value)
                }
                placeholder="e.g., WC-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challan_type">Challan Type</Label>
              <Select
                value={formData.challan_type}
                onValueChange={(value) =>
                  handleInputChange("challan_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select challan type" />
                </SelectTrigger>
                <SelectContent>
                  {challanTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the expense"
              rows={3}
            />
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paid_to">Paid To</Label>
              <Input
                id="paid_to"
                value={formData.paid_to}
                onChange={(e) => handleInputChange("paid_to", e.target.value)}
                placeholder="Enter recipient name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_mode">Payment Mode</Label>
              <Select
                value={formData.payment_mode}
                onValueChange={(value) =>
                  handleInputChange("payment_mode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Cost *</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) =>
                handleInputChange("cost", Number(e.target.value))
              }
              className={errors.cost ? "border-red-500" : ""}
              placeholder="0.00"
            />
            {errors.cost && (
              <p className="text-red-500 text-sm">{errors.cost}</p>
            )}
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
                  {editingExpense ? "Updating..." : "Creating..."}
                </>
              ) : editingExpense ? (
                "Update Expense"
              ) : (
                "Create Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
