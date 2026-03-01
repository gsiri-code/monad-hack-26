import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { EditedMessage } from "telegram/events/EditedMessage.js";
import { EventEmitter } from "events";

const BOT = "Zephyr_Zephyr_bot";

export const botEmitter = new EventEmitter();

let client: TelegramClient | null = null;

// Debounce bot messages by Telegram message ID.
// Bots that stream responses edit the same message repeatedly —
// we wait 1 s of silence before emitting the final text.
const pending = new Map<number, ReturnType<typeof setTimeout>>();

function scheduleEmit(msgId: number, text: string) {
  const existing = pending.get(msgId);
  if (existing) clearTimeout(existing);
  pending.set(
    msgId,
    setTimeout(() => {
      pending.delete(msgId);
      botEmitter.emit("message", text);
    }, 1000),
  );
}

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

  async function handleBotEvent(event: any) {
    const msg = event.message;
    const sender = await msg.getSender() as any;
    if (sender?.username === BOT) {
      scheduleEmit(msg.id as number, msg.text as string);
    }
  }

  // Fire on new messages AND edits (streaming bots edit their message as they type)
  client.addEventHandler(handleBotEvent, new NewMessage({}));
  client.addEventHandler(handleBotEvent, new EditedMessage({}));

  return client;
}

export async function sendToBot(message: string): Promise<void> {
  const tg = await getClient();
  await tg.sendMessage(BOT, { message });
}
