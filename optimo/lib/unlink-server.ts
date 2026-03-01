import { initUnlink } from "@unlink-xyz/node";

type UnlinkInstance = Awaited<ReturnType<typeof initUnlink>>;

let instance: UnlinkInstance | null = null;

export async function getUnlink(): Promise<UnlinkInstance> {
  if (!instance) {
    instance = await initUnlink({ chain: "monad-testnet" });
  }
  return instance;
}
