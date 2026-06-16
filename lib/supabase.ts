import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

function isValidUrl(url?: string) {
  if (!url || url === "your_supabase_url") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isValidUrl(url) || !key || key === "your_supabase_anon_key") return null;
  _client = createClient(url!, key);
  return _client;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!isValidUrl(url) || !key || key === "your_service_key") return null;
  _admin = createClient(url!, key);
  return _admin;
}

// Legacy exports for compatibility
export const supabaseClient = null as SupabaseClient | null;
export const supabaseAdmin = null as SupabaseClient | null;
