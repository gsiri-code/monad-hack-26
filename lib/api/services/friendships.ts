import apiClient from "@/lib/api/client";
import type {
  FriendshipResponse,
  ListFriendshipsResponse,
} from "@/types/api";

export async function createFriendship(uid: string, friendUid: string) {
  const { data } = await apiClient.post<FriendshipResponse>(
    `/users/${uid}/friendships`,
    { friendUid },
  );
  return data;
}

export async function listFriendships(
  uid: string,
  params?: { username?: string; phoneNumber?: string; limit?: number },
) {
  const { data } = await apiClient.get<ListFriendshipsResponse>(
    `/users/${uid}/friendships`,
    { params },
  );
  return data;
}

export async function deleteFriendship(uid: string, friendUid: string) {
  const { data } = await apiClient.delete<FriendshipResponse>(
    `/users/${uid}/friendships/${friendUid}`,
  );
  return data;
}
