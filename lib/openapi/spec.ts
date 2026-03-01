import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// ─── Shared primitives ────────────────────────────────────────────────────────

const Uuid = z.string().uuid().openapi({
  description: "UUID",
  example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
});

const Timestamp = z.string().datetime().openapi({
  description: "ISO-8601 timestamp",
  example: "2026-02-28T12:00:00.000Z",
});

const Amount = z.string().openapi({
  description: "Decimal amount encoded as string",
  example: "10.5",
});

// ─── Shared response schemas ──────────────────────────────────────────────────

const ErrorResponse = registry.register(
  "ErrorResponse",
  z.object({ error: z.string() }),
);

const RequestStatus = registry.register(
  "RequestStatus",
  z.enum(["open", "accepted", "rejected", "cancelled", "expired"]),
);

const ExecutionStatus = registry.register(
  "ExecutionStatus",
  z.enum(["pending", "success", "failure"]),
);

// ─── Auth schemas ─────────────────────────────────────────────────────────────

const MagicLinkSendBody = registry.register(
  "MagicLinkSendBody",
  z.object({ email: z.string().email() }),
);

const MagicLinkSendResponse = registry.register(
  "MagicLinkSendResponse",
  z.object({ message: z.string() }),
);

const MagicLinkVerifyBody = registry.register(
  "MagicLinkVerifyBody",
  z.object({
    email: z.string().email(),
    code: z.string().min(1).openapi({ description: "OTP code from email" }),
  }),
);

const MagicLinkVerifyResponse = registry.register(
  "MagicLinkVerifyResponse",
  z.object({
    user: z.object({
      id: Uuid,
      email: z.string().email().nullable(),
    }),
    session: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiresAt: z.number().int().openapi({ description: "Unix timestamp" }),
    }),
  }),
);

// ─── Bridge schemas ───────────────────────────────────────────────────────────

const ChatSessionCreateBody = registry.register(
  "ChatSessionCreateBody",
  z.object({
    refreshToken: z.string().min(1).openapi({
      description: "Refresh token from POST /api/auth/magic/verify",
    }),
  }),
);

const ChatSessionCreateResponse = registry.register(
  "ChatSessionCreateResponse",
  z.object({
    sessionId: Uuid.openapi({
      description: "Opaque session handle passed to bridgeApiFetch — never contains raw tokens",
    }),
  }),
);

const ChatSessionRevokeResponse = registry.register(
  "ChatSessionRevokeResponse",
  z.object({ revoked: z.literal(true) }),
);

const ProfileObject = registry.register(
  "Profile",
  z.object({
    uid: Uuid,
    username: z.string(),
    walletAddress: z.string(),
    encryptionPublicKey: z.string().nullable(),
    phoneNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().nullable(),
  }),
);

const MeResponse = registry.register(
  "MeResponse",
  z.object({
    id: Uuid,
    email: z.string().email().nullable(),
    profile: ProfileObject.nullable(),
  }),
);

// ─── User schemas ─────────────────────────────────────────────────────────────

const UserObject = registry.register(
  "User",
  z.object({
    uid: Uuid,
    username: z.string(),
    walletAddress: z.string(),
    encryptionPublicKey: z.string().nullable(),
    phoneNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().nullable(),
  }),
);

const CreateUserBody = registry.register(
  "CreateUserBody",
  z.object({
    username: z.string().min(1),
    walletAddress: z.string().min(1),
    encryptionPublicKey: z.string().min(1).optional(),
    phoneNumber: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
);

const CreateUserResponse = registry.register(
  "CreateUserResponse",
  z.object({ user: UserObject }),
);

// ─── Friendship schemas ───────────────────────────────────────────────────────

const FriendshipResponse = registry.register(
  "FriendshipResponse",
  z.object({
    friendship: z.object({
      uid: Uuid,
      userA: Uuid,
      userB: Uuid,
      createdAt: Timestamp,
    }),
  }),
);

const ListFriendshipsResponse = registry.register(
  "ListFriendshipsResponse",
  z.object({
    friendships: z.array(
      z.object({
        uid: Uuid,
        createdAt: Timestamp,
        friend: z.object({
          uid: Uuid,
          username: z.string(),
          walletAddress: z.string(),
          phoneNumber: z.string(),
        }),
      }),
    ),
  }),
);

const WalletResponse = registry.register(
  "WalletResponse",
  z.object({
    uid: Uuid,
    wallet: z.array(
      z.object({
        currencyName: z.string(),
        amount: Amount,
      }),
    ),
  }),
);

// ─── Request schemas ──────────────────────────────────────────────────────────

const RequestObject = registry.register(
  "Request",
  z.object({
    uid: Uuid,
    sender: Uuid,
    receiver: Uuid,
    amount: Amount,
    timestamp: Timestamp,
    status: RequestStatus,
    message: z.string().nullable(),
  }),
);

const CreateRequestBody = registry.register(
  "CreateRequestBody",
  z.object({
    sender: Uuid.optional(),
    receiver: Uuid.optional(),
    user1: Uuid.optional(),
    user2: Uuid.optional(),
    amount: z.union([z.number().positive(), z.string().min(1)]),
    message: z.string().optional().nullable(),
  }),
);

const CreateRequestResponse = registry.register(
  "CreateRequestResponse",
  z.object({
    uid: Uuid,
    time: Timestamp,
    status: RequestStatus,
  }),
);

const ListRequestsResponse = registry.register(
  "ListRequestsResponse",
  z.object({ requests: z.array(RequestObject) }),
);

const PatchRequestBody = registry.register(
  "PatchRequestBody",
  z.object({
    status: z.enum(["accepted", "rejected", "cancelled"]),
    message: z.string().optional().nullable(),
  }),
);

// ─── Trade / Transaction schemas ──────────────────────────────────────────────

const ExecuteTradeBody = registry.register(
  "ExecuteTradeBody",
  z.union([
    z.object({ requestId: Uuid }),
    z.object({ requestID: Uuid }),
  ]),
);

const ExecuteTradeResponse = registry.register(
  "ExecuteTradeResponse",
  z.object({
    uid: Uuid,
    time: Timestamp,
    status: z.enum(["success", "failure"]),
    message: z.string(),
  }),
);

const PublicTransactionExecuteBody = registry.register(
  "PublicTransactionExecuteBody",
  z.object({
    sender: Uuid.optional(),
    receiver: Uuid.optional(),
    user1: Uuid.optional(),
    user2: Uuid.optional(),
    amount: z.union([z.number().positive(), z.string().min(1)]),
    message: z.string().optional().nullable(),
    status: ExecutionStatus.optional(),
  }),
);

const PublicTransactionExecuteResponse = registry.register(
  "PublicTransactionExecuteResponse",
  z.object({
    uid: Uuid,
    time: Timestamp,
    status: ExecutionStatus,
    sender: Uuid,
    receiver: Uuid,
    type: z.literal("public"),
  }),
);

const PrivateTransaction = registry.register(
  "PrivateTransaction",
  z.object({
    uid: Uuid,
    sender: Uuid,
    receiver: Uuid,
    ciphertext: z.string(),
    nonce: z.string(),
    senderPublicKeyUsed: z.string(),
    timestamp: Timestamp,
    status: ExecutionStatus,
  }),
);

const PrivateTransactionsListResponse = registry.register(
  "PrivateTransactionsListResponse",
  z.object({ privateTransactions: z.array(PrivateTransaction) }),
);

const PrivateTransactionExecuteBody = registry.register(
  "PrivateTransactionExecuteBody",
  z.object({
    sender: Uuid.optional(),
    receiver: Uuid.optional(),
    user1: Uuid.optional(),
    user2: Uuid.optional(),
    ciphertext: z.string().optional(),
    payloadCiphertext: z.string().optional(),
    nonce: z.string().optional(),
    payloadNonce: z.string().optional(),
    senderPublicKeyUsed: z.string().optional(),
    senderPubkeyUsed: z.string().optional(),
    status: ExecutionStatus.optional(),
  }),
);

const PrivateTransactionExecuteResponse = registry.register(
  "PrivateTransactionExecuteResponse",
  z.object({
    uid: Uuid,
    time: Timestamp,
    status: ExecutionStatus,
    sender: Uuid,
    receiver: Uuid,
    type: z.literal("private"),
  }),
);

// ─── Response helpers ─────────────────────────────────────────────────────────

function standardErrorResponses() {
  return {
    400: {
      description: "Bad request",
      content: { "application/json": { schema: ErrorResponse } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponse } },
    },
    409: {
      description: "Conflict",
      content: { "application/json": { schema: ErrorResponse } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorResponse } },
    },
  };
}

function authErrorResponses() {
  return {
    401: {
      description: "Unauthorized — missing or invalid Bearer token",
      content: { "application/json": { schema: ErrorResponse } },
    },
    403: {
      description: "Forbidden — authenticated but not allowed to access this resource",
      content: { "application/json": { schema: ErrorResponse } },
    },
  };
}

const bearer = [{ bearerAuth: [] }];
const uidPath = z.object({ uid: Uuid });
const friendshipPath = z.object({ uid: Uuid, friendUid: Uuid });

// ─── Auth routes ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/auth/otp/send",
  tags: ["Auth"],
  summary: "Send OTP",
  description: "Sends a 6-digit one-time code to the given email. Creates the Supabase auth user if they do not exist.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: MagicLinkSendBody } },
    },
  },
  responses: {
    200: {
      description: "OTP sent",
      content: { "application/json": { schema: MagicLinkSendResponse } },
    },
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/otp/verify",
  tags: ["Auth"],
  summary: "Verify OTP code",
  description: "Verifies the 6-digit OTP code and returns access + refresh tokens.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: MagicLinkVerifyBody } },
    },
  },
  responses: {
    200: {
      description: "Verified — session created",
      content: { "application/json": { schema: MagicLinkVerifyResponse } },
    },
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  summary: "Logout",
  security: bearer,
  responses: {
    200: {
      description: "Logged out",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/me",
  tags: ["Auth"],
  summary: "Get current user",
  description: "Returns the authenticated user and their profile row, if created.",
  security: bearer,
  responses: {
    200: {
      description: "Current user",
      content: { "application/json": { schema: MeResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── Bridge routes ────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/chat/session",
  tags: ["Bridge"],
  summary: "Create bridge session",
  description:
    "Exchanges the caller's Bearer token + refresh token for an opaque sessionId. " +
    "The sessionId is safe to hand to OpenClaw — it never exposes the raw tokens. " +
    "Use bridgeApiFetch(sessionId, path) on the server to call any auth-gated endpoint on behalf of this user.",
  security: bearer,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: ChatSessionCreateBody } },
    },
  },
  responses: {
    200: {
      description: "Session created",
      content: { "application/json": { schema: ChatSessionCreateResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/chat/session/{id}",
  tags: ["Bridge"],
  summary: "Revoke bridge session",
  description: "Permanently revokes the session. Subsequent bridgeApiFetch calls with this sessionId will throw BridgeSessionError(\"not_found\"). Only the session owner can revoke.",
  security: bearer,
  request: {
    params: z.object({ id: Uuid }),
  },
  responses: {
    200: {
      description: "Session revoked",
      content: { "application/json": { schema: ChatSessionRevokeResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── User routes ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/users",
  tags: ["Users"],
  summary: "Create user profile",
  description: "Creates the profile row linked to the authenticated user's identity. Call once after first verify.",
  security: bearer,
  request: {
    body: {
      content: { "application/json": { schema: CreateUserBody } },
      required: true,
    },
  },
  responses: {
    201: {
      description: "User created",
      content: { "application/json": { schema: CreateUserResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{uid}/wallet",
  tags: ["Users"],
  summary: "Get wallet balances",
  description: "Returns MON balance for the authenticated user. uid must match the caller.",
  security: bearer,
  request: { params: uidPath },
  responses: {
    200: {
      description: "Wallet balances",
      content: { "application/json": { schema: WalletResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── Friendship routes ────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/users/{uid}/friendships",
  tags: ["Friendships"],
  summary: "Create friendship",
  description: "uid must match the authenticated user.",
  security: bearer,
  request: {
    params: uidPath,
    body: {
      required: true,
      content: {
        "application/json": { schema: z.object({ friendUid: Uuid }) },
      },
    },
  },
  responses: {
    201: {
      description: "Friendship created",
      content: { "application/json": { schema: FriendshipResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{uid}/friendships",
  tags: ["Friendships"],
  summary: "List friendships",
  description: "uid must match the authenticated user.",
  security: bearer,
  request: {
    params: uidPath,
    query: z.object({
      username: z.string().optional(),
      phoneNumber: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: "Friendship list",
      content: { "application/json": { schema: ListFriendshipsResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/users/{uid}/friendships/{friendUid}",
  tags: ["Friendships"],
  summary: "Delete friendship",
  description: "uid must match the authenticated user.",
  security: bearer,
  request: { params: friendshipPath },
  responses: {
    200: {
      description: "Friendship deleted",
      content: { "application/json": { schema: FriendshipResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── Request routes ───────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/requests",
  tags: ["Requests"],
  summary: "Create request",
  description: "sender must match the authenticated user.",
  security: bearer,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateRequestBody } },
    },
  },
  responses: {
    201: {
      description: "Request created",
      content: { "application/json": { schema: CreateRequestResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/requests",
  tags: ["Requests"],
  summary: "List requests",
  description: "Results are scoped to requests where the authenticated user is sender or receiver.",
  security: bearer,
  request: {
    query: z.object({
      sender: Uuid.optional(),
      receiver: Uuid.optional(),
      status: RequestStatus.optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: "Request list",
      content: { "application/json": { schema: ListRequestsResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/requests/{uid}",
  tags: ["Requests"],
  summary: "Get request by uid",
  description: "Authenticated user must be the sender or receiver.",
  security: bearer,
  request: { params: uidPath },
  responses: {
    200: {
      description: "Request",
      content: { "application/json": { schema: RequestObject } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/requests/{uid}",
  tags: ["Requests"],
  summary: "Update request status",
  description: "Authenticated user must be the sender or receiver.",
  security: bearer,
  request: {
    params: uidPath,
    body: {
      required: true,
      content: { "application/json": { schema: PatchRequestBody } },
    },
  },
  responses: {
    200: {
      description: "Updated request",
      content: { "application/json": { schema: RequestObject } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── Trade routes ─────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/trades/execute",
  tags: ["Trades"],
  summary: "Execute trade (stub)",
  description: "Stub endpoint. Validates input and returns a non-settling response.",
  security: bearer,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: ExecuteTradeBody } },
    },
  },
  responses: {
    200: {
      description: "Trade execution response",
      content: { "application/json": { schema: ExecuteTradeResponse } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── Transaction routes ───────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/public-transaction/execute",
  tags: ["Transactions"],
  summary: "Execute public transaction",
  description: "sender must match the authenticated user.",
  security: bearer,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: PublicTransactionExecuteBody } },
    },
  },
  responses: {
    200: {
      description: "Public transaction execution response",
      content: {
        "application/json": { schema: PublicTransactionExecuteResponse },
      },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/private-transactions/execute",
  tags: ["Transactions"],
  summary: "Execute private transaction",
  description: "sender must match the authenticated user.",
  security: bearer,
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: PrivateTransactionExecuteBody },
      },
    },
  },
  responses: {
    200: {
      description: "Private transaction execution response",
      content: {
        "application/json": { schema: PrivateTransactionExecuteResponse },
      },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/private-transactions",
  tags: ["Transactions"],
  summary: "List private transactions",
  description: "Results are scoped to transactions where the authenticated user is sender or receiver.",
  security: bearer,
  request: {
    query: z.object({
      sender: Uuid.optional(),
      receiver: Uuid.optional(),
      status: ExecutionStatus.optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: "Private transaction list",
      content: {
        "application/json": { schema: PrivateTransactionsListResponse },
      },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/private-transactions/{uid}",
  tags: ["Transactions"],
  summary: "Get private transaction",
  description: "Authenticated user must be the sender or receiver.",
  security: bearer,
  request: { params: uidPath },
  responses: {
    200: {
      description: "Private transaction",
      content: { "application/json": { schema: PrivateTransaction } },
    },
    ...authErrorResponses(),
    ...standardErrorResponses(),
  },
});

// ─── Generator ────────────────────────────────────────────────────────────────

const generator = new OpenApiGeneratorV31(registry.definitions);

export function getOpenApiDocument() {
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Monad Hack 26 API",
      version: "0.1.0",
      description: "Next.js App Router backend API powered by Supabase.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Auth" },
      { name: "Bridge" },
      { name: "Users" },
      { name: "Friendships" },
      { name: "Requests" },
      { name: "Trades" },
      { name: "Transactions" },
    ],
  });
}
