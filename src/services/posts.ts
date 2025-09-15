import api from '@/lib/api';
import type { PublicPostAuthor } from '@/types/search';
import { getUserById } from './users';

export type PublicPost = {
  id: string;
  authorId: string;
  author?: PublicPostAuthor;
  title?: string;
  content?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type PublicPostWithMeta = PublicPost & {
  likeCount: number;
  likedByMe: boolean;
  favoriteCount: number;
  favoritedByMe: boolean;
};

export type Paginated<Item> = {
  data: Item[];
  page: number;
  limit: number;
  total: number;
};

const authorCache = new Map<string, PublicPostAuthor>();

async function hydratePostAuthors<T extends PublicPostWithMeta[]>(arr: T): Promise<T> {
  const missingIds = Array.from(
    new Set(
      arr
        .filter((p) => !p.author && p.authorId)
        .map((p) => p.authorId)
    )
  );

  await Promise.all(
    missingIds.map(async (id) => {
      if (authorCache.has(id)) return;
      try {
        const u = await getUserById(id);
        authorCache.set(id, { id: u.id, username: u.username, avatarUrl: u.avatarUrl ?? null });
      } catch {
      }
    })
  );

  arr.forEach((p) => {
    if (!p.author && authorCache.has(p.authorId)) {
      p.author = authorCache.get(p.authorId)!;
    }
  });

  return arr;
}

export async function listFeed(params?: { page?: number; limit?: number; authorId?: string }) {
  const { data } = await api.get<Paginated<PublicPostWithMeta>>('/read/posts', { params });
  return data;
}

export async function getPost(postId: string) {
  const { data } = await api.get<PublicPostWithMeta>(`/read/posts/${postId}`);
  return data;
}
