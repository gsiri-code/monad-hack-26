import apiClient from "@/lib/api/client";
import type {
  ListPrivateTransactionsParams,
  PrivateTransaction,
  PrivateTransactionExecuteBody,
  PrivateTransactionExecuteResponse,
  PrivateTransactionsListResponse,
  PublicTransactionExecuteBody,
  PublicTransactionExecuteResponse,
} from "@/types/api";

export async function executePublicTx(body: PublicTransactionExecuteBody) {
  const { data } = await apiClient.post<PublicTransactionExecuteResponse>(
    "/public-transaction/execute",
    body,
  );
  return data;
}

export async function executePrivateTx(body: PrivateTransactionExecuteBody) {
  const { data } = await apiClient.post<PrivateTransactionExecuteResponse>(
    "/private-transactions/execute",
    body,
  );
  return data;
}

export async function listPrivateTxs(
  params?: ListPrivateTransactionsParams,
) {
  const { data } = await apiClient.get<PrivateTransactionsListResponse>(
    "/private-transactions",
    { params },
  );
  return data;
}

export async function getPrivateTx(uid: string) {
  const { data } = await apiClient.get<PrivateTransaction>(
    `/private-transactions/${uid}`,
  );
  return data;
}
