import { badRequest, ok } from "@/lib/api/http";

type ExecuteTradeBody = {
  requestId?: string;
  requestID?: string;
};

export async function POST(request: Request) {
  let body: ExecuteTradeBody;

  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

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
