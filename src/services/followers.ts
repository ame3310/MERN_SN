import api from "@/lib/api";

export async function follow(userId: string) {
  await api.post(`/followers`, { followeeId: userId });
}
export async function unfollow(userId: string) {
  await api.delete(`/followers`, { data: { followeeId: userId } });
}

export type PublicUserBasic = {
  id: string;
  username: string;
  avatarUrl?: string;
  isFollowedByMe?: boolean;
  followedAt?: string;  
};
export type Paginated<T> = { data: T[]; page: number; limit: number; total: number };
export async function listFollowers(params: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<PublicUserBasic>> {
  const { userId, page = 1, limit = 10 } = params;
  const { data } = await api.get<Paginated<PublicUserBasic>>(
    `/read/followers/${userId}/followers`,
    { params: { page, limit } }
  );
  return data;
}

export async function listFollowing(params: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<PublicUserBasic>> {
  const { userId, page = 1, limit = 10 } = params;
  const { data } = await api.get<Paginated<PublicUserBasic>>(
    `/read/followers/${userId}/following`,
    { params: { page, limit } }
  );
  return data;
}
