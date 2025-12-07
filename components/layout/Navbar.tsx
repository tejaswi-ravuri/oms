"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { CurrentDateDisplay } from "@/components/ui/date-display";
import { GlobalSearch, useGlobalSearch } from "@/components/ui/global-search";
import { cn } from "@/lib/utils";

// TypeScript types
type Profile = {
  id: string;
  user_role:
    | "Admin"
    | "Inventory Manager"
    | "Production Manager"
    | "Order Managing Executive";
  user_status: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_photo?: string;
};

interface HeaderProps {
  profile: Partial<Profile>;
  onMenuClick: () => void;
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize global search keyboard shortcut
  useGlobalSearch();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = window.confirm(
      "Are you sure you want to logout? Once you logout, you have to login again to use portal."
    );

    if (confirmed) {
      setIsLoggingOut(true);
      try {
        await supabase.auth.signOut();
        // Use hard redirect to ensure complete session clearing
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
        // Fallback to router push if window.location fails
        router.push("/login");
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const getInitials = (
    firstName?: string | null,
    lastName?: string | null,
    fullName?: string | null
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (fullName) {
      const names = fullName.split(" ");
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(
          0
        )}`.toUpperCase();
      }
      return fullName.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.full_name || "User";
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="hidden md:block" data-global-search-trigger>
            <GlobalSearch
              placeholder="Search products, orders, production..."
              className="w-80"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={profile.profile_photo || ""}
                    alt={getDisplayName()}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                    {getInitials(
                      profile.first_name,
                      profile.last_name,
                      profile.full_name
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 bg-white border border-gray-200 shadow-lg"
              align="end"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                className="text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/dashboard/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {/* <DropdownMenuItem className="text-gray-700 hover:bg-gray-100 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;
