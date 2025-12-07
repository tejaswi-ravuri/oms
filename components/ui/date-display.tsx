"use client";

import { useState, useEffect } from "react";

export function CurrentDateDisplay() {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Set date only on client side to avoid hydration mismatch
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return <span>{currentDate || "Loading..."}</span>;
}
