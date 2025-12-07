"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Building2,
  AlertCircle,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Validation functions
const validateFirstName = (firstName) => {
  if (!firstName.trim()) return "First name is required";
  if (firstName.length < 2) return "First name must be at least 2 characters";
  if (!/^[a-zA-Z\s]+$/.test(firstName))
    return "First name can only contain letters";
  return null;
};

const validateLastName = (lastName) => {
  if (!lastName.trim()) return "Last name is required";
  if (lastName.length < 2) return "Last name must be at least 2 characters";
  if (!/^[a-zA-Z\s]+$/.test(lastName))
    return "Last name can only contain letters";
  return null;
};

const validateEmail = (email) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/(?=.*[a-z])/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/(?=.*[A-Z])/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/(?=.*\d)/.test(password))
    return "Password must contain at least one number";
  return null;
};

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
};

// Error messages for better UX
const getErrorMessage = (error) => {
  switch (error.type) {
    case "validation":
      return error.message;
    case "auth":
      if (error.message.includes("User already registered")) {
        return "An account with this email already exists. Please sign in instead.";
      }
      if (error.message.includes("Password should be")) {
        return "Password does not meet the requirements.";
      }
      return error.message;
    case "profile":
      return "Unable to create your profile. Please try again.";
    case "network":
      return "Network error. Please check your connection and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

export default function SignupPage() {
  const [state, setState] =
    useState <
    SignupState >
    {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      userRole: "",
      loading: false,
      error: "",
      success: "",
      showPassword: false,
      showConfirmPassword: false,
      agreed: false,
      fieldErrors: {},
    };

  const router = useRouter();

  // Clear error when user starts typing
  useEffect(() => {
    if (state.error) {
      setState((prev) => ({ ...prev, error: "", fieldErrors: {} }));
    }
  }, [
    state.firstName,
    state.lastName,
    state.email,
    state.password,
    state.confirmPassword,
    state.userRole,
  ]);

  const updateField = (field, value) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const fieldErrors = {
      ...(validateFirstName(state.firstName) && {
        firstName: validateFirstName(state.firstName),
      }),
      ...(validateLastName(state.lastName) && {
        lastName: validateLastName(state.lastName),
      }),
      ...(validateEmail(state.email) && { email: validateEmail(state.email) }),
      ...(validatePassword(state.password) && {
        password: validatePassword(state.password),
      }),
      ...(validateConfirmPassword(state.password, state.confirmPassword) && {
        confirmPassword: validateConfirmPassword(
          state.password,
          state.confirmPassword
        ),
      }),
    };

    if (!state.userRole) {
      fieldErrors.userRole = "Please select a role";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setState((prev) => ({ ...prev, fieldErrors: fieldErrors }));
      return {
        message: "Please fix the errors below",
        type: "validation",
      };
    }

    if (!state.agreed) {
      return {
        message: "Please agree to the terms and conditions",
        type: "validation",
      };
    }

    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setState((prev) => ({ ...prev, error: "", success: "" }));

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(validationError),
      }));
      return;
    }

    updateField("loading", true);

    try {
      // 1. Sign up user with Supabase Auth with role in JWT metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.email.trim(),
        password: state.password,
        options: {
          data: {
            first_name: state.firstName.trim(),
            last_name: state.lastName.trim(),
            role: state.userRole, // Set role in JWT metadata
          },
        },
      });

      if (authError) {
        throw {
          message: authError.message,
          type: "auth",
        };
      }

      if (!authData?.user?.id) {
        throw {
          message: "Signup failed: Could not retrieve user ID.",
          type: "auth",
        };
      }

      // // 2. Create user profile (simplified - only required fields)
      // const { error: profileError } = await supabase.from("profiles").upsert(
      //   {
      //     id: authData.user.id,
      //     email: state.email.trim(),
      //     first_name: state.firstName.trim(),
      //     last_name: state.lastName.trim(),
      //     user_role: state.userRole,
      //     user_status: "Active",
      //     created_at: new Date().toISOString(),
      //     updated_at: new Date().toISOString(),
      //   } as any,
      //   { onConflict: "id" }
      // );

      // if (profileError) {
      //   console.error("Profile Error Details:", profileError);
      //   throw {
      //     message: profileError.message || "Failed to create profile",
      //     type: "profile",
      //   } as AuthError;
      // }

      // 3. Email confirmation and redirect
      if (!authData.session) {
        setState((prev) => ({
          ...prev,
          success:
            "Please check your email to confirm your account before logging in.",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          success: "Account created successfully! Redirecting to dashboard...",
        }));
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      const error = err;
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(error),
        loading: false,
      }));
    }
  };

  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    userRole,
    loading,
    error,
    success,
    showPassword,
    showConfirmPassword,
    agreed,
    fieldErrors,
  } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Join us to access your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8">
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-500/20 border-red-500/50 text-white"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-500/20 border-green-500/50 text-white">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-gray-300 font-medium"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      required
                      disabled={loading}
                      className={`bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-lg ${
                        fieldErrors.firstName
                          ? "border-red-400 focus:border-red-400"
                          : ""
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-gray-300 font-medium"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      required
                      disabled={loading}
                      className={`bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-lg ${
                        fieldErrors.lastName
                          ? "border-red-400 focus:border-red-400"
                          : ""
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-gray-300 font-medium flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    disabled={loading}
                    className={`bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-lg ${
                      fieldErrors.email
                        ? "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Account Details
                </h3>
                <div className="space-y-2">
                  <Label
                    htmlFor="userRole"
                    className="text-gray-300 font-medium"
                  >
                    Select Role
                  </Label>
                  <Select
                    value={userRole}
                    onValueChange={(value) => updateField("userRole", value)}
                    required
                  >
                    <SelectTrigger
                      className={`bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-lg ${
                        fieldErrors.userRole
                          ? "border-red-400 focus:border-red-400"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-foreground">
                      <SelectItem
                        value="User"
                        className="text-foreground hover:bg-accent/50 focus:bg-accent/50"
                      >
                        User
                      </SelectItem>
                      <SelectItem
                        value="Pmanager"
                        className="text-foreground hover:bg-accent/50 focus:bg-accent/50"
                      >
                        Project Manager
                      </SelectItem>
                      <SelectItem
                        value="Imanager"
                        className="text-foreground hover:bg-accent/50 focus:bg-accent/50"
                      >
                        Inventory Manager
                      </SelectItem>
                      <SelectItem
                        value="Admin"
                        className="text-foreground hover:bg-accent/50 focus:bg-accent/50"
                      >
                        Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.userRole && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.userRole}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-300 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (min 8 characters)"
                      value={password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
                      disabled={loading}
                      className={`bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-lg pr-12 ${
                        fieldErrors.password
                          ? "border-red-400 focus:border-red-400"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => updateField("showPassword", !showPassword)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-gray-300 font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                      required
                      disabled={loading}
                      className={`bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 rounded-lg pr-12 ${
                        fieldErrors.confirmPassword
                          ? "border-red-400 focus:border-red-400"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateField("showConfirmPassword", !showConfirmPassword)
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => updateField("agreed", checked)}
                  disabled={loading}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-gray-300 leading-relaxed"
                >
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center text-sm text-gray-300">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  Sign in here
                </Link>
              </div>
            </form>

            <div className="text-center text-sm text-gray-400 mt-8">
              Made with <span className="text-red-500">❤️</span> by{" "}
              <a
                href="https://dominaretech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                DominareTech
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
