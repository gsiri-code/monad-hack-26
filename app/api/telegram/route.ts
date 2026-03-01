import { NextRequest, NextResponse } from "next/server";
import { sendToBot } from "@/lib/telegram-client";

const MESSAGES = [
  "Hey! What's up?",
  "Can you tell me something interesting?",
  "Give me a fun fact!",
];

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json().catch(() => ({}));
    const outgoing = message ?? MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    await sendToBot(outgoing);
    return NextResponse.json({ sent: outgoing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
