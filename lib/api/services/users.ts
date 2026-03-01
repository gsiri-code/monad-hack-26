import apiClient from "@/lib/api/client";
import type {
  CreateUserBody,
  CreateUserResponse,
  WalletResponse,
} from "@/types/api";

export async function createProfile(body: CreateUserBody) {
  const { data } = await apiClient.post<CreateUserResponse>("/users", body);
  return data;
}

export async function getWallet(uid: string) {
  const { data } = await apiClient.get<WalletResponse>(
    `/users/${uid}/wallet`,
  );
  return data;
}
