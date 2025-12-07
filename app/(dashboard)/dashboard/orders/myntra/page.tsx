"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import OrdersTable from "@/components/orders/OrdersTable";

interface MyntraOrder {
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
  carrier?: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface MyntraApiResponse {
  success: boolean;
  orders: MyntraOrder[];
  summary: {
    fetched: number;
    created: number;
    updated: number;
  };
  error?: string;
}

export default function MyntraOrdersPage() {
  const [orders, setOrders] = useState<MyntraOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // const authManager = getAuthManager();

  const fetchMyntraOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get orders from API
      const response = await fetch("/api/orders/myntra");
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to fetch Myntra orders");
      } else {
        setOrders(result.data || []);
      }
    } catch (err) {
      setError("Failed to fetch Myntra orders");
      console.error("Error fetching Myntra orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncMyntraOrders = async () => {
    try {
      setSyncing(true);
      setError(null);

      // Call the API endpoint
      const response = await fetch("/api/orders/myntra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "sync" }),
      });

      const data: MyntraApiResponse = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sync Myntra orders");
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.success && data.orders) {
        setOrders(data.orders);
        setLastSyncTime(new Date());

        // Show success message
        const message = `Sync completed: ${data.summary.fetched} orders fetched, ${data.summary.created} created, ${data.summary.updated} updated`;
        console.log(message);
      } else {
        setError("Unexpected response from Myntra API");
      }
    } catch (err) {
      setError("Failed to sync Myntra orders");
      console.error("Error syncing Myntra orders:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchMyntraOrders();
  }, []);

  const handleRefresh = () => {
    fetchMyntraOrders();
  };

  // if (!authManager.canViewPaginatedData()) {
  //   return (
  //     <div className="bg-red-50 border border-red-200 rounded-md p-4">
  //       <div className="text-red-800">
  //         You do not have permission to view Myntra orders.
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Myntra Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            {orders.length} orders
            {lastSyncTime && ` • Last synced: ${lastSyncTime.toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* <button
            onClick={syncMyntraOrders}
            disabled={syncing}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
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
        <div className="bg-pink-50 border border-pink-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 mr-2"></div>
            <span className="text-pink-800">
              Syncing orders from Myntra Seller Portal...
            </span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        title="Myntra Orders"
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
                Connected to Seller Portal API
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
              Fashion apparel, accessories
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Data Fields
            </h4>
            <span className="text-sm text-gray-600">
              Customer details, items, returns
            </span>
          </div>
        </div>
      </div>

      {/* Myntra Specific Features */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Myntra Features
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-pink-400"
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
                Fashion Focus
              </h4>
              <p className="text-sm text-gray-600">
                Specialized in fashion and lifestyle products
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-pink-400"
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
                Return Management
              </h4>
              <p className="text-sm text-gray-600">
                Comprehensive return and exchange tracking
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-pink-400"
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
                Brand Storefront
              </h4>
              <p className="text-sm text-gray-600">
                Dedicated brand storefront management
              </p>
            </div>
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
              Myntra Seller Portal API
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Ensure your Myntra Seller Portal API credentials are configured
                in the platform credentials table.
              </p>
              <p className="mt-1">
                Required: API Key, API Secret, Seller ID, Store ID
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
