import api from "@/lib/api";

export type PublicUser = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  followersCount: number;
  followingCount: number;
  isFollowedByMe?: boolean;
  bio?: string | null;
};

export async function getMe() {
  const { data } = await api.get<PublicUser>("/users/me");
  return data;
}

type ReadUserResponse = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  followerCount: number;
  followingCount: number;
  isFollowedByMe?: boolean;
  bio?: string | null;
};

export async function getUserById(userId: string) {
  const { data } = await api.get<ReadUserResponse>(`/read/users/${userId}`);
  return {
    id: data.id,
    username: data.username,
    avatarUrl: data.avatarUrl ?? null,
    followersCount: data.followerCount ?? 0,
    followingCount: data.followingCount ?? 0,
    isFollowedByMe: data.isFollowedByMe,
    bio: data.bio ?? null,
  } satisfies PublicUser;
}

export type UpdateMeInput = {
  avatarUrl?: string | null;
  bio?: string;
};

export async function updateMe(input: UpdateMeInput) {
  const { data } = await api.patch<PublicUser>("/users/me", input);
  return data;
}
