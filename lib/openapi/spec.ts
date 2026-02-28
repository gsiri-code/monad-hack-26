import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

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
    email: z.string().email().optional(),
    password: z.string().min(8),
  }),
);

const CreateUserResponse = registry.register(
  "CreateUserResponse",
  z.object({ user: UserObject }),
);

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

const uidPath = z.object({ uid: Uuid });
const friendshipPath = z.object({ uid: Uuid, friendUid: Uuid });

registry.registerPath({
  method: "post",
  path: "/api/users",
  tags: ["Users"],
  summary: "Create user",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{uid}/wallet",
  tags: ["Users"],
  summary: "Get wallet balances for user",
  request: { params: uidPath },
  responses: {
    200: {
      description: "Wallet balances",
      content: { "application/json": { schema: WalletResponse } },
    },
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/users/{uid}/friendships",
  tags: ["Friendships"],
  summary: "Create friendship",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{uid}/friendships",
  tags: ["Friendships"],
  summary: "List friendships for user",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/users/{uid}/friendships/{friendUid}",
  tags: ["Friendships"],
  summary: "Delete friendship",
  request: { params: friendshipPath },
  responses: {
    200: {
      description: "Friendship deleted",
      content: { "application/json": { schema: FriendshipResponse } },
    },
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/requests",
  tags: ["Requests"],
  summary: "Create request",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/requests",
  tags: ["Requests"],
  summary: "List requests",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/requests/{uid}",
  tags: ["Requests"],
  summary: "Get request by uid",
  request: { params: uidPath },
  responses: {
    200: {
      description: "Request",
      content: { "application/json": { schema: RequestObject } },
    },
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/requests/{uid}",
  tags: ["Requests"],
  summary: "Update request status",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/trades/execute",
  tags: ["Trades"],
  summary: "Execute trade (stub)",
  description:
    "Stub endpoint. Validates input and returns a non-settling response.",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/public-transaction/execute",
  tags: ["Transactions"],
  summary: "Execute public transaction",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/private-transactions/execute",
  tags: ["Transactions"],
  summary: "Execute private transaction",
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/private-transactions",
  tags: ["Transactions"],
  summary: "List private transactions",
  description:
    "At least one of sender, receiver, or user is required by runtime validation.",
  request: {
    query: z.object({
      sender: Uuid.optional(),
      receiver: Uuid.optional(),
      user: Uuid.optional(),
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
    ...standardErrorResponses(),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/private-transactions/{uid}",
  tags: ["Transactions"],
  summary: "Get private transaction",
  request: {
    params: uidPath,
    query: z.object({
      user: Uuid.optional(),
    }),
  },
  responses: {
    200: {
      description: "Private transaction",
      content: { "application/json": { schema: PrivateTransaction } },
    },
    ...standardErrorResponses(),
  },
});

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
      { name: "Users" },
      { name: "Friendships" },
      { name: "Requests" },
      { name: "Trades" },
      { name: "Transactions" },
    ],
  });
}
