import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type GlobalWithSupabase = typeof globalThis & {
  __supabaseAdmin?: SupabaseClient;
};

const globalForSupabase = globalThis as GlobalWithSupabase;

export function getSupabaseAdminClient() {
  if (globalForSupabase.__supabaseAdmin) {
    return globalForSupabase.__supabaseAdmin;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  globalForSupabase.__supabaseAdmin = client;
  return client;
}
