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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Building2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// TypeScript types
interface LoginState {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  success: string;
  showPassword: boolean;
  clearingSession: boolean;
  fieldErrors: {
    email?: string;
    password?: string;
  };
}

interface AuthError {
  message: string;
  type: "validation" | "auth" | "profile" | "network" | "unknown";
}

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters long";
  return null;
};

// Error messages for better UX
const getErrorMessage = (error: AuthError): string => {
  console.log("auth error-----", error);
  switch (error.type) {
    case "validation":
      return error.message;
    case "auth":
      if (error.message.includes("Invalid login credentials")) {
        return "Invalid email or password. Please check your credentials and try again.";
      }
      if (error.message.includes("Email not confirmed")) {
        return "Please verify your email address before signing in.";
      }
      return error.message;
    case "profile":
      return "Unable to load your profile. Please contact support.";
    case "network":
      return "Network error. Please check your connection and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({
    email: "",
    password: "",
    loading: false,
    error: "",
    success: "",
    showPassword: false,
    clearingSession: false,
    fieldErrors: {},
  });

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Checking existing auth state...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error checking session:", error);
          return;
        }

        if (session) {
          console.log("✅ User already authenticated:", session.user.email);
          console.log("🔄 Redirecting to dashboard...");

          // Force a hard redirect to ensure middleware runs
          window.location.href = "/dashboard";
          return;
        } else {
          console.log("ℹ️ No existing session found, user needs to login");
        }
      } catch (error) {
        console.error("❌ Auth check failed:", error);
      }
    };

    checkAuth();
  }, [router]);

  const updateField = (field: keyof LoginState, value: any) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      // Clear errors when user types
      ...(field === "email" || field === "password"
        ? {
            error: "",
            success: "",
            fieldErrors: {},
          }
        : {}),
    }));
  };

  const validateForm = (): AuthError | null => {
    const emailError = validateEmail(state.email);
    const passwordError = validatePassword(state.password);

    const fieldErrors = {
      ...(emailError && { email: emailError }),
      ...(passwordError && { password: passwordError }),
    };

    if (Object.keys(fieldErrors).length > 0) {
      setState((prev) => ({ ...prev, fieldErrors }));
      return {
        message: "Please fix the errors below",
        type: "validation",
      };
    }

    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(validationError),
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: "", success: "" }));

    try {
      console.log("🔐 Starting login process...");

      // Step 1: Sign in with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: state.email.trim(),
          password: state.password,
        });

      if (authError) {
        console.error("❌ Auth error:", authError);
        throw {
          message: authError.message,
          type: "auth",
        } as AuthError;
      }

      if (!authData.user || !authData.session) {
        throw {
          message: "Authentication failed - no session created",
          type: "auth",
        } as AuthError;
      }

      console.log("✅ Session established:", authData.user.email);

      // Step 2: Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("❌ Profile fetch error:", profileError);
        throw {
          message: "Profile not found. Please contact support.",
          type: "profile",
        } as AuthError;
      }

      if (!profile) {
        throw {
          message: "User profile not found",
          type: "profile",
        } as AuthError;
      }

      console.log(
        "✅ Profile loaded:",
        profile.email,
        "Role:",
        profile.user_role
      );

      // Step 3: Check account status
      if (profile.user_status !== "Active") {
        console.warn("❌ Account not active:", profile.user_status);
        await supabase.auth.signOut();
        throw {
          message:
            profile.user_status === "Suspended"
              ? "Your account has been suspended. Please contact admin."
              : "Your account is inactive. Please contact admin.",
          type: "auth",
        } as AuthError;
      }

      // Step 4: Show success message
      console.log("✅ Login successful! Redirecting...");
      setState((prev) => ({
        ...prev,
        success: "Login successful! Redirecting to dashboard...",
        loading: true,
      }));

      // Step 5: Redirect using window.location for more reliable redirect
      setTimeout(() => {
        console.log("🚀 Performing redirect to dashboard...");
        console.log("🔍 Final session check before redirect...");

        // Verify session is still valid before redirect
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log("✅ Session confirmed, redirecting...");
            window.location.href = "/dashboard";
          } else {
            console.error("❌ Session lost before redirect");
            setState((prev) => ({
              ...prev,
              error: "Session lost. Please try logging in again.",
              loading: false,
              success: "",
            }));
          }
        });
      }, 1500);
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Login error:", error);
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(error),
        loading: false,
      }));
    }
  };

  const handleClearSession = async () => {
    setState((prev) => ({
      ...prev,
      clearingSession: true,
      error: "",
      success: "",
    }));

    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      setState((prev) => ({
        ...prev,
        email: "",
        password: "",
        success: "Session cleared! You can now login with fresh credentials.",
        error: "",
        clearingSession: false,
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, success: "" }));
      }, 3000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Error clearing session. Please try refreshing the page.",
        clearingSession: false,
      }));
    }
  };

  const {
    email,
    password,
    loading,
    error,
    success,
    showPassword,
    clearingSession,
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
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Sign in to access your dashboard
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

            <form onSubmit={handleLogin} className="space-y-5">
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

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-300 font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading || clearingSession}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Session Clear Button */}
            <div className="text-center space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSession}
                disabled={clearingSession || loading}
                className="text-gray-400 hover:text-white text-xs disabled:opacity-50"
              >
                {clearingSession ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Clear Session & Reset
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/debug/auth");
                    const data = await response.json();
                    console.log("🔍 Auth Debug Info:", data);
                    alert("Check console for auth debug info");
                  } catch (error) {
                    console.error("Debug error:", error);
                    alert("Debug failed - check console");
                  }
                }}
                disabled={loading}
                className="text-gray-400 hover:text-white text-xs disabled:opacity-50 w-full"
              >
                🐛 Debug Auth State
              </Button>
            </div>

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
