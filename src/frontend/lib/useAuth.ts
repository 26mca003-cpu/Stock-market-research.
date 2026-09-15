"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchRole = async (userObj: User | null) => {
      if (!userObj) {
        setIsAdmin(false);
        return;
      }

      // Check role in Supabase Auth metadata
      if (
        userObj.app_metadata?.role === "admin" ||
        userObj.user_metadata?.role === "admin" ||
        userObj.user_metadata?.is_admin === true
      ) {
        setIsAdmin(true);
        return;
      }

      // Query database profiles table
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userObj.id)
          .single();

        if (data && data.role === "admin") {
          setIsAdmin(true);
          return;
        }
      } catch (err) {
        console.error("Error fetching role from profiles table:", err);
      }

      setIsAdmin(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchRole(session?.user ?? null).finally(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchRole(session?.user ?? null).finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, isAdmin, signOut };
}
