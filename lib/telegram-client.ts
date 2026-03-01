import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { EventEmitter } from "events";

const BOT = "Zephyr_Zephyr_bot";

export const botEmitter = new EventEmitter();

let client: TelegramClient | null = null;

export async function getClient(): Promise<TelegramClient> {
  if (client?.connected) return client;

  const apiId = parseInt(process.env.TELEGRAM_API_ID ?? "");
  const apiHash = process.env.TELEGRAM_API_HASH ?? "";
  const sessionString = process.env.TELEGRAM_SESSION ?? "";

  if (!apiId || !apiHash || !sessionString) {
    throw new Error("Missing TELEGRAM_API_ID, TELEGRAM_API_HASH, or TELEGRAM_SESSION in env");
  }

  client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect(); // uses saved session — no prompts

  // Long-running listener — fires on every new message from the bot
  client.addEventHandler(async (event: any) => {
    const msg = event.message;
    const sender = await msg.getSender() as any;
    if (sender?.username === BOT) {
      botEmitter.emit("message", msg.text as string);
    }
  }, new NewMessage({}));

  return client;
}

export async function sendToBot(message: string): Promise<void> {
  const tg = await getClient();
  await tg.sendMessage(BOT, { message });
}
