import api from "@/lib/api";
import { getUserById } from "@/services/users";

export type CommentAuthor = {
  id: string;
  username: string;
  avatarUrl?: string | null;
};

export type PublicComment = {
  id: string;
  postId: string;
  authorId: string;
  author?: CommentAuthor; 
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicCommentWithMeta = PublicComment & {
  likeCount: number;
  likedByMe: boolean;
};

export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

const authorCache = new Map<string, CommentAuthor>();

async function hydrateAuthors<T extends PublicComment[]>(arr: T): Promise<T> {
  const missing = Array.from(
    new Set(arr.filter((c) => !c.author && c.authorId).map((c) => c.authorId))
  );

  await Promise.all(
    missing.map(async (id) => {
      if (authorCache.has(id)) return;
      try {
        const u = await getUserById(id);
        authorCache.set(id, { id: u.id, username: u.username, avatarUrl: u.avatarUrl ?? null });
      } catch {
      }
    })
  );

  arr.forEach((c) => {
    if (!c.author && authorCache.has(c.authorId)) {
      c.author = authorCache.get(c.authorId)!;
    }
  });

  return arr;
}

type ReadResponse = Paginated<PublicCommentWithMeta> | PublicCommentWithMeta[];

export async function listComments(params: {
  postId: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<PublicCommentWithMeta>> {
  const { postId, page = 1, limit = 10 } = params;

  const { data } = await api.get<ReadResponse>("/read/comments/by-post", {
    params: { postId, page, limit },
  });

  const normalized: Paginated<PublicCommentWithMeta> = Array.isArray(data)
    ? { data, page, limit, total: data.length }
    : data;

  await hydrateAuthors(normalized.data);

  return normalized;
}

export async function createComment(input: {
  postId: string;
  content: string;
}): Promise<PublicCommentWithMeta> {
  const { data } = await api.post<PublicComment>("/comments", input);
  const normalized: PublicCommentWithMeta = {
    ...data,
    likeCount: 0,
    likedByMe: false,
  };

  const [withAuthor] = await hydrateAuthors([normalized]);
  return withAuthor;
}

export async function deleteComment(commentId: string) {
  await api.delete(`/comments/${commentId}`);
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<PublicCommentWithMeta> {
  const { data } = await api.patch<PublicComment>(`/comments/${commentId}`, {
    content,
  });
  const normalized: PublicCommentWithMeta = { ...data, likeCount: 0, likedByMe: false };
  const [withAuthor] = await hydrateAuthors([normalized]);
  return withAuthor;
}
