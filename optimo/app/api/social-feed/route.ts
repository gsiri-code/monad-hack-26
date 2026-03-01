import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const visibility = searchParams.get("visibility") ?? "public";

  const supabase = createServerClient();
  let query = supabase
    .from("social_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (wallet) {
    query = query.or(`sender.eq.${wallet},receiver.eq.${wallet}`);
  } else {
    query = query.eq("visibility", visibility);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { sender, receiver, memo, relay_id, visibility = "public" } = body;

  if (!sender || !receiver || !memo) {
    return NextResponse.json(
      { error: "sender, receiver, memo are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("social_feed")
    .insert({ sender, receiver, memo, relay_id, visibility })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
