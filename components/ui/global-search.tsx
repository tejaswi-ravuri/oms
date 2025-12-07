"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Package,
  FileText,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  TrendingUp,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalSearch({
  placeholder = "Search across all modules...",
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState("all");
  const router = useRouter();
  const inputRef = useRef(null);

  const modules = [
    {
      value: "all",
      label: "All Modules",
      icon: <Search className="h-4 w-4" />,
    },
    {
      value: "products",
      label: "Products",
      icon: <Package className="h-4 w-4" />,
    },
    {
      value: "orders",
      label: "Orders",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      value: "production",
      label: "Production",
      icon: <Truck className="h-4 w-4" />,
    },
    {
      value: "inventory",
      label: "Inventory",
      icon: <Package className="h-4 w-4" />,
    },
    { value: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    {
      value: "ledger",
      label: "Ledger",
      icon: <DollarSign className="h-4 w-4" />,
    },
  ];

  const getModuleIcon = (module) => {
    const moduleConfig = modules.find((m) => m.value === module);
    return moduleConfig?.icon || <Search className="h-4 w-4" />;
  };

  const getModuleLabel = (module) => {
    const moduleConfig = modules.find((m) => m.value === module);
    return moduleConfig?.label || module;
  };

  const performSearch = async (searchQuery, module = "all") => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&module=${module}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.error("Search failed:", response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query && open) {
        performSearch(query, selectedModule);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, selectedModule, open]);

  const handleSelect = (result) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.path);
  };

  const getRelevanceColor = (score) => {
    if (!score) return "text-gray-500";
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-gray-500";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
      case "completed":
      case "good":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "pending":
      case "processing":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case "cancelled":
      case "bad":
      case "wastage":
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            <div className="flex items-center">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {query ? (
                <span className="truncate">{query}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-2">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search products, orders, production, inventory..."
                value={query}
                onValueChange={setQuery}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                ref={inputRef}
              />
            </div>

            {/* Module Filter */}
            <div className="flex items-center gap-1 p-2 border-b">
              <Filter className="h-4 w-4 mr-2" />
              {modules.map((module) => (
                <Button
                  key={module.value}
                  variant={
                    selectedModule === module.value ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => setSelectedModule(module.value)}
                  className="h-7 text-xs"
                >
                  {module.icon}
                  <span className="ml-1">{module.label}</span>
                </Button>
              ))}
            </div>

            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              {!loading && results.length === 0 && query && (
                <CommandEmpty className="py-6 text-center text-sm">
                  No results found for "{query}"
                </CommandEmpty>
              )}

              {!loading && results.length > 0 && (
                <CommandGroup heading="Search Results">
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                          {getModuleIcon(result.module)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {result.title}
                            </span>
                            {result.metadata?.status &&
                              getStatusIcon(result.metadata.status)}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {result.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getModuleLabel(result.module)}
                            </Badge>
                            {result.relevanceScore && (
                              <span
                                className={cn(
                                  "text-xs",
                                  getRelevanceColor(result.relevanceScore)
                                )}
                              >
                                {Math.round(result.relevanceScore * 100)}% match
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Keyboard shortcut hook
export function useGlobalSearch() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        // Trigger global search
        const searchButton = document.querySelector(
          "[data-global-search-trigger]"
        );
        if (searchButton) {
          (searchButton as HTMLElement).click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
