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
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  FileText,
  DollarSign,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
// import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export function DashboardWidgets({ userRole, className = "" }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalPartners: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [chartData, setChartData] = useState({
    monthly: [],
    platformDistribution: [],
    orderStatus: [],
    weeklyTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard statistics
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [
        ordersResult,
        productsResult,
        ledgersResult,
        todayOrdersResult,
        todayExpensesResult,
        recentOrdersResult,
      ] = await Promise.all([
        supabase
          .from("purchase_orders")
          .select("id, total_amount, status, created_at", { count: "exact" })
          .gte("created_at", thirtyDaysAgo),
        supabase
          .from("products")
          .select("id", { count: "exact" })
          .eq("product_status", "Active"),
        supabase.from("ledgers").select("id", { count: "exact" }),
        supabase
          .from("purchase_orders")
          .select("id, total_amount", { count: "exact" })
          .gte("created_at", today),
        supabase
          .from("expenses")
          .select("id, cost", { count: "exact" })
          .gte("created_at", today),
        supabase
          .from("purchase_orders")
          .select("total_amount, status, created_at")
          .gte("created_at", thirtyDaysAgo),
      ]);

      // Calculate statistics
      const orders = recentOrdersResult.data || [];
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const todayRevenue = (todayOrdersResult.data || []).reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const todayExpenses = (todayExpensesResult.data || []).reduce(
        (sum, expense) => sum + (expense.cost || 0),
        0
      );
      const pendingOrders = orders.filter(
        (order) => order.status === "pending"
      ).length;
      const completedOrders = orders.filter(
        (order) => order.status === "completed"
      ).length;

      setStats({
        totalOrders: ordersResult.count || 0,
        totalRevenue,
        totalProducts: productsResult.count || 0,
        totalPartners: ledgersResult.count || 0,
        todayOrders: todayOrdersResult.count || 0,
        todayRevenue,
        todayExpenses,
        pendingOrders,
        completedOrders,
      });

      // Generate mock chart data (replace with real data later)
      setChartData({
        monthly: [
          { month: "Jan", orders: 45, revenue: 125000, expenses: 85000 },
          { month: "Feb", orders: 52, revenue: 145000, expenses: 92000 },
          { month: "Mar", orders: 48, revenue: 132000, expenses: 88000 },
          { month: "Apr", orders: 61, revenue: 168000, expenses: 105000 },
          { month: "May", orders: 55, revenue: 152000, expenses: 98000 },
          { month: "Jun", orders: 67, revenue: 185000, expenses: 118000 },
        ],
        platformDistribution: [
          { name: "Myntra", value: 35, color: "#FF6B6B" },
          { name: "Flipkart", value: 30, color: "#4ECDC4" },
          { name: "Meesho", value: 25, color: "#45B7D1" },
          { name: "Ajio", value: 10, color: "#96CEB4" },
        ],
        orderStatus: [
          { name: "Pending", value: pendingOrders, color: "#FFA500" },
          { name: "Processing", value: 15, color: "#1E90FF" },
          { name: "Completed", value: completedOrders, color: "#32CD32" },
          { name: "Cancelled", value: 5, color: "#DC143C" },
        ],
        weeklyTrend: [
          { day: "Mon", orders: 12, revenue: 35000 },
          { day: "Tue", orders: 15, revenue: 42000 },
          { day: "Wed", orders: 18, revenue: 51000 },
          { day: "Thu", orders: 14, revenue: 38000 },
          { day: "Fri", orders: 22, revenue: 62000 },
          { day: "Sat", orders: 25, revenue: 71000 },
          { day: "Sun", orders: 20, revenue: 58000 },
        ],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    valuePrefix = "",
    color = "default",
  }) => {
    const colorClasses = {
      default:
        "border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-gray-50",
      green: "border-green-200 bg-green-50/50",
      red: "border-red-200 bg-red-50/50",
      blue: "border-blue-200 bg-blue-50/50",
    };

    const textColors = {
      default: "",
      green: "text-green-700",
      red: "text-red-700",
      blue: "text-blue-700",
    };

    return (
      <Card
        className={`relative overflow-hidden transition-all duration-300 ${colorClasses[color]}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${
              textColors[color] || "text-muted-foreground"
            }`}
          >
            {title}
          </CardTitle>
          {Icon && (
            <Icon
              className={`h-4 w-4 ${
                textColors[color] || "text-muted-foreground"
              }`}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${textColors[color]}`}>
              {valuePrefix}
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            <p
              className={`text-xs ${
                textColors[color] || "text-muted-foreground"
              }`}
            >
              {description}
            </p>
            {trend && (
              <div
                className={`flex items-center text-xs ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {trend.value}% from last period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
    <div className={`space-y-6 ${className}`}>
      {/* Key Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          description="Orders placed today"
          icon={FileText}
          trend={
            stats.todayOrders > 0 ? { value: 12, isPositive: true } : undefined
          }
        />
        <StatCard
          title="Today's Revenue"
          value={stats.todayRevenue}
          description="Revenue generated today"
          icon={DollarSign}
          trend={
            stats.todayRevenue > 0 ? { value: 8, isPositive: true } : undefined
          }
          valuePrefix="₹"
          color="green"
        />
        <StatCard
          title="Active Products"
          value={stats.totalProducts}
          description="Products in inventory"
          icon={Package}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Business Partners"
          value={stats.totalPartners}
          description="Active ledgers"
          icon={Users}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          description="All time revenue"
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
          valuePrefix="₹"
          color="green"
        />
        <StatCard
          title="Today's Expenses"
          value={stats.todayExpenses}
          description="Expenses today"
          icon={Activity}
          trend={{ value: 5, isPositive: false }}
          valuePrefix="₹"
          color="red"
        />
        <StatCard
          title="Net Profit Today"
          value={stats.todayRevenue - stats.todayExpenses}
          description="Profit after expenses"
          icon={TrendingUp}
          trend={{ value: 18, isPositive: true }}
          valuePrefix="₹"
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Orders Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue & Orders Trend</CardTitle>
                <CardDescription>Monthly performance overview</CardDescription>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString()}`,
                    "",
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Orders by e-commerce platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.platformDistribution}
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
                  {chartData.platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend and Order Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
            <CardDescription>
              Daily orders and revenue this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Orders"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.orderStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {chartData.orderStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Package className="h-6 w-6" />
              <span>Add Product</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>Create Order</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span>Add Partner</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Download className="h-6 w-6" />
              <span>Export Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
