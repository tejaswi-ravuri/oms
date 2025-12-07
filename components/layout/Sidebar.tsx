"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Book,
  Factory,
  ShoppingCart,
  Users,
  X,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";

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
  email?: string;
};

interface SidebarProps {
  profile: Partial<Profile>;
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  items?: {
    title: string;
    href: string;
  }[];
  badge?: string;
}

export function Sidebar({
  profile,
  isOpen,
  onClose,
  isMinimized = false,
  onToggleMinimize,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-expand menu based on current pathname
  useEffect(() => {
    const pathSegments = pathname?.split("/") || [];
    const currentModule = pathSegments[2]; // /dashboard/module/...

    if (currentModule) {
      const menuMap: Record<string, string> = {
        inventory: "Inventory",
        Inventory: "Inventory", // Handle both cases
        production: "Production",
        orders: "Orders",
        users: "User Manager",
        ledger: "Ledger",
      };

      const menuToExpand = menuMap[currentModule];
      if (menuToExpand) {
        setExpandedMenus((prev) =>
          prev.includes(menuToExpand) ? prev : [...prev, menuToExpand]
        );
      }
    }
  }, [pathname]);

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuTitle)
        ? prev.filter((m) => m !== menuTitle)
        : [...prev, menuTitle]
    );
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      title: "Ledger",
      icon: <Book className="h-5 w-5" />,
      href: "/dashboard/ledgers",
    },
  ];

  // Role-based menu items
  const userRole = profile.user_role;

  // Admin has access to everything
  if (userRole === "Admin") {
    menuItems.push(
      {
        title: "Production",
        icon: <Factory className="h-5 w-5" />,
        items: [
          { title: "Dashboard", href: "/dashboard/production" },
          { title: "Purchases", href: "/dashboard/production/purchases" },
          {
            title: "Weaver Challan",
            href: "/dashboard/production/weaver-challan",
          },
          {
            title: "Shorting Entry",
            href: "/dashboard/production/shorting-entry",
          },
          {
            title: "Stitching Challan",
            href: "/dashboard/production/stitching-challan",
          },
          { title: "Expense", href: "/dashboard/production/expense" },
          {
            title: "Payment Voucher",
            href: "/dashboard/production/payment-voucher",
          },
        ],
      },
      {
        title: "Inventory",
        icon: <Package className="h-5 w-5" />,
        items: [
          { title: "Overview", href: "/dashboard/Inventory" },
          { title: "Products", href: "/dashboard/Inventory/products" },
          {
            title: "Unified Inventory",
            href: "/dashboard/Inventory/unifiedInventory",
          },
        ],
      },
      {
        title: "Orders",
        icon: <ShoppingCart className="h-5 w-5" />,
        items: [
          { title: "All Orders", href: "/dashboard/orders/all" },
          { title: "Flipkart Orders", href: "/dashboard/orders/flipkart" },
          { title: "Meesho Orders", href: "/dashboard/orders/meesho" },
          { title: "Order Analytics", href: "/dashboard/orders/analytics" },
        ],
      },
      {
        title: "User Manager",
        icon: <Users className="h-5 w-5" />,
        href: "/dashboard/users",
      }
    );
  }

  // Inventory Manager (Imanager) - access to inventory and orders (read-only ledgers)
  if (userRole === "Inventory Manager") {
    menuItems.push(
      {
        title: "Inventory",
        icon: <Package className="h-5 w-5" />,
        items: [
          { title: "Overview", href: "/dashboard/Inventory" },
          { title: "Products", href: "/dashboard/Inventory/products" },
          {
            title: "Unified Inventory",
            href: "/dashboard/Inventory/unifiedInventory",
          },
        ],
      },
      {
        title: "Orders",
        icon: <ShoppingCart className="h-5 w-5" />,
        items: [
          { title: "All Orders", href: "/dashboard/orders/all" },
          { title: "Flipkart Orders", href: "/dashboard/orders/flipkart" },
          { title: "Meesho Orders", href: "/dashboard/orders/meesho" },
          { title: "Order Analytics", href: "/dashboard/orders/analytics" },
        ],
      }
    );
  }

  // Production Manager (Pmanager) - access to production, inventory and ledgers
  if (userRole === "Production Manager") {
    menuItems.push(
      {
        title: "Production",
        icon: <Factory className="h-5 w-5" />,
        items: [
          { title: "Dashboard", href: "/dashboard/production" },
          { title: "Purchases", href: "/dashboard/production/purchases" },
          {
            title: "Weaver Challan",
            href: "/dashboard/production/weaver-challan",
          },
          {
            title: "Shorting Entry",
            href: "/dashboard/production/shorting-entry",
          },
          {
            title: "Stitching Challan",
            href: "/dashboard/production/stitching-challan",
          },
          { title: "Expense", href: "/dashboard/production/expense" },
          {
            title: "Payment Voucher",
            href: "/dashboard/production/payment-voucher",
          },
        ],
      },
      {
        title: "Inventory",
        icon: <Package className="h-5 w-5" />,
        items: [
          { title: "Overview", href: "/dashboard/Inventory" },
          { title: "Products", href: "/dashboard/Inventory/products" },
          {
            title: "Unified Inventory",
            href: "/dashboard/Inventory/unifiedInventory",
          },
        ],
      }
    );
  }

  // Order Managing Executive - access to orders only (read-only ledgers)
  if (userRole === "Order Managing Executive") {
    menuItems.push({
      title: "Orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      items: [
        { title: "All Orders", href: "/dashboard/orders/all" },
        { title: "Flipkart Orders", href: "/dashboard/orders/flipkart" },
        { title: "Meesho Orders", href: "/dashboard/orders/meesho" },
        { title: "Order Analytics", href: "/dashboard/orders/analytics" },
      ],
    });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static h-full inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMinimized ? "lg:w-24 w-64" : "w-64"
        )}
      >
        <div className="h-full bg-white border-r border-gray-200 shadow-sm">
          {/* Header with Company Logo */}
          <div className="flex items-center justify-between h-16 px-4 ">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              {!isMinimized && (
                <span className="text-lg font-semibold text-gray-800">
                  Bhaktinandan
                </span>
              )}
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={onToggleMinimize}
                className="hidden lg:flex text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1 transition-colors duration-200"
                title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isMinimized ? "-rotate-90" : "rotate-90"
                  )}
                />
              </button>
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              "flex-1 overflow-y-auto h-[calc(100vh-4rem)] transition-all duration-200",
              isMinimized ? "px-2 py-6" : "px-4 py-6 space-y-2"
            )}
          >
            {menuItems.map((item) => (
              <div key={item.title}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center text-sm font-medium rounded-lg transition-all duration-200",
                      isMinimized ? "px-2 py-3 justify-center" : "px-4 py-3",
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600 border-l-2 border-blue-500"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={isMinimized ? item.title : undefined}
                  >
                    <div
                      className={cn(
                        "transition-colors duration-200 text-gray-500",
                        pathname === item.href
                          ? "text-blue-500"
                          : "group-hover:text-gray-700"
                      )}
                    >
                      {item.icon}
                    </div>
                    {!isMinimized && (
                      <span className="ml-3 text-gray-700">{item.title}</span>
                    )}
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => !isMinimized && toggleMenu(item.title)}
                      className={cn(
                        "group flex items-center text-sm font-medium rounded-lg transition-all duration-200",
                        isMinimized
                          ? "px-2 py-3 justify-center w-full"
                          : "justify-between w-full px-4 py-3",
                        expandedMenus.includes(item.title) && !isMinimized
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      title={isMinimized ? item.title : undefined}
                    >
                      <div
                        className={cn(
                          "flex items-center",
                          isMinimized && "justify-center"
                        )}
                      >
                        <div
                          className={cn(
                            "transition-colors duration-200",
                            expandedMenus.includes(item.title) && !isMinimized
                              ? "text-blue-600"
                              : "text-gray-500 group-hover:text-gray-700"
                          )}
                        >
                          {item.icon}
                        </div>
                        {!isMinimized && (
                          <span className="ml-3">{item.title}</span>
                        )}
                      </div>
                      {!isMinimized && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-all duration-200 text-gray-400 group-hover:text-gray-600",
                            expandedMenus.includes(item.title) && "rotate-180"
                          )}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {!isMinimized &&
                      expandedMenus.includes(item.title) &&
                      item.items && (
                        <div className="mt-2 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                "group flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-200",
                                pathname === subItem.href
                                  ? "bg-blue-50 text-blue-600 border-l-2 border-blue-500"
                                  : "text-gray-600 hover:bg-gray-100"
                              )}
                            >
                              <span className="ml-3">{subItem.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer with user info */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white",
              isMinimized ? "p-2" : "p-4"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                isMinimized ? "justify-center" : "space-x-3"
              )}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                {profile.full_name?.charAt(0) ||
                  profile.email?.charAt(0) ||
                  "U"}
              </div>
              {!isMinimized && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {profile.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile.user_role || "Role"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
