export const REQUEST_STATUSES = [
  "open",
  "accepted",
  "rejected",
  "cancelled",
  "expired",
] as const;

export const REQUEST_PATCH_STATUSES = [
  "accepted",
  "rejected",
  "cancelled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type RequestPatchStatus = (typeof REQUEST_PATCH_STATUSES)[number];

export type RequestRow = {
  uid: string;
  sender: string;
  receiver: string;
  amount: string;
  ts: string;
  status: RequestStatus;
  message: string | null;
};

export function toRequestResponse(row: RequestRow) {
  return {
    uid: row.uid,
    sender: row.sender,
    receiver: row.receiver,
    amount: row.amount,
    timestamp: row.ts,
    status: row.status,
    message: row.message,
  };
}

export function isRequestStatus(value: unknown): value is RequestStatus {
  return (
    typeof value === "string" &&
    (REQUEST_STATUSES as readonly string[]).includes(value)
  );
}

export function isPatchStatus(value: unknown): value is RequestPatchStatus {
  return (
    typeof value === "string" &&
    (REQUEST_PATCH_STATUSES as readonly string[]).includes(value)
  );
}

export function parsePositiveAmount(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return trimmed;
  }

  return null;
}

export function parseLimit(value: string | null, defaultValue = 50) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 200);
}
