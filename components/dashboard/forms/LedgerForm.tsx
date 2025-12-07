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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Upload, X, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function LedgerForm({
  isOpen,
  onClose,
  onSubmit,
  editingLedger,
  isLoading = false,
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
    }

    if (!formData.contact_person_name?.trim()) {
      newErrors.contact_person_name = "Contact person name is required";
    }

    if (!formData.mobile_number?.trim()) {
      newErrors.mobile_number = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = "Please enter a valid 10-digit mobile number";
    }

    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city?.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state?.trim()) {
      newErrors.state = "State is required";
    }

    if (formData.gst_number && formData.gst_number.trim()) {
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z][A-Z0-9]{1}$/.test(
          formData.gst_number
        )
      ) {
        newErrors.gst_number = "Please enter a valid GST number";
      }
    }

    if (formData.pan_number && formData.pan_number.trim()) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
        newErrors.pan_number = "Please enter a valid PAN number";
      }
    }

    if (formData.zip_code && formData.zip_code.trim()) {
      if (!/^[1-9][0-9]{5}$/.test(formData.zip_code)) {
        newErrors.zip_code = "Please enter a valid 6-digit ZIP code";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          business_logo: "Image size must be less than 5MB",
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let logoUrl = formData.business_logo;

      // Upload logo if new file is selected
      if (logoFile) {
        console.log("Uploading logo file:", logoFile.name);

        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Just the filename, no folder prefix

        console.log("Upload path:", filePath);
        console.log("Bucket: business-logos");

        const { error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(filePath, logoFile);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        console.log("Upload successful, getting public URL...");

        const {
          data: { publicUrl },
        } = supabase.storage.from("business-logos").getPublicUrl(filePath);

        console.log("Public URL:", publicUrl);
        logoUrl = publicUrl;
      }

      const submitData = {
        ...formData,
        business_logo: logoUrl,
      };

      if (editingLedger) {
        submitData.ledger_id = editingLedger.ledger_id;
      }

      await onSubmit(submitData);
      if (!editingLedger) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({
        ...errors,
        submit: "Failed to save ledger. Please try again.",
      });
    }
  };

  const handleInputChange = (field, value) => {
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
            {editingLedger ? "Edit Ledger" : "Add New Ledger"}
          </DialogTitle>
          <DialogDescription>
            {editingLedger
              ? "Update the ledger information below."
              : "Fill in the details to create a new ledger."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Business Logo */}
          <div className="space-y-2">
            <Label htmlFor="business_logo">Business Logo</Label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Business Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="business_logo"
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
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Logo
                </Button>
                {errors.business_logo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.business_logo}
                  </p>
                )}
              </div>
            </div>
          </div>

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
                />
                {errors.business_name && (
                  <p className="text-red-500 text-sm">{errors.business_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_name">Contact Person *</Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name || ""}
                  onChange={(e) =>
                    handleInputChange("contact_person_name", e.target.value)
                  }
                  className={errors.contact_person_name ? "border-red-500" : ""}
                />
                {errors.contact_person_name && (
                  <p className="text-red-500 text-sm">
                    {errors.contact_person_name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input
                  id="mobile_number"
                  type="tel"
                  value={formData.mobile_number || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "mobile_number",
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  className={errors.mobile_number ? "border-red-500" : ""}
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
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district || ""}
                  onChange={(e) =>
                    handleInputChange("district", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state || ""}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className={errors.state ? "border-red-500" : ""}
                />
                {errors.state && (
                  <p className="text-red-500 text-sm">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || "India"}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "zip_code",
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className={errors.zip_code ? "border-red-500" : ""}
                />
                {errors.zip_code && (
                  <p className="text-red-500 text-sm">{errors.zip_code}</p>
                )}
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
                  value={formData.gst_number || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "gst_number",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="22AAAAA0000A1Z5"
                  className={errors.gst_number ? "border-red-500" : ""}
                />
                {errors.gst_number && (
                  <p className="text-red-500 text-sm">{errors.gst_number}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={formData.pan_number || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "pan_number",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="AAAAA0000A"
                  className={errors.pan_number ? "border-red-500" : ""}
                />
                {errors.pan_number && (
                  <p className="text-red-500 text-sm">{errors.pan_number}</p>
                )}
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
                "Update Ledger"
              ) : (
                "Create Ledger"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
