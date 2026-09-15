"use client";

import RequireAuth from "@/components/RequireAuth";

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
