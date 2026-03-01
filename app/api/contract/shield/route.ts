import { badRequest, internalError, ok, parseJsonBody, unauthorized } from "@/lib/api/http";
import { getAuthUser } from "@/lib/db/auth-server";
import { getContract, getShieldTokenAddress } from "@/lib/contract/client";
import { ethers } from "ethers";

type ShieldBody = {
  amount: string | number;
  receiverWallet: string;
  token?: string;
  memo?: string;
};

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const bodyResult = await parseJsonBody<ShieldBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const receiverWallet = body.receiverWallet?.trim();
  if (!receiverWallet || !ethers.isAddress(receiverWallet)) {
    return badRequest("receiverWallet must be a valid EVM address.");
  }

  const rawAmount = body.amount;
  if (!rawAmount) return badRequest("amount is required.");
  const amountStr = typeof rawAmount === "number" ? rawAmount.toString() : rawAmount.trim();
  let amountWei: bigint;
  try {
    amountWei = ethers.parseEther(amountStr);
    if (amountWei <= BigInt(0)) throw new Error();
  } catch {
    return badRequest("amount must be a positive number (in ether units).");
  }

  const token = (body.token?.trim()) || getShieldTokenAddress();
  if (!ethers.isAddress(token)) return badRequest("token must be a valid EVM address.");

  const memo = body.memo?.trim() ?? "";

  try {
    const contract = getContract();
    const tx = await contract.shieldAndPay(token, amountWei, receiverWallet, memo);
    const receipt = await tx.wait();

    return ok({
      txHash: receipt.hash,
      amount: amountStr,
      token,
      receiverWallet,
    });
  } catch (error) {
    return internalError(error);
  }
}
