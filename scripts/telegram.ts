import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length && !key.startsWith("#")) {
    process.env[key.trim()] ??= rest.join("=").trim();
  }
}

const apiId = parseInt(process.env.TELEGRAM_API_ID ?? "");
const apiHash = process.env.TELEGRAM_API_HASH ?? "";
const sessionString = process.env.TELEGRAM_SESSION ?? "";

if (!apiId || !apiHash) {
  console.error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in .env.local");
  process.exit(1);
}

const BOT = "@Zephyr_Zephyr_bot";

const MESSAGES = [
  "Hey! What's up?",
  "Can you tell me something interesting?",
  "Give me a fun fact!",
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

function waitForBotReply(client: TelegramClient): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({}));
      reject(new Error("Timed out waiting for bot reply (30s)"));
    }, 30_000);

    const handler = async (event: any) => {
      const msg = event.message;
      const sender = await msg.getSender() as any;
      if (sender?.username === BOT.replace("@", "")) {
        clearTimeout(timer);
        client.removeEventHandler(handler, new NewMessage({}));
        resolve(msg.text as string);
      }
    };

    client.addEventHandler(handler, new NewMessage({}));
  });
}

async function main() {
  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: () => ask("Phone number (+1234567890): "),
    password: () => ask("2FA password (leave blank if none): "),
    phoneCode: () => ask("OTP code from Telegram app: "),
    onError: (err) => console.error("Auth error:", err),
  });

  if (!sessionString) {
    const saved = client.session.save() as unknown as string;
    console.log("\n--- Save this to TELEGRAM_SESSION in .env.local ---");
    console.log(saved);
    console.log("---------------------------------------------------\n");
  }

  // Step 1: Read bot's last message
  const history = await client.getMessages(BOT, { limit: 1 });
  const lastMsg = history[0]?.text;
  if (lastMsg) {
    console.log(`[${BOT}]: ${lastMsg}`);
  }

  // Step 2: Pick a random fixed message
  const outgoing = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  // Step 3: Listen before sending to avoid race condition
  const replyPromise = waitForBotReply(client);
  await client.sendMessage(BOT, { message: outgoing });
  console.log(`\n[You → ${BOT}]: ${outgoing}`);

  // Step 4: Wait for bot reply
  console.log("\nWaiting for bot reply...");
  const botReply = await replyPromise;
  console.log(`\n[${BOT}]: ${botReply}`);

  rl.close();
  await client.disconnect();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
