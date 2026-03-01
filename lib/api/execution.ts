import { parsePositiveAmount } from "@/lib/api/requests";

export const EXECUTION_STATUSES = ["pending", "success", "failure"] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

type BaseExecutionBody = {
  sender?: string;
  receiver?: string;
  user1?: string;
  user2?: string;
  status?: string;
};

type PublicExecutionBody = BaseExecutionBody & {
  amount?: number | string;
  message?: string | null;
};

type PrivateExecutionBody = BaseExecutionBody & {
  ciphertext?: string;
  payloadCiphertext?: string;
  nonce?: string;
  payloadNonce?: string;
  senderPublicKeyUsed?: string;
  senderPubkeyUsed?: string;
};

export type PublicExecutionRequest = {
  sender: string;
  receiver: string;
  amount: string;
  message: string | null;
  status: ExecutionStatus;
};

export type PrivateExecutionRequest = {
  sender: string;
  receiver: string;
  ciphertext: string;
  nonce: string;
  senderPublicKeyUsed: string;
  status: ExecutionStatus;
};

export function isExecutionStatus(value: unknown): value is ExecutionStatus {
  return (
    typeof value === "string" &&
    (EXECUTION_STATUSES as readonly string[]).includes(value)
  );
}

export function buildPublicExecutionRequest(body: PublicExecutionBody): {
  data?: PublicExecutionRequest;
  error?: string;
} {
  const sender = normalizeParty(body.sender ?? body.user1);
  const receiver = normalizeParty(body.receiver ?? body.user2);
  const amount = parsePositiveAmount(body.amount);
  const status = normalizeStatus(body.status);
  const message = normalizeOptionalString(body.message);

  if (!sender || !receiver || !amount) {
    return { error: "sender, receiver and amount are required." };
  }

  if (sender === receiver) {
    return { error: "sender and receiver must be different users." };
  }

  if (!status) {
    return {
      error: "status must be one of: pending, success, failure.",
    };
  }

  return {
    data: {
      sender,
      receiver,
      amount,
      message,
      status,
    },
  };
}

export function buildPrivateExecutionRequest(body: PrivateExecutionBody): {
  data?: PrivateExecutionRequest;
  error?: string;
} {
  const sender = normalizeParty(body.sender ?? body.user1);
  const receiver = normalizeParty(body.receiver ?? body.user2);
  const status = normalizeStatus(body.status);
  const ciphertext = normalizeNonEmptyString(
    body.ciphertext ?? body.payloadCiphertext,
  );
  const nonce = normalizeNonEmptyString(body.nonce ?? body.payloadNonce);
  const senderPublicKeyUsed = normalizeNonEmptyString(
    body.senderPublicKeyUsed ?? body.senderPubkeyUsed,
  );

  if (!sender || !receiver || !ciphertext || !nonce || !senderPublicKeyUsed) {
    return {
      error:
        "sender, receiver, ciphertext, nonce and senderPublicKeyUsed are required.",
    };
  }

  if (sender === receiver) {
    return { error: "sender and receiver must be different users." };
  }

  if (!status) {
    return {
      error: "status must be one of: pending, success, failure.",
    };
  }

  return {
    data: {
      sender,
      receiver,
      ciphertext,
      nonce,
      senderPublicKeyUsed,
      status,
    },
  };
}

function normalizeParty(value: unknown) {
  return normalizeNonEmptyString(value);
}

function normalizeOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeStatus(value: unknown): ExecutionStatus | null {
  if (value === undefined || value === null) {
    return "success";
  }

  if (!isExecutionStatus(value)) {
    return null;
  }

  return value;
}

function normalizeNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export type PrivateTransactionRow = {
  uid: string;
  sender: string;
  receiver: string;
  ciphertext: string;
  nonce: string;
  sender_pubkey_used: string;
  ts: string;
  status: ExecutionStatus;
};

export function toPrivateTxResponse(row: PrivateTransactionRow) {
  return {
    uid: row.uid,
    sender: row.sender,
    receiver: row.receiver,
    ciphertext: row.ciphertext,
    nonce: row.nonce,
    senderPublicKeyUsed: row.sender_pubkey_used,
    timestamp: row.ts,
    status: row.status,
  };
}
