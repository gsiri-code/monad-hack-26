import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db/server";
import { getSupabaseAuthServerClient } from "@/lib/db/auth-server";

// Matches seed.sql — uid must equal the Supabase auth user id
const DEMO = {
  id: "a1000000-0000-0000-0000-000000000001",
  email: "alex@demo.monad",
  password: "dev-demo-2026",
};

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();

  // Upsert the demo auth user with a known password
  const { data: existing } = await admin.auth.admin.getUserById(DEMO.id);

  if (!existing.user) {
    const { error } = await admin.auth.admin.createUser({
      id: DEMO.id,
      email: DEMO.email,
      password: DEMO.password,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Ensure password is set even if user already existed
    await admin.auth.admin.updateUserById(DEMO.id, {
      password: DEMO.password,
      email_confirm: true,
    });
  }

  // Sign in with password — SSR client sets session cookies on the response
  const supabase = await getSupabaseAuthServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO.email,
    password: DEMO.password,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
