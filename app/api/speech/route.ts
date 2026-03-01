import { NextRequest, NextResponse } from "next/server";
import { sendToBot } from "@/lib/telegram-client";

// POST /api/speech
// Body: multipart/form-data with field "audio" (audio file)
// Flow: audio → ElevenLabs STT → transcript → send to bot
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY in env" }, { status: 500 });
    }

    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "audio field is required" }, { status: 400 });
    }

    // Step 1: Send audio to ElevenLabs STT
    const sttForm = new FormData();
    sttForm.append("file", audio, "audio.webm");
    sttForm.append("model_id", "scribe_v2");

    const sttRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: sttForm,
    });

    if (!sttRes.ok) {
      const err = await sttRes.text();
      return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: sttRes.status });
    }

    const sttData = await sttRes.json();
    const transcript: string = sttData.text?.trim();

    if (!transcript) {
      return NextResponse.json({ error: "No speech detected" }, { status: 422 });
    }

    // Step 2: Forward transcript to bot
    await sendToBot(transcript);

    return NextResponse.json({ transcript, sent: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
