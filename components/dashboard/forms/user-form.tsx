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
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface User {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  user_role: "Admin" | "Pmanager" | "Imanager" | "User";
  user_status: "Active" | "Inactive" | "Suspended";
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  document_type?: string;
  document_number?: string;
  dob?: string;
  profile_photo?: string;
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: User) => Promise<void>;
  editingUser?: User | null;
  isLoading?: boolean;
}

export function UserForm({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  isLoading = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    email: "",
    first_name: "",
    last_name: "",
    user_role: "User",
    user_status: "Active",
    mobile: "",
    address: "",
    city: "",
    state: "",
    document_type: "",
    document_number: "",
    dob: "",
    profile_photo: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [originalProfilePhoto, setOriginalProfilePhoto] = useState<string>("");

  useEffect(() => {
    if (editingUser) {
      setFormData(editingUser);
      setImagePreview(editingUser.profile_photo || "");
      setOriginalProfilePhoto(editingUser.profile_photo || "");
    } else {
      resetForm();
    }
  }, [editingUser, isOpen]);

  const resetForm = () => {
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      user_role: "User",
      user_status: "Active",
      mobile: "",
      address: "",
      city: "",
      state: "",
      document_type: "",
      document_number: "",
      dob: "",
      profile_photo: "",
    });
    setErrors({});
    setProfileImageFile(null);
    setImagePreview("");
    setOriginalProfilePhoto("");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
    }

    if (!formData.user_role) {
      newErrors.user_role = "Role is required";
    }

    // user_status is not required for validation - defaults to "Active"

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          profile_photo: "Image size must be less than 5MB",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, profile_photo: "Please select an image file" });
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let profilePhotoUrl = formData.profile_photo;

      // Upload image only if a new file is selected
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Use "avatars" bucket as specified in the setup guide
        const { error: uploadError } = await (supabase as any).storage
          .from("avatars")
          .upload(filePath, profileImageFile);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // If bucket doesn't exist, try to create it or use fallback
          if (uploadError.message.includes("bucket not found")) {
            setErrors({
              ...errors,
              submit:
                "Storage bucket not found. Please ensure 'avatars' bucket exists in Supabase.",
            });
            return;
          }
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = (supabase as any).storage.from("avatars").getPublicUrl(filePath);

        profilePhotoUrl = publicUrl;
      } else if (editingUser) {
        // Keep the original profile photo if no new file is selected
        profilePhotoUrl = originalProfilePhoto;
      }

      // Ensure we have the user ID when editing
      const submitData = {
        ...formData,
        profile_photo: profilePhotoUrl,
      };

      if (editingUser && editingUser.id) {
        submitData.id = editingUser.id;
      }

      await onSubmit(submitData);

      if (!editingUser) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to save user. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A user with this email already exists.";
        } else if (error.message.includes("storage")) {
          errorMessage = "Failed to upload profile photo. Please try again.";
        }
      }

      setErrors({
        ...errors,
        submit: errorMessage,
      });
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
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
            {editingUser ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update the user information below."
              : "Fill in the details to create a new user account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Profile Photo */}
          <div className="space-y-2">
            <Label htmlFor="profile_photo">Profile Photo</Label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    No Photo
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="profile_photo"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("profile_photo")?.click()
                  }
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>
                {errors.profile_photo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.profile_photo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                className={errors.first_name ? "border-red-500" : ""}
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                className={errors.last_name ? "border-red-500" : ""}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
              disabled={!!editingUser} // Don't allow email change for existing users
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) =>
                handleInputChange(
                  "mobile",
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => handleInputChange("dob", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_role">Role *</Label>
              <Select
                value={formData.user_role}
                onValueChange={(value) => handleInputChange("user_role", value)}
              >
                <SelectTrigger
                  className={errors.user_role ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Pmanager">Project Manager</SelectItem>
                  <SelectItem value="Imanager">Inventory Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.user_role && (
                <p className="text-red-500 text-sm">{errors.user_role}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_status">Status</Label>
              <Select
                value={formData.user_status}
                onValueChange={(value) =>
                  handleInputChange("user_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
              />
            </div>
          </div>

          {/* Document Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) =>
                  handleInputChange("document_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">
                    Driving License
                  </SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">Document Number</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) =>
                  handleInputChange(
                    "document_number",
                    e.target.value.toUpperCase()
                  )
                }
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
                  {editingUser ? "Updating..." : "Creating..."}
                </>
              ) : editingUser ? (
                "Update User"
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
