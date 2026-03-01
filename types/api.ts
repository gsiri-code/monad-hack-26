export interface ErrorResponse {
  error: string;
}

export type RequestStatus =
  | "open"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired";

export type ExecutionStatus = "pending" | "success" | "failure";

// ── Auth ──

export interface MagicLinkSendBody {
  email: string;
}

export interface MagicLinkSendResponse {
  message: string;
}

export interface MagicLinkVerifyBody {
  email: string;
  code: string;
}

export interface MagicLinkVerifyResponse {
  user: {
    id: string;
    email: string | null;
  };
  session: {
    accessToken: string;
    expiresAt: number;
  };
}

export interface MeResponse {
  id: string;
  email: string | null;
  profile: Profile | null;
}

// ── Users ──

export interface Profile {
  uid: string;
  username: string;
  walletAddress: string;
  encryptionPublicKey: string | null;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface User {
  uid: string;
  username: string;
  walletAddress: string;
  encryptionPublicKey: string | null;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface CreateUserBody {
  username: string;
  walletAddress: string;
  encryptionPublicKey?: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserResponse {
  user: User;
}

// ── Wallet ──

export interface WalletBalance {
  currencyName: string;
  amount: string;
}

export interface WalletResponse {
  uid: string;
  wallet: WalletBalance[];
}

// ── Friendships ──

export interface Friendship {
  uid: string;
  userA: string;
  userB: string;
  createdAt: string;
}

export interface FriendshipResponse {
  friendship: Friendship;
}

export interface FriendSummary {
  uid: string;
  username: string;
  walletAddress: string;
  phoneNumber: string;
}

export interface FriendshipListItem {
  uid: string;
  createdAt: string;
  friend: FriendSummary;
}

export interface ListFriendshipsResponse {
  friendships: FriendshipListItem[];
}

// ── Requests ──

export interface PaymentRequest {
  uid: string;
  sender: string;
  receiver: string;
  amount: string;
  timestamp: string;
  status: RequestStatus;
  message: string | null;
}

export interface CreateRequestBody {
  sender?: string;
  receiver?: string;
  user1?: string;
  user2?: string;
  amount: number | string;
  message?: string | null;
}

export interface CreateRequestResponse {
  uid: string;
  time: string;
  status: RequestStatus;
}

export interface ListRequestsResponse {
  requests: PaymentRequest[];
}

export interface PatchRequestBody {
  status: "accepted" | "rejected" | "cancelled";
  message?: string | null;
}

export interface ListRequestsParams {
  sender?: string;
  receiver?: string;
  status?: RequestStatus;
  limit?: number;
}

// ── Trades ──

export interface ExecuteTradeBody {
  requestId?: string;
  requestID?: string;
}

export interface ExecuteTradeResponse {
  uid: string;
  time: string;
  status: "success" | "failure";
  message: string;
}

// ── Transactions ──

export interface PublicTransactionExecuteBody {
  sender?: string;
  receiver?: string;
  user1?: string;
  user2?: string;
  amount: number | string;
  message?: string | null;
  status?: ExecutionStatus;
}

export interface PublicTransactionExecuteResponse {
  uid: string;
  time: string;
  status: ExecutionStatus;
  sender: string;
  receiver: string;
  type: "public";
}

export interface PrivateTransaction {
  uid: string;
  sender: string;
  receiver: string;
  ciphertext: string;
  nonce: string;
  senderPublicKeyUsed: string;
  timestamp: string;
  status: ExecutionStatus;
}

export interface PrivateTransactionsListResponse {
  privateTransactions: PrivateTransaction[];
}

export interface PrivateTransactionExecuteBody {
  sender?: string;
  receiver?: string;
  user1?: string;
  user2?: string;
  ciphertext?: string;
  payloadCiphertext?: string;
  nonce?: string;
  payloadNonce?: string;
  senderPublicKeyUsed?: string;
  senderPubkeyUsed?: string;
  status?: ExecutionStatus;
}

export interface PrivateTransactionExecuteResponse {
  uid: string;
  time: string;
  status: ExecutionStatus;
  sender: string;
  receiver: string;
  type: "private";
}

export interface ListPrivateTransactionsParams {
  sender?: string;
  receiver?: string;
  status?: ExecutionStatus;
  limit?: number;
}
