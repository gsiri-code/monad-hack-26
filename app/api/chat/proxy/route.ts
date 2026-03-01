import { badRequest, internalError, parseJsonBody } from "@/lib/api/http";
import { bridgeApiFetch, BridgeSessionError } from "@/lib/bridge/api-client";
import { NextResponse } from "next/server";

type ProxyBody = {
  sessionId?: string;
  path?: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE", "PUT"]);

// Paths the proxy is not permitted to forward to (avoid infinite loops / escapes)
const BLOCKED_PREFIXES = ["/api/chat/proxy", "/api/auth/dev-login"];

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody<ProxyBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const sessionId = body.sessionId?.trim();
  const path = body.path?.trim();
  const method = (body.method?.toUpperCase() ?? "GET");

  if (!sessionId) return badRequest("sessionId is required.");
  if (!path) return badRequest("path is required.");
  if (!ALLOWED_METHODS.has(method)) return badRequest(`method must be one of: ${[...ALLOWED_METHODS].join(", ")}`);
  if (!path.startsWith("/api/")) return badRequest("path must start with /api/");
  if (BLOCKED_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json({ error: "Forbidden path." }, { status: 403 });
  }

  try {
    const init: RequestInit = { method };

    if (body.body !== undefined && method !== "GET" && method !== "DELETE") {
      init.body = JSON.stringify(body.body);
      init.headers = { "Content-Type": "application/json", ...(body.headers ?? {}) };
    } else if (body.headers) {
      init.headers = body.headers;
    }

    const upstream = await bridgeApiFetch(sessionId, path, init);

    const contentType = upstream.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    return NextResponse.json(responseBody, { status: upstream.status });
  } catch (err) {
    if (err instanceof BridgeSessionError) {
      const status = err.reason === "not_found" ? 404 : 401;
      return NextResponse.json({ error: err.reason }, { status });
    }
    return internalError(err);
  }
}
