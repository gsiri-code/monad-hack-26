import { NextRequest, NextResponse } from "next/server";
import { sendToBot } from "@/lib/telegram-client";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);

  if (!form) {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const audio = form.get("audio");

  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "audio field is required." }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Speech transcription is not configured." }, { status: 500 });
  }

  try {
    // Call ElevenLabs Scribe v2
    const elForm = new FormData();
    elForm.append("audio", audio, (audio as File).name ?? "audio.webm");
    elForm.append("model_id", "scribe_v2");

    const elRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: elForm,
    });

    if (!elRes.ok) {
      const errBody = await elRes.text().catch(() => "");
      console.error("ElevenLabs error:", elRes.status, errBody);
      return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
    }

    const { text } = await elRes.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "No speech detected in audio." }, { status: 422 });
    }

    const transcript = text.trim();
    await sendToBot(transcript);

    return NextResponse.json({ transcript, sent: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
