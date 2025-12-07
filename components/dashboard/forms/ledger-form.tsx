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
import { AlertCircle, Loader2, Upload } from "lucide-react";

export function LedgerForm({
  isOpen,
  onClose,
  onSubmit,
  editingLedger,
  isLoading = false,
  parentLedgers = [],
}) {
  const [formData, setFormData] = useState({
    business_name: "",
    contact_person_name: "",
    mobile_number: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    zip_code: "",
    gst_number: "",
    pan_number: "",
    business_logo: "",
  });

  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (editingLedger) {
      setFormData({
        business_name: editingLedger.business_name || "",
        contact_person_name: editingLedger.contact_person_name || "",
        mobile_number: editingLedger.mobile_number || "",
        email: editingLedger.email || "",
        address: editingLedger.address || "",
        city: editingLedger.city || "",
        district: editingLedger.district || "",
        state: editingLedger.state || "",
        country: editingLedger.country || "India",
        zip_code: editingLedger.zip_code || "",
        gst_number: editingLedger.gst_number || "",
        pan_number: editingLedger.pan_number || "",
        business_logo: editingLedger.business_logo || "",
      });
      setLogoPreview(editingLedger.business_logo || "");
    } else {
      resetForm();
    }
  }, [editingLedger, isOpen]);

  const resetForm = () => {
    setFormData({
      business_name: "",
      contact_person_name: "",
      mobile_number: "",
      email: "",
      address: "",
      city: "",
      district: "",
      state: "",
      country: "India",
      zip_code: "",
      gst_number: "",
      pan_number: "",
      business_logo: "",
    });
    setErrors({});
    setLogoFile(null);
    setLogoPreview("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    } else if (formData.business_name.length < 2) {
      newErrors.business_name = "Business name must be at least 2 characters";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (
      formData.mobile_number &&
      !/^[0-9+\-\s()]+$/.test(formData.mobile_number)
    ) {
      newErrors.mobile_number = "Please enter a valid mobile number";
    }

    if (
      formData.gst_number &&
      !/^[0-9A-Z]{15}$/.test(formData.gst_number.replace(/\s/g, ""))
    ) {
      newErrors.gst_number = "GST number must be 15 characters alphanumeric";
    }

    if (
      formData.pan_number &&
      !/^[0-9A-Z]{10}$/.test(formData.pan_number.replace(/\s/g, ""))
    ) {
      newErrors.pan_number = "PAN number must be 10 characters alphanumeric";
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
      // If there's a new logo file, upload it first
      if (logoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", logoFile);

        const uploadResponse = await fetch("/api/admin/ledgers/upload-logo", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          setFormData((prev) => ({ ...prev, business_logo: uploadResult.url }));
        }
      }

      await onSubmit(formData);

      if (!editingLedger) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save ledger. Please try again.";

      if (error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A business with this name already exists.";
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

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          business_logo: "Logo file size must be less than 5MB",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, business_logo: "Please select an image file" });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors({ ...errors, business_logo: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLedger ? "Edit Business Ledger" : "Add New Business Ledger"}
          </DialogTitle>
          <DialogDescription>
            {editingLedger
              ? "Update the business information below."
              : "Fill in the details to create a new business ledger."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) =>
                    handleInputChange("business_name", e.target.value)
                  }
                  className={errors.business_name ? "border-red-500" : ""}
                  placeholder="e.g., ABC Trading Company"
                />
                {errors.business_name && (
                  <p className="text-red-500 text-sm">{errors.business_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_name">Contact Person Name</Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) =>
                    handleInputChange("contact_person_name", e.target.value)
                  }
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={formData.mobile_number}
                  onChange={(e) =>
                    handleInputChange("mobile_number", e.target.value)
                  }
                  className={errors.mobile_number ? "border-red-500" : ""}
                  placeholder="e.g., +91 98765 43210"
                />
                {errors.mobile_number && (
                  <p className="text-red-500 text-sm">{errors.mobile_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="e.g., contact@business.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Complete business address"
                rows={2}
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g., Mumbai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) =>
                    handleInputChange("district", e.target.value)
                  }
                  placeholder="e.g., Mumbai City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) =>
                    handleInputChange("zip_code", e.target.value)
                  }
                  placeholder="e.g., 400001"
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tax Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) =>
                    handleInputChange(
                      "gst_number",
                      e.target.value.toUpperCase()
                    )
                  }
                  className={errors.gst_number ? "border-red-500" : ""}
                  placeholder="e.g., 27AAPCU1234C1ZV"
                />
                {errors.gst_number && (
                  <p className="text-red-500 text-sm">{errors.gst_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={formData.pan_number}
                  onChange={(e) =>
                    handleInputChange(
                      "pan_number",
                      e.target.value.toUpperCase()
                    )
                  }
                  className={errors.pan_number ? "border-red-500" : ""}
                  placeholder="e.g., AAPCU1234C"
                />
                {errors.pan_number && (
                  <p className="text-red-500 text-sm">{errors.pan_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Logo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Logo</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_logo">Upload Logo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="business_logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("business_logo")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-500">
                    {logoFile ? logoFile.name : "No file chosen"}
                  </span>
                </div>
                {errors.business_logo && (
                  <p className="text-red-500 text-sm">{errors.business_logo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-100">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Business logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No logo
                    </div>
                  )}
                </div>
              </div>
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
                  {editingLedger ? "Updating..." : "Creating..."}
                </>
              ) : editingLedger ? (
                "Update Business Ledger"
              ) : (
                "Create Business Ledger"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
