/**
 * Supabase browser client for VRIDDHI frontend.
 * Uses NEXT_PUBLIC env vars — safe for client components.
 * TRD §2: Supabase free tier for Auth + Postgres.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
