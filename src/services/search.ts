import api from "@/lib/api";
import type { PublicUserForSearch, PublicPost } from "@/types/search";

export type PageMeta = { page: number; limit: number; total: number };
export type SearchType = "all" | "users" | "posts";

export type SearchAllResponse = {
  users?: { data: PublicUserForSearch[] } & PageMeta;
  posts?: { data: PublicPost[] } & PageMeta;
};

export async function searchAll(opts: {
  q: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get<SearchAllResponse>("/read/search", {
    params: opts,
  });
  return data;
}

export async function searchUsers(opts: {
  q: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get<SearchAllResponse>("/read/search", {
    params: { ...opts, type: "users" },
  });
  return data.users ?? { data: [], page: 1, limit: 20, total: 0 };
}

export async function searchPosts(opts: {
  q: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get<SearchAllResponse>("/read/search", {
    params: { ...opts, type: "posts" },
  });
  return data.posts ?? { data: [], page: 1, limit: 20, total: 0 };
}
