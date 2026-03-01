import apiClient from "@/lib/api/client";

/**
 * POST /api/telegram — send a text message to the bot.
 * Pass no message to send a random canned message.
 */
export async function sendMessage(message?: string): Promise<{ sent: string }> {
  const { data } = await apiClient.post<{ sent: string }>(
    "/telegram",
    message ? { message } : {},
  );
  return data;
}

/**
 * POST /api/speech — send an audio blob, get it transcribed and forwarded to the bot.
 * Returns the transcript text and confirms it was sent.
 */
export async function sendSpeech(
  audioBlob: Blob,
  filename = "audio.webm",
): Promise<{ transcript: string; sent: true }> {
  const form = new FormData();
  form.append("audio", audioBlob, filename);
  const { data } = await apiClient.post<{ transcript: string; sent: true }>(
    "/speech",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

/**
 * GET /api/telegram/stream — open an SSE stream for bot replies.
 * Returns the EventSource; caller must call .close() on cleanup.
 */
export function openBotStream(onMessage: (text: string) => void): EventSource {
  const es = new EventSource("/api/telegram/stream");
  es.onmessage = (e) => {
    try {
      const { text } = JSON.parse(e.data) as { text?: string };
      if (text) onMessage(text);
    } catch {
      // ignore malformed events
    }
  };
  return es;
}
