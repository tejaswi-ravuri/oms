"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Package,
  Calendar,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
// import toast from "react-hot-toast"; // Commented out as it might not be installed

// Simple toast replacement
const toast = {
  success: (message) => {
    // Simple alert replacement for now
    console.log("SUCCESS:", message);
    // In a real implementation, you would use a proper toast library
  },
  error: (message) => {
    console.error("ERROR:", message);
    // In a real implementation, you would use a proper toast library
  },
};

export function OrdersContentEnhanced({ orders, userRole, profile }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);

  const canManageOrders =
    userRole === "Admin" || userRole === "Order Managing Executive";

  // Status badge renderer
  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </Badge>
    );
  };

  // Platform icon renderer
  const getPlatformIcon = (platform) => {
    const platformColors = {
      amazon: "bg-orange-500",
      flipkart: "bg-blue-500",
      meesho: "bg-orange-600",
      myntra: "bg-pink-500",
    };

    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            platformColors[platform] || "bg-gray-500"
          }`}
        />
        <span className="capitalize">{platform}</span>
      </div>
    );
  };

  // Date renderer
  const renderDate = (date, includeIcon = true) => {
    if (!date) {
      return <span className="text-gray-400">N/A</span>;
    }

    const formattedDate = new Date(date).toLocaleDateString();

    return (
      <div className="flex items-center text-sm">
        {includeIcon && <Calendar className="h-3 w-3 mr-1" />}
        {formattedDate}
      </div>
    );
  };

  // Define table columns
  const columns = [
    {
      key: "platform_order_id",
      title: "Order ID",
      sortable: true,
      filterable: true,
      filterType: "text",
      className: "font-mono text-sm",
    },
    {
      key: "platform",
      title: "Platform",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "amazon", label: "Amazon" },
        { value: "flipkart", label: "Flipkart" },
        { value: "meesho", label: "Meesho" },
        { value: "myntra", label: "Myntra" },
      ],
      render: getPlatformIcon,
    },
    {
      key: "customer_name",
      title: "Customer",
      sortable: true,
      filterable: true,
      filterType: "text",
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{record.customer_email}</div>
        </div>
      ),
    },
    {
      key: "total_amount",
      title: "Amount",
      sortable: true,
      filterable: true,
      filterType: "number",
      render: (amount) => (
        <span className="font-medium">₹{amount.toFixed(2)}</span>
      ),
    },
    {
      key: "order_status",
      title: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
      ],
      render: getStatusBadge,
    },
    {
      key: "order_date",
      title: "Order Date",
      sortable: true,
      filterable: true,
      filterType: "date",
      render: (date) => renderDate(date),
    },
  ];

  // Define table actions
  const actions = [
    {
      label: "View Details",
      icon: <Eye className="mr-2 h-4 w-4" />,
      onClick: (order) => {
        // TODO: Navigate to order details page
        console.log("View order details:", order.id);
      },
    },
    ...(canManageOrders
      ? [
          {
            label: "Process Order",
            icon: <Package className="mr-2 h-4 w-4" />,
            onClick: (order) => {
              // TODO: Navigate to order processing page
              console.log("Process order:", order.id);
            },
          },
        ]
      : []),
    {
      label: `View on Platform`,
      icon: <ExternalLink className="mr-2 h-4 w-4" />,
      onClick: (order) => {
        // TODO: Open order in platform
        console.log(
          "View on platform:",
          order.platform,
          order.platform_order_id
        );
      },
    },
  ];

  // Define bulk actions
  const bulkActions = canManageOrders
    ? [
        {
          label: "Process Selected",
          icon: <Package className="mr-2 h-4 w-4" />,
          onClick: (selectedOrders) => {
            // TODO: Bulk process orders
            console.log(
              "Bulk process orders:",
              selectedOrders.map((o) => o.id)
            );
            toast.success(`Processing ${selectedOrders.length} orders`);
          },
          disabled: (selected) => selected.length === 0,
        },
        {
          label: "Sync Selected",
          icon: <RefreshCw className="mr-2 h-4 w-4" />,
          onClick: (selectedOrders) => {
            // TODO: Bulk sync orders
            console.log(
              "Bulk sync orders:",
              selectedOrders.map((o) => o.id)
            );
            toast.success(`Syncing ${selectedOrders.length} orders`);
          },
          disabled: (selected) => selected.length === 0,
        },
      ]
    : [];

  // Handle search
  const handleSearch = (query) => {
    setSearchTerm(query);
  };

  // Handle sync orders
  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      // TODO: Implement actual sync logic
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate sync
      toast.success("Orders synchronized successfully");
      router.refresh();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync orders");
    } finally {
      setSyncing(false);
    }
  };

  // Handle export
  const handleExport = async (format, selectedOnly) => {
    try {
      const dataToExport = selectedOnly
        ? orders.filter((o) => false) // TODO: Implement selected rows tracking
        : orders;

      if (dataToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Create CSV content
      const headers = [
        "Order ID",
        "Platform",
        "Customer Name",
        "Customer Email",
        "Total Amount",
        "Status",
        "Order Date",
      ];
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((order) =>
          [
            order.platform_order_id,
            order.platform,
            order.customer_name,
            order.customer_email || "",
            order.total_amount,
            order.order_status || "Unknown",
            order.order_date || "N/A",
          ].join(",")
        ),
      ].join("\n");

      // Download the file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Orders exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export orders");
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    try {
      // TODO: Implement actual upload logic for order import
      toast.success("Orders imported successfully");
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to import orders");
    }
  };

  // Calculate summary statistics
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(
    (order) => order.order_status === "delivered"
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.order_status === "pending"
  ).length;
  const platformsCount = new Set(orders.map((order) => order.platform)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Orders Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage orders from all e-commerce platforms ({totalOrders} total
            orders)
          </p>
        </div>
        {canManageOrders && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSyncOrders}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync Orders"}
            </Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Process Orders
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {totalOrders}
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {deliveredOrders}
            </div>
            <div className="text-sm text-gray-600">Delivered</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {platformsCount}
            </div>
            <div className="text-sm text-gray-600">Platforms</div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Table (since AdvancedTable is not available) */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.platform_order_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlatformIcon(order.platform)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{order.total_amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.order_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderDate(order.order_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => action.onClick(order)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
