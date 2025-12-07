"use client";

import { useState, useRef } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Upload, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";

export function BulkOperations({ isOpen, onClose, onRefresh }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/inventory/products/bulk?format=csv");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export products");
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `products-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Products exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export products");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // Create a simple CSV template
      const csvTemplate = `product_name,product_sku,product_category,product_sub_category,product_size,product_color,product_description,product_material,product_brand,product_country,product_status,product_qty,wash_care,cost_price,selling_price
Sample Product,SKU-001,Clothing,T-Shirts,L,Red,A comfortable red t-shirt,Cotton,Bhaktinandan,India,Active,100,Machine wash cold,299.00,599.00`;

      const blob = new Blob([csvTemplate], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "products-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Template downloaded successfully!");
    } catch (error) {
      console.error("Template download error:", error);
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportCSV = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/inventory/products/bulk", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 207) {
          // Multi-status - partial success
          setImportResult(result);
          toast(
            `Partial import: ${result.imported}/${result.total} products imported`,
            {
              icon: "⚠️",
            }
          );
        } else {
          throw new Error(result.error || "Failed to import products");
        }
      } else {
        setImportResult(result);
        toast.success(`Successfully imported ${result.imported} products!`);
        onRefresh();
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import products");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Import products from CSV or export existing products to CSV format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Products</h3>
            <div className="flex gap-4">
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export All Products
              </Button>

              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Export all products to CSV format or download a template to see
              the required format.
            </p>
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import Products</h3>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isImporting}
              />
            </div>

            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <Button
              onClick={handleImportCSV}
              disabled={!selectedFile || isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import Products
            </Button>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                • CSV file must contain headers: product_name, product_sku,
                product_category
              </p>
              <p>
                • Required fields: product_name, product_sku, product_category
              </p>
              <p>
                • Optional fields: product_sub_category, product_size,
                product_color, etc.
              </p>
              <p>• Products with duplicate SKUs will be skipped</p>
            </div>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Import Results</h3>

              {importResult.details && importResult.details.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        Import completed with errors:
                      </p>
                      <div className="max-h-32 overflow-y-auto">
                        {importResult.details.map((error, index) => (
                          <p key={index} className="text-sm">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-600">
                        Import successful!
                      </p>
                      <p>
                        {importResult.imported} out of {importResult.total}{" "}
                        products were imported successfully.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
