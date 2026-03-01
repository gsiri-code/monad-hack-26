import apiClient from "@/lib/api/client";
import type {
  CreateRequestBody,
  CreateRequestResponse,
  ListRequestsParams,
  ListRequestsResponse,
  PatchRequestBody,
  PaymentRequest,
} from "@/types/api";

export async function createRequest(body: CreateRequestBody) {
  const { data } = await apiClient.post<CreateRequestResponse>(
    "/requests",
    body,
  );
  return data;
}

export async function listRequests(params?: ListRequestsParams) {
  const { data } = await apiClient.get<ListRequestsResponse>("/requests", {
    params,
  });
  return data;
}

export async function getRequest(uid: string) {
  const { data } = await apiClient.get<PaymentRequest>(`/requests/${uid}`);
  return data;
}

export async function updateRequestStatus(
  uid: string,
  body: PatchRequestBody,
) {
  const { data } = await apiClient.patch<PaymentRequest>(
    `/requests/${uid}`,
    body,
  );
  return data;
}
