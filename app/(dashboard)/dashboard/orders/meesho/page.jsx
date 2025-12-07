"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import OrdersTable from "@/components/orders/OrdersTable";

export default function MeeshoOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // const authManager = getAuthManager();

  const fetchMeeshoOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get orders from API
      const response = await fetch("/api/orders/meesho");
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to fetch Meesho orders");
      } else {
        setOrders(result.data || []);
      }
    } catch (err) {
      setError("Failed to fetch Meesho orders");
      console.error("Error fetching Meesho orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncMeeshoOrders = async () => {
    try {
      setSyncing(true);
      setError(null);

      // Call the API endpoint
      const response = await fetch("/api/orders/meesho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "sync" }),
      });

      const data = await response.json();

      console.log("mesesho data----", data);

      if (!response.ok) {
        setError(data.error || "Failed to sync Meesho orders");
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.success && data.orders) {
        setOrders(data.orders);
        setLastSyncTime(new Date());

        // Show success message
        const message = `Sync completed: ${data.summary.fetched} orders fetched, ${data.summary.created} created, ${data.summary.updated} updated`;
        console.log(message);
      } else {
        setError("Unexpected response from Meesho API");
      }
    } catch (err) {
      setError("Failed to sync Meesho orders");
      console.error("Error syncing Meesho orders:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchMeeshoOrders();
  }, []);

  const handleRefresh = () => {
    fetchMeeshoOrders();
  };

  // if (!authManager.canViewPaginatedData()) {
  //   return (
  //     <div className="bg-red-50 border border-red-200 rounded-md p-4">
  //       <div className="text-red-800">
  //         You do not have permission to view Meesho orders.
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meesho Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            {orders.length} orders
            {lastSyncTime && ` • Last synced: ${lastSyncTime.toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* <button
            onClick={syncMeeshoOrders}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
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
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
            <span className="text-purple-800">
              Syncing orders from Meesho Supplier API...
            </span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        title="Meesho Orders"
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
              <span className="text-sm text-gray-600">
                Connected to Supplier API
              </span>
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
            <span className="text-sm text-gray-600">
              Reseller orders, direct orders
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Data Fields
            </h4>
            <span className="text-sm text-gray-600">
              Customer details, items, logistics
            </span>
          </div>
        </div>
      </div>

      {/* Meesho Specific Features */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Meesho Features
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Reseller Network
              </h4>
              <p className="text-sm text-gray-600">
                Access to Meesho's vast reseller network
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Logistics Integration
              </h4>
              <p className="text-sm text-gray-600">
                Built-in logistics and tracking support
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Payment Options
              </h4>
              <p className="text-sm text-gray-600">
                Support for COD, UPI, and online payments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Meesho Supplier API
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Ensure your Meesho Supplier API credentials are configured in
                the platform credentials table.
              </p>
              <p className="mt-1">Required: API Key, API Secret, Seller ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
