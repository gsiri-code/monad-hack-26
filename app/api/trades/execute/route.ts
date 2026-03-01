import { badRequest, internalError, notFound, ok, parseJsonBody, unauthorized } from "@/lib/api/http";
import { getAuthUser } from "@/lib/db/auth-server";
import { getSupabaseAdminClient } from "@/lib/db/server";
import { getContract, getShieldTokenAddress } from "@/lib/contract/client";
import { ethers } from "ethers";

type ExecuteTradeBody = {
  requestId?: string;
  requestID?: string;
};

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const bodyResult = await parseJsonBody<ExecuteTradeBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const requestId = (body.requestId ?? body.requestID)?.trim();
  if (!requestId) {
    return badRequest("requestId is required.");
  }

  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch the request
    const { data: req, error: reqError } = await supabase
      .from("requests")
      .select("uid, sender, receiver, amount, message, status")
      .eq("uid", requestId)
      .maybeSingle();

    if (reqError) return internalError(reqError.message);
    if (!req) return notFound("Request not found.");
    if (req.status !== "open") {
      return badRequest(`Request is already ${req.status}.`);
    }

    // 2. Fetch sender and receiver wallet addresses
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("uid, wallet_address")
      .in("uid", [req.sender, req.receiver]);

    if (usersError) return internalError(usersError.message);

    const senderUser = users?.find((u) => u.uid === req.sender);
    const receiverUser = users?.find((u) => u.uid === req.receiver);

    if (!senderUser?.wallet_address) return badRequest("Sender wallet address not found.");
    if (!receiverUser?.wallet_address) return badRequest("Receiver wallet address not found.");

    // 3. Call shieldedTransfer on-chain as owner — moves internal balance,
    //    no tokens leave the pool, no visible on-chain transfer.
    const token = getShieldTokenAddress();
    const amountWei = ethers.parseEther(String(req.amount));
    const memo = req.message ?? "";

    const contract = getContract();
    const tx = await contract.shieldedTransfer(
      senderUser.wallet_address,
      token,
      amountWei,
      receiverUser.wallet_address,
      memo,
    );
    const receipt = await tx.wait();

    // 4. Record in private_transactions
    const { data: txRow, error: txError } = await supabase
      .from("private_transactions")
      .insert({
        sender: req.sender,
        receiver: req.receiver,
        ciphertext: receipt.hash,
        nonce: receipt.blockNumber?.toString() ?? "0",
        sender_pubkey_used: senderUser.wallet_address,
        status: "success",
      })
      .select("uid, ts")
      .single();

    if (txError) return internalError(txError.message);

    // 5. Mark request as accepted
    await supabase
      .from("requests")
      .update({ status: "accepted" })
      .eq("uid", requestId);

    return ok({
      uid: txRow.uid,
      txHash: receipt.hash,
      time: txRow.ts,
      status: "success",
    });
  } catch (error) {
    return internalError(error);
  }
}
