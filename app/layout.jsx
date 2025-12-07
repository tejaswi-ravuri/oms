import { Suspense } from "react";
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
// import { PageProgressBar } from "@/components/ui/nprogress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bhaktinandan OMS - Order Management System",
  description: "Comprehensive textile and weaving business management system",
  keywords: ["OMS", "textile", "weaving", "inventory", "ledger", "production"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={null}>{/* <PageProgressBar /> */}</Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
