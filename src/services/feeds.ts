import api from "@/lib/api";
import type { Paginated, PublicPostWithMeta } from "@/services/posts";

export async function listMyFollowingFeed(params?: {
  page?: number;
  limit?: number;
  includeSelf?: boolean; 
}): Promise<Paginated<PublicPostWithMeta>> {
  const { page = 1, limit = 10, includeSelf } = params ?? {};
  const { data } = await api.get<Paginated<PublicPostWithMeta>>(`/read/feeds`, {
    params: { page, limit, includeSelf },
  });
  return data;
}

export async function listFollowingFeedOfUser(params: {
  userId: string;
  page?: number;
  limit?: number;
  includeSelf?: boolean;
}): Promise<Paginated<PublicPostWithMeta>> {
  const { userId, page = 1, limit = 10, includeSelf } = params;
  const { data } = await api.get<Paginated<PublicPostWithMeta>>(
    `/read/feeds/${userId}`,
    { params: { page, limit, includeSelf } }
  );
  return data;
}
