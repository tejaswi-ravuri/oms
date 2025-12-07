"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import OrdersTable from "@/components/orders/OrdersTable";

export default function AmazonOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // const authManager = getAuthManager();

  const fetchAmazonOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get orders from API
      const response = await fetch("/api/orders/amazon");
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to fetch Amazon orders");
      } else {
        setOrders(result.data || []);
      }
    } catch (err) {
      setError("Failed to fetch Amazon orders");
      console.error("Error fetching Amazon orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncAmazonOrders = async () => {
    try {
      setSyncing(true);
      setError(null);

      // Call the API endpoint
      const response = await fetch("/api/orders/amazon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "sync" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sync Amazon orders");
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.success && data.orders) {
        setOrders(data.orders);
        setLastSyncTime(new Date());

        // Show success message
        const message = `Sync completed: ${data.summary.fetched} orders fetched, ${data.summary.created} created, ${data.summary.updated} updated`;
        console.log(message);
      } else {
        setError("Unexpected response from Amazon API");
      }
    } catch (err) {
      setError("Failed to sync Amazon orders");
      console.error("Error syncing Amazon orders:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAmazonOrders();
  }, []);

  const handleRefresh = () => {
    fetchAmazonOrders();
  };

  //   if (!authManager.canViewPaginatedData()) {
  //     return (
  //       <div className="bg-red-50 border border-red-200 rounded-md p-4">
  //         <div className="text-red-800">
  //           You do not have permission to view Amazon orders.
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amazon Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            {orders.length} orders
            {lastSyncTime && ` • Last synced: ${lastSyncTime.toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={syncAmazonOrders}
            disabled={syncing}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
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
          </button>
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
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
            <span className="text-orange-800">
              Syncing orders from Amazon SP-API...
            </span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        title="Amazon Orders"
        data={orders}
        platform="amazon"
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
              <span className="text-sm text-gray-600">Connected to SP-API</span>
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
              Marketplace
            </h4>
            <span className="text-sm text-gray-600">Amazon.in (India)</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Data Fields
            </h4>
            <span className="text-sm text-gray-600">
              Full order details, buyer info, items
            </span>
          </div>
        </div>
      </div>

      {/* API Configuration Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Amazon SP-API Configuration
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Make sure your Amazon SP-API credentials are properly configured
                in the platform credentials table.
              </p>
              <p className="mt-1">
                Required: Client ID, Client Secret, Refresh Token, Marketplace
                ID
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
