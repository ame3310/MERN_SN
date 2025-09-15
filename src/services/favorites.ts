import api from "@/lib/api";
import type { Paginated, PublicPostWithMeta } from "@/services/posts";

export async function favoritePost(postId: string) {
  await api.post("/favorites", { targetId: postId, targetType: "post" });
}

export async function unfavoritePost(postId: string) {
  await api.delete("/favorites", {
    data: { targetId: postId, targetType: "post" },
  });
}

export async function listFavoritePostsOfUser(params: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<PublicPostWithMeta>> {
  const { userId, page = 1, limit = 10 } = params;
  const { data } = await api.get<Paginated<PublicPostWithMeta>>(
    `/read/favorites/${userId}/posts`,
    { params: { page, limit } }
  );
  return data;
}
