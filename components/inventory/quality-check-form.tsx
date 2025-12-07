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
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Database } from "@/types/database";
import toast from "react-hot-toast";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface QualityCheckFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onRefresh: () => void;
}

interface QCParameter {
  name: string;
  value: string | number;
  status: "pass" | "fail" | "na";
  notes?: string;
}

interface QualityCheckData {
  qcStatus: string;
  qcNotes?: string;
  qcParameters?: QCParameter[];
}

export function QualityCheckForm({
  isOpen,
  onClose,
  selectedProducts,
  onRefresh,
}: QualityCheckFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [qcData, setQcData] = useState<QualityCheckData>({
    qcStatus: "pending",
    qcNotes: "",
    qcParameters: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Default QC parameters
  const defaultQCParameters: QCParameter[] = [
    { name: "Visual Inspection", value: "", status: "na" },
    { name: "Dimensions", value: "", status: "na" },
    { name: "Weight", value: "", status: "na" },
    { name: "Color Accuracy", value: "", status: "na" },
    { name: "Material Quality", value: "", status: "na" },
    { name: "Stitching Quality", value: "", status: "na" },
    { name: "Finish", value: "", status: "na" },
    { name: "Packaging", value: "", status: "na" },
  ];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setQcData({
        qcStatus: "pending",
        qcNotes: "",
        qcParameters: defaultQCParameters,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!qcData.qcStatus) {
      newErrors.qcStatus = "QC status is required";
    }

    if (qcData.qcStatus === "passed") {
      const failedParams =
        qcData.qcParameters?.filter((p) => p.status === "fail") || [];
      if (failedParams.length > 0) {
        newErrors.qcStatus = "Cannot pass QC when parameters have failed";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateQC = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      const productIds = selectedProducts.map((p) => p.id);

      const response = await fetch("/api/inventory/products/quality-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds,
          qcStatus: qcData.qcStatus,
          qcNotes: qcData.qcNotes,
          qcParameters: qcData.qcParameters,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 207) {
          // Multi-status - partial success
          toast(
            `Partial update: ${result.updated}/${result.total} products updated`,
            {
              icon: "⚠️",
            }
          );
        } else {
          throw new Error(result.error || "Failed to update QC status");
        }
      } else {
        toast.success(
          `Successfully updated QC status for ${result.updated} products!`
        );
        onRefresh();
        onClose();
      }
    } catch (error: any) {
      console.error("QC update error:", error);
      toast.error(error.message || "Failed to update QC status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (
    field: keyof QualityCheckData,
    value: string | QCParameter[]
  ) => {
    setQcData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleParameterChange = (
    index: number,
    field: keyof QCParameter,
    value: string | number
  ) => {
    const updatedParameters = [...(qcData.qcParameters || [])];
    updatedParameters[index] = {
      ...updatedParameters[index],
      [field]: value,
    };
    handleInputChange("qcParameters", updatedParameters);
  };

  const getQCStatusIcon = (status: string) => {
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

  const getParameterStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quality Check Update</DialogTitle>
          <DialogDescription>
            Update quality check status and parameters for selected products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Selected Products ({selectedProducts.length})
            </h3>

            <div className="max-h-32 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Current QC</th>
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
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {getQCStatusIcon(
                            (product as any).qc_status || "pending"
                          )}
                          <span className="capitalize">
                            {(product as any).qc_status || "pending"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* QC Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Check Status</h3>

            <div className="space-y-2">
              <Label htmlFor="qc_status">QC Status *</Label>
              <Select
                value={qcData.qcStatus}
                onValueChange={(value) => handleInputChange("qcStatus", value)}
              >
                <SelectTrigger
                  className={errors.qcStatus ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select QC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      {getQCStatusIcon("pending")}
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      {getQCStatusIcon("in_progress")}
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="passed">
                    <div className="flex items-center gap-2">
                      {getQCStatusIcon("passed")}
                      Passed
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      {getQCStatusIcon("failed")}
                      Failed
                    </div>
                  </SelectItem>
                  <SelectItem value="requires_rework">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Requires Rework
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.qcStatus && (
                <p className="text-red-500 text-sm">{errors.qcStatus}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qc_notes">QC Notes</Label>
              <Textarea
                id="qc_notes"
                value={qcData.qcNotes || ""}
                onChange={(e) => handleInputChange("qcNotes", e.target.value)}
                placeholder="Enter quality check notes..."
                rows={3}
              />
            </div>
          </div>

          {/* QC Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">QC Parameters</h3>

            <div className="space-y-3">
              {(qcData.qcParameters || defaultQCParameters).map(
                (param, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-3 border rounded-md"
                  >
                    <div className="col-span-3">
                      <Label className="text-sm font-medium">
                        {param.name}
                      </Label>
                    </div>

                    <div className="col-span-3">
                      <Input
                        type="text"
                        value={param.value || ""}
                        onChange={(e) =>
                          handleParameterChange(index, "value", e.target.value)
                        }
                        placeholder="Value/Measurement"
                        className="text-sm"
                      />
                    </div>

                    <div className="col-span-3">
                      <Select
                        value={param.status}
                        onValueChange={(value) =>
                          handleParameterChange(index, "status", value)
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="na">N/A</SelectItem>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 flex items-center justify-center">
                      {getParameterStatusIcon(param.status)}
                    </div>

                    <div className="col-span-1">
                      <Input
                        type="text"
                        value={param.notes || ""}
                        onChange={(e) =>
                          handleParameterChange(index, "notes", e.target.value)
                        }
                        placeholder="Notes"
                        className="text-sm"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Update Summary</h3>
            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <div className="flex justify-between">
                <span>Total Products:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>New QC Status:</span>
                <span className="font-medium capitalize">
                  {qcData.qcStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Parameters Checked:</span>
                <span className="font-medium">
                  {
                    (qcData.qcParameters || []).filter((p) => p.status !== "na")
                      .length
                  }{" "}
                  / {(qcData.qcParameters || []).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Parameters Passed:</span>
                <span className="font-medium text-green-600">
                  {
                    (qcData.qcParameters || []).filter(
                      (p) => p.status === "pass"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Parameters Failed:</span>
                <span className="font-medium text-red-600">
                  {
                    (qcData.qcParameters || []).filter(
                      (p) => p.status === "fail"
                    ).length
                  }
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
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleUpdateQC} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update QC Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
