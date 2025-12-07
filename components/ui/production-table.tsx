"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export function ProductionTable({
  data,
  loading = false,
  error,
  columns,
  actions = [],
  bulkActions = [],
  selectable = false,
  pagination,
  search,
  exportOptions,
  uploadOptions,
  emptyState,
  tableName,
  realTimeEnabled = false,
  onDataChange,
  showRefresh = true,
  showSettings = false,
  onRefresh,
  onSettings,
  className = "",
  cardClassName = "",
  headerClassName = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State Management
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState(null);
  const [filters, setFilters] = useState({});
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connected");

  // Real-time subscription
  useEffect(() => {
    if (!realTimeEnabled || !tableName) return;

    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload) => {
          console.log("Real-time update:", payload);
          handleRealTimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        setConnectionStatus(
          status === "SUBSCRIBED" ? "connected" : "connecting"
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realTimeEnabled, tableName]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback(
    (payload) => {
      if (!onDataChange) return;

      switch (payload.eventType) {
        case "INSERT":
          onDataChange([...data, payload.new]);
          break;
        case "UPDATE":
          onDataChange(
            data.map((item) =>
              item.id === payload.new.id ? payload.new : item
            )
          );
          break;
        case "DELETE":
          onDataChange(data.filter((item) => item.id !== payload.old.id));
          break;
      }
    },
    [data, onDataChange]
  );

  // Sorting
  const handleSort = useCallback((key) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  }, []);

  // Filtering
  const handleFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSortConfig(null);
    search?.onSearch("");
  }, [search]);

  // Processed data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      result = result.filter((item) => {
        const itemValue = item[key];
        return String(itemValue).toLowerCase().includes(value?.toLowerCase());
      });
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  // Selection handlers
  const toggleRowSelection = useCallback((id) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedData.map((item) => item.id)));
    }
  }, [selectedRows.size, processedData]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // Export handlers
  const handleExport = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      try {
        const selectedOnly = selectedRows.size > 0;
        await exportOptions?.onExport(format, selectedOnly);
      } catch (error) {
        toast.error(`Failed to export as ${format.toUpperCase()}`);
      }
    },
    [exportOptions, selectedRows.size]
  );

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2">
      {connectionStatus === "connected" ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : connectionStatus === "connecting" ? (
        <Clock className="h-4 w-4 text-yellow-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-xs text-gray-500">
        {connectionStatus === "connected"
          ? "Live"
          : connectionStatus === "connecting"
          ? "Connecting..."
          : "Disconnected"}
      </span>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className={cardClassName}>
        <CardHeader className={headerClassName}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tableName && <ConnectionStatus />}
                  Data Management
                </CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${processedData.length} records`}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              )}

              {showSettings && (
                <Button variant="outline" size="sm" onClick={onSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}

              {uploadOptions && (
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}

              {exportOptions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {exportOptions.csv && (
                      <DropdownMenuItem onClick={() => handleExport("csv")}>
                        Export as CSV
                      </DropdownMenuItem>
                    )}
                    {exportOptions.excel && (
                      <DropdownMenuItem onClick={() => handleExport("excel")}>
                        Export as Excel
                      </DropdownMenuItem>
                    )}
                    {exportOptions.pdf && (
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        Export as PDF
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            {search && (
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={search.placeholder}
                  value={search.query}
                  onChange={(e) => search.onSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Filters */}
            {columns.filter((col) => col.filterable).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {columns
                  .filter((col) => col.filterable)
                  .map((column) => (
                    <Select
                      key={String(column.key)}
                      value={filters[String(column.key)] || ""}
                      onValueChange={(value) =>
                        handleFilter(String(column.key), value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue
                          placeholder={`Filter by ${column.title}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All {column.title}</SelectItem>
                        {column.filterOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}

                {(Object.keys(filters).some((key) => filters[key]) ||
                  sortConfig) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedRows.size === processedData.length &&
                          processedData.length > 0
                        }
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={
                        column.sortable ? "cursor-pointer hover:bg-gray-50" : ""
                      }
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.title}
                        {sortConfig?.key === column.key && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {actions.length > 0 && (
                    <TableHead className="w-12">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {selectable && (
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      )}
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : processedData.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell
                      colSpan={
                        columns.length +
                        (selectable ? 1 : 0) +
                        (actions.length > 0 ? 1 : 0)
                      }
                    >
                      <div className="text-center py-8">
                        <div className="text-gray-500 font-medium">
                          {emptyState?.title || "No data found"}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {emptyState?.description ||
                            "Try adjusting your filters"}
                        </div>
                        {emptyState?.action && (
                          <Button
                            className="mt-4"
                            onClick={emptyState.action.onClick}
                          >
                            {emptyState.action.label}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Data rows
                  processedData.map((row) => (
                    <TableRow key={row.id}>
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(row.id)}
                            onCheckedChange={() => toggleRowSelection(row.id)}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={String(column.key)}
                          className={column.className}
                        >
                          {column.render
                            ? column.render(row[column.key], row)
                            : String(row[column.key] || "")}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={() => action.onClick(row)}
                                  disabled={action.disabled?.(row)}
                                  className={
                                    action.variant === "destructive"
                                      ? "text-red-600"
                                      : ""
                                  }
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Select
                  value={String(pagination.itemsPerPage)}
                  onValueChange={(value) =>
                    pagination.onItemsPerPageChange(Number(value))
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    pagination.onPageChange(pagination.currentPage - 1)
                  }
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    pagination.onPageChange(pagination.currentPage + 1)
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectable && selectedRows.size > 0 && bulkActions.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedRows.size} items selected
                </span>
              </div>
              <div className="flex gap-2">
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={
                      action.variant === "destructive"
                        ? "destructive"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      action.onClick(
                        processedData.filter((row) => selectedRows.has(row.id))
                      )
                    }
                    disabled={action.disabled?.(
                      processedData.filter((row) => selectedRows.has(row.id))
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
