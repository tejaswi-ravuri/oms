"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import OrdersTable from "@/components/orders/OrdersTable";

interface FlipkartOrder {
  id: string;
  platform: string;
  platform_order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  order_date: string;
  tracking_number?: string;
  carrier?: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface FlipkartApiResponse {
  success: boolean;
  orders: FlipkartOrder[];
  summary: {
    fetched: number;
    created: number;
    updated: number;
  };
  error?: string;
}

export default function FlipkartOrdersPage() {
  const [orders, setOrders] = useState<FlipkartOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // const authManager = getAuthManager();

  const fetchFlipkartOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get orders from API
      const response = await fetch("/api/orders/flipkart");
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to fetch Flipkart orders");
      } else {
        setOrders(result.data || []);
      }
    } catch (err) {
      setError("Failed to fetch Flipkart orders");
      console.error("Error fetching Flipkart orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncFlipkartOrders = async () => {
    try {
      setSyncing(true);
      setError(null);

      // Call the API endpoint
      const response = await fetch("/api/orders/flipkart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "sync" }),
      });

      const data: FlipkartApiResponse = await response.json();
      console.log("data flipkart----", data);

      if (!response.ok) {
        setError(data.error || "Failed to sync Flipkart orders");
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.success && data.orders) {
        setOrders(data.orders);
        setLoading(false);
        setLastSyncTime(new Date());

        // Show success message
        const message = `Sync completed: ${data.summary.fetched} orders fetched, ${data.summary.created} created, ${data.summary.updated} updated`;
        console.log(message);
      } else {
        setError("Unexpected response from Flipkart API");
      }
    } catch (err) {
      setError("Failed to sync Flipkart orders");
      console.error("Error syncing Flipkart orders:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchFlipkartOrders();
  }, []);

  const handleRefresh = () => {
    fetchFlipkartOrders();
  };

  // if (!authManager.canViewPaginatedData()) {
  //   return (
  //     <div className="bg-red-50 border border-red-200 rounded-md p-4">
  //       <div className="text-red-800">
  //         You do not have permission to view Flipkart orders.
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flipkart Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            {orders.length} orders
            {lastSyncTime && ` • Last synced: ${lastSyncTime.toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* <button
            onClick={syncFlipkartOrders}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Sync Orders</span>
              </>
            )}
          </button> */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Sync Status */}
      {syncing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">
              Syncing orders from Flipkart...
            </span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        title="Flipkart Orders"
        data={orders}
        loading={loading}
        error={error || undefined}
        onRefresh={handleRefresh}
      />

      {/* Platform Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Platform Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              API Status
            </h4>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Connected</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Sync Frequency
            </h4>
            <span className="text-sm text-gray-600">Manual sync only</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Order Types
            </h4>
            <span className="text-sm text-gray-600">All order statuses</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Data Fields
            </h4>
            <span className="text-sm text-gray-600">
              Customer info, items, tracking
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
