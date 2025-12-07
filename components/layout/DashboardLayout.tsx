"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import Header from "./Navbar";
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: Partial<Profile>;
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close mobile sidebar when switching to desktop
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed and above navbar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar
          profile={profile}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          isMinimized={isMinimized}
          onToggleMinimize={handleToggleMinimize}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          isMinimized ? "lg:ml-24" : "lg:ml-64"
        )}
      >
        {/* Fixed Header */}
        <Header profile={profile} onMenuClick={handleMenuClick} />

        {/* Scrollable Content Area */}
        <main className="flex-1 pt-16 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
