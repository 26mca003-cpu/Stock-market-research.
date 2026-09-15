"use client";

import RequireAuth from "@/components/RequireAuth";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
