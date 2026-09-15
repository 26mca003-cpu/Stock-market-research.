import "./globals.css";
import type { Metadata } from "next";
import AppChrome from "@/components/AppChrome";

export const metadata: Metadata = {
  title: "VRIDDHI — AI Long-Term Investor Research Platform",
  description:
    "Institutional-grade 6-layer research for Indian stocks (NSE/BSE). Free, instant, and in plain language.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#0F172A] selection:bg-accent selection:text-white">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
