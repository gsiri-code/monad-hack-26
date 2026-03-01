import apiClient from "@/lib/api/client";
import type { ExecuteTradeBody, ExecuteTradeResponse } from "@/types/api";

export async function executeTrade(body: ExecuteTradeBody) {
  const { data } = await apiClient.post<ExecuteTradeResponse>(
    "/trades/execute",
    body,
  );
  return data;
}
