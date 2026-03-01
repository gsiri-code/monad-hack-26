import apiClient from "@/lib/api/client";
import type {
  MagicLinkSendBody,
  MagicLinkSendResponse,
  MagicLinkVerifyBody,
  MagicLinkVerifyResponse,
  MeResponse,
} from "@/types/api";

export async function sendOtp(email: string) {
  const { data } = await apiClient.post<MagicLinkSendResponse>(
    "/auth/magic/send",
    { email } satisfies MagicLinkSendBody,
  );
  return data;
}

export async function verifyOtp(email: string, code: string) {
  const { data } = await apiClient.post<MagicLinkVerifyResponse>(
    "/auth/magic/verify",
    { email, code } satisfies MagicLinkVerifyBody,
  );
  return data;
}

export async function logout() {
  const { data } = await apiClient.post<{ message: string }>("/auth/logout");
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}
