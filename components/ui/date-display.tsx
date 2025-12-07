"use client";

import { useEffect, useState } from "react";

export function DateDisplay({ date, format = "date", fallback = "Unknown" }) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    if (date) {
      const dateObj = new Date(date);

      switch (format) {
        case "datetime":
          setFormattedDate(dateObj.toLocaleString());
          break;
        case "time":
          setFormattedDate(dateObj.toLocaleTimeString());
          break;
        case "date":
        default:
          setFormattedDate(dateObj.toLocaleDateString());
          break;
      }
    }
  }, [date, format, fallback]);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{formattedDate}</>;
}

export function CurrentDateDisplay({
  format = "date",
  fallback = "Loading...",
}) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    const now = new Date();

    switch (format) {
      case "datetime":
        setFormattedDate(now.toLocaleString());
        break;
      case "time":
        setFormattedDate(now.toLocaleTimeString());
        break;
      case "date":
      default:
        setFormattedDate(
          now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
        break;
    }
  }, [format, fallback]);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{formattedDate}</>;
}
