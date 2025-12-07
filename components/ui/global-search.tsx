"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({
  placeholder = "Search...",
  className,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, redirect to a generic search page
      // You can implement more sophisticated search logic here
      router.push(
        `/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "justify-start text-gray-500 hover:text-gray-900 hover:bg-gray-100 w-full",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="text-sm">{placeholder}</span>
        <kbd className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
          ⌘K
        </kbd>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <form onSubmit={handleSearch} className="p-4">
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none focus-visible:ring-0 flex-1 text-gray-900 placeholder-gray-400"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery("");
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500">
            Press{" "}
            <kbd className="bg-gray-100 px-1 py-0.5 rounded text-xs">Enter</kbd>{" "}
            to search,
            <kbd className="bg-gray-100 px-1 py-0.5 rounded text-xs ml-1">
              Esc
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}

export function useGlobalSearch() {
  // This hook can be used to initialize global search functionality
  // The actual keyboard shortcut handling is done in the component itself
  useEffect(() => {
    // Any global search initialization can go here
  }, []);
}
