export type PublicUserForSearch = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type PublicPostAuthor = {
  id: string;
  username: string;
  avatarUrl?: string | null;
};

export type PublicPost = {
  id: string;
  title: string;
  content: string;
  images?: string[];
  createdAt?: string;
  author?: PublicPostAuthor;
};
