import { getUnlink } from "@/lib/unlink-server";
import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// OpenClaw Telegram bot webhook
// Expects: { sender, receiver, amount, tokenDecimals, token, memo, visibility? }
// recipient must be a bech32m Unlink address (unlink1...).
// Amount is used for the private transfer but NEVER stored.
export async function POST(req: Request) {
  let body: {
    sender?: string;
    receiver?: string;
    amount?: number;
    tokenDecimals?: number;
    token?: string;
    memo?: string;
    visibility?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    sender,
    receiver,
    amount,
    tokenDecimals = 6,
    token,
    memo,
    visibility = "public",
  } = body;

  if (!sender || !receiver || !amount || !token || !memo) {
    return NextResponse.json(
      { error: "sender, receiver, amount, token, memo are required" },
      { status: 400 }
    );
  }

  try {
    const unlink = await getUnlink();

    // Convert amount to bigint with proper decimals (e.g. 5 USDC → 5_000_000n)
    const rawAmount = BigInt(Math.round(amount * 10 ** tokenDecimals));

    // Execute private transfer — amount is shielded, never logged
    // receiver must be a bech32m Unlink address (unlink1...)
    const result = await unlink.send({
      transfers: [{ token, recipient: receiver, amount: rawAmount }],
    });

    // Save social metadata without amount
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("social_feed")
      .insert({
        sender,
        receiver,
        memo,
        visibility,
        relay_id: result.relayId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, relayId: result.relayId, feed: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transfer failed" },
      { status: 500 }
    );
  }
}
