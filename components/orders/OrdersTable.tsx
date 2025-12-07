"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Download, Package } from "lucide-react";

interface Order {
  id: string;
  platform: string;
  platform_order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  payment_method?: string;
  order_date: string;
  tracking_number?: string;
  order_items?: any;
}

interface OrdersTableProps {
  title: string;
  data: Order[];
  platform?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export default function OrdersTable({
  title,
  data,
  platform,
  loading = false,
  error,
  onRefresh,
}: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter orders based on search and status
  const filteredOrders = data.filter((order) => {
    const matchesSearch =
      !filter ||
      order.customer_name.toLowerCase().includes(filter.toLowerCase()) ||
      order.platform_order_id.toLowerCase().includes(filter.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(filter.toLowerCase()) ||
      order.customer_phone?.includes(filter);

    const matchesStatus =
      statusFilter === "all" || order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle order selection
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Platform",
      "Order ID",
      "Customer Name",
      "Email",
      "Phone",
      "Amount",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Order Date",
      "Tracking Number",
    ];

    const rows = filteredOrders.map((order) => [
      order.platform,
      order.platform_order_id,
      order.customer_name,
      order.customer_email || "",
      order.customer_phone || "",
      order.total_amount.toFixed(2),
      order.order_status,
      order.payment_status,
      order.payment_method || "",
      new Date(order.order_date).toLocaleDateString(),
      order.tracking_number || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Export to Excel (JSON format - can be opened in Excel)
  const handleExportExcel = () => {
    const exportData = filteredOrders.map((order) => ({
      Platform: order.platform,
      "Order ID": order.platform_order_id,
      "Customer Name": order.customer_name,
      Email: order.customer_email || "",
      Phone: order.customer_phone || "",
      Amount: order.total_amount,
      "Order Status": order.order_status,
      "Payment Status": order.payment_status,
      "Payment Method": order.payment_method || "",
      "Order Date": new Date(order.order_date).toLocaleDateString(),
      "Tracking Number": order.tracking_number || "",
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(data.map((order) => order.order_status))];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      delivered: "bg-green-100 text-green-700",
      shipped: "bg-blue-100 text-blue-700",
      processing: "bg-yellow-100 text-yellow-700",
      pending: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
      confirmed: "bg-blue-100 text-blue-700",
      packed: "bg-purple-100 text-purple-700",
      out_for_delivery: "bg-cyan-100 text-cyan-700",
      returned: "bg-orange-100 text-orange-700",
    };
    return (
      <Badge
        className={variants[status] || "bg-gray-100 text-gray-700"}
        variant="secondary"
      >
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
      processing: "bg-blue-100 text-blue-700",
    };
    return (
      <Badge
        className={variants[status] || "bg-gray-100 text-gray-700"}
        variant="secondary"
      >
        {status}
      </Badge>
    );
  };

  const getPlatformBadge = (plat: string) => {
    const variants: Record<string, string> = {
      flipkart: "bg-blue-100 text-blue-700",
      amazon: "bg-orange-100 text-orange-700",
      myntra: "bg-pink-100 text-pink-700",
      meesho: "bg-purple-100 text-purple-700",
    };
    return (
      <Badge
        className={variants[plat] || "bg-gray-100 text-gray-700"}
        variant="secondary"
      >
        {plat.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading orders...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">Error: {error}</div>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                className="mt-2"
                variant="destructive"
              >
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                Refresh
              </Button>
            )}
            <>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by customer name, order ID, email, or phone..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={
                      selectedOrders.length === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tracking
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => handleOrderSelect(order.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {getPlatformBadge(order.platform)}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {order.platform_order_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                    {order.customer_email && (
                      <div className="text-xs text-gray-500">
                        {order.customer_email}
                      </div>
                    )}
                    {order.customer_phone && (
                      <div className="text-xs text-gray-500">
                        {order.customer_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    ₹{order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.order_status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPaymentBadge(order.payment_status)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                      {new Date(order.order_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {order.tracking_number || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        {selectedOrders.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-sm text-blue-700">
              {selectedOrders.length} order(s) selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
