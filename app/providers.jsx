"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

const queryClient = new QueryClient();

export function Providers({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const original = window.console.error;

    window.console.error = function (...args) {
      const msg = args?.[0];
      if (
        typeof msg === "string" &&
        (msg.includes("Hydration") ||
          msg.includes("hydrated") ||
          msg.includes("server rendered HTML didn't match"))
      ) {
        return; // ignore hydration warnings safely
      }

      // forward ALL other errors normally
      original.apply(console, args);
    };

    return () => {
      window.console.error = original;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </QueryClientProvider>
  );
}
