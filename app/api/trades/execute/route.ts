import { badRequest, ok, parseJsonBody, unauthorized } from "@/lib/api/http";
import { getAuthUser } from "@/lib/db/auth-server";

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

  return ok({
    uid: crypto.randomUUID(),
    time: new Date().toISOString(),
    status: "failure",
    message:
      "Trade execution is currently a stub endpoint. No settlement has been performed.",
  });
}
