import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Get user id from wallet address
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", wallet)
    .single();

  if (!user) return NextResponse.json([], { status: 200 });

  const { data, error } = await supabase
    .from("friends")
    .select("friend:users!friends_friend_id_fkey(id, wallet_address, display_name, avatar_url)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.map((row) => row.friend) ?? []);
}

export async function POST(req: Request) {
  const { user_wallet, friend_wallet } = await req.json();

  if (!user_wallet || !friend_wallet) {
    return NextResponse.json(
      { error: "user_wallet and friend_wallet are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const [{ data: user }, { data: friend }] = await Promise.all([
    supabase.from("users").select("id").eq("wallet_address", user_wallet).single(),
    supabase.from("users").select("id").eq("wallet_address", friend_wallet).single(),
  ]);

  if (!user || !friend) {
    return NextResponse.json({ error: "One or both users not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("friends")
    .insert({ user_id: user.id, friend_id: friend.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
