"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
} from "lucide-react";

export default function OrderAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetchOrders();
  }, [dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching orders for analytics:", result.error);
      } else {
        setOrders(result.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockOrders = [
    {
      id: 1,
      platform: "Myntra",
      quantity: 2,
      order_status: "Delivered",
      created_at: "2024-01-15",
    },
    {
      id: 2,
      platform: "Flipkart",
      quantity: 1,
      order_status: "Shipped",
      created_at: "2024-01-14",
    },
    {
      id: 3,
      platform: "Meesho",
      quantity: 3,
      order_status: "Pending",
      created_at: "2024-01-13",
    },
    {
      id: 4,
      platform: "Myntra",
      quantity: 1,
      order_status: "Delivered",
      created_at: "2024-01-12",
    },
    {
      id: 5,
      platform: "Flipkart",
      quantity: 2,
      order_status: "Processing",
      created_at: "2024-01-11",
    },
    {
      id: 6,
      platform: "Meesho",
      quantity: 1,
      order_status: "Delivered",
      created_at: "2024-01-10",
    },
  ];

  const displayOrders = orders.length > 0 ? orders : mockOrders;

  // Calculate analytics data
  const totalOrders = displayOrders.length;
  const totalQuantity = displayOrders.reduce(
    (sum, order) => sum + order.quantity,
    0
  );
  const deliveredOrders = displayOrders.filter(
    (o) => o.order_status === "Delivered"
  ).length;
  const pendingOrders = displayOrders.filter(
    (o) => o.order_status === "Pending"
  ).length;

  // Platform-wise data
  const platformData = [
    {
      name: "Myntra",
      value: displayOrders.filter((o) => o.platform === "Myntra").length,
      color: "#FF6B6B",
    },
    {
      name: "Flipkart",
      value: displayOrders.filter((o) => o.platform === "Flipkart").length,
      color: "#4ECDC4",
    },
    {
      name: "Meesho",
      value: displayOrders.filter((o) => o.platform === "Meesho").length,
      color: "#45B7D1",
    },
    {
      name: "Ajio",
      value: displayOrders.filter((o) => o.platform === "Ajio").length,
      color: "#96CEB4",
    },
  ].filter((item) => item.value > 0);

  // Status-wise data
  const statusData = [
    {
      name: "Pending",
      value: displayOrders.filter((o) => o.order_status === "Pending").length,
      color: "#FFA500",
    },
    {
      name: "Processing",
      value: displayOrders.filter((o) => o.order_status === "Processing")
        .length,
      color: "#1E90FF",
    },
    {
      name: "Shipped",
      value: displayOrders.filter((o) => o.order_status === "Shipped").length,
      color: "#32CD32",
    },
    {
      name: "Delivered",
      value: displayOrders.filter((o) => o.order_status === "Delivered").length,
      color: "#228B22",
    },
    {
      name: "Cancelled",
      value: displayOrders.filter((o) => o.order_status === "Cancelled").length,
      color: "#DC143C",
    },
  ].filter((item) => item.value > 0);

  // Monthly trend data (mock)
  const monthlyTrendData = [
    { month: "Jan", orders: 45, delivered: 38 },
    { month: "Feb", orders: 52, delivered: 45 },
    { month: "Mar", orders: 48, delivered: 42 },
    { month: "Apr", orders: 61, delivered: 55 },
    { month: "May", orders: 55, delivered: 48 },
    { month: "Jun", orders: 67, delivered: 60 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order Analytics
            </h1>
            <p className="text-gray-600 mt-1">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your order performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quantity
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +8% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">
              {totalOrders > 0
                ? Math.round((deliveredOrders / totalOrders) * 100)
                : 0}
              % delivery rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Platform</CardTitle>
            <CardDescription>
              Distribution of orders across different platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>
              Current status distribution of all orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Order Trend</CardTitle>
          <CardDescription>
            Order volume and delivery performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#8884d8"
                strokeWidth={2}
                name="Total Orders"
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#82ca9d"
                strokeWidth={2}
                name="Delivered Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Platform Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics by platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformData.map((platform) => {
              const platformOrders = displayOrders.filter(
                (o) => o.platform === platform.name
              );
              const deliveredCount = platformOrders.filter(
                (o) => o.order_status === "Delivered"
              ).length;
              const deliveryRate =
                platformOrders.length > 0
                  ? Math.round((deliveredCount / platformOrders.length) * 100)
                  : 0;

              return (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <div>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-gray-500">
                        {platformOrders.length} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{deliveryRate}%</div>
                    <p className="text-sm text-gray-500">delivery rate</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
