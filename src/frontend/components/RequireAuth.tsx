"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

/**
 * Wraps any page that requires an authenticated user.
 * While auth is resolving, shows a light loader.
 * If no user (e.g. after logout), redirects to the homepage.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-primary-muted">
        <span className="inline-block w-4 h-4 mr-2 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
