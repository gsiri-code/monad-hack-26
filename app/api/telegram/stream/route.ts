import { getClient, botEmitter } from "@/lib/telegram-client";

export async function GET() {
  // Start the Telegram client + listener when user opens chat
  await getClient();

  let sendFn: ((text: string) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      sendFn = (text: string) => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ text })}\n\n`);
        } catch {
          // controller already closed
        }
      };
      botEmitter.on("message", sendFn);
    },
    cancel() {
      // User closed the chat — stop listening
      if (sendFn) botEmitter.off("message", sendFn);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
