"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import UserShell from "@/components/UserShell";

// User-app routes that share ONE persistent sidebar shell.
const USER_APP = ["/dashboard", "/portfolio", "/compare", "/ipo", "/research"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  const isUserApp = USER_APP.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // Admin has its own layout chrome; render children bare (its layout.tsx wraps them).
  if (isAdmin) {
    return <>{children}</>;
  }

  // User app: ONE persistent UserShell instance — does not remount between app pages,
  // so the sidebar no longer blinks on navigation.
  if (isUserApp) {
    return <UserShell>{children}</UserShell>;
  }

  // Public pages: marketing navbar + centered content + mobile bottom nav.
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <MobileBottomNav />
    </>
  );
}
