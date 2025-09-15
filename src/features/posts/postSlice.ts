import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PublicPostWithMeta } from "@/services/posts";
import type { RootState } from "@/app/store";

export type FeedKey =
  | `feed:all`
  | `feed:author=${string}`
  | `feed:favorites=${string}`
  | `feed:following=${string}`;

export const makeFeedKey = (opts?: { authorId?: string }): FeedKey =>
  opts?.authorId ? (`feed:author=${opts.authorId}` as const) : "feed:all";

export const makeFavoritesKey = (userId: string): FeedKey =>
  `feed:favorites=${userId}` as const;

export const makeFollowingKey = (userId: string): FeedKey =>
  `feed:following=${userId}` as const;

const adapter = createEntityAdapter<PublicPostWithMeta>();

type Meta = { page: number; limit: number; total: number };

type PostsState = ReturnType<typeof adapter.getInitialState> & {
  listsByKey: Record<string, string[]>;
  metaByKey: Record<string, Meta>;
};

const initialState: PostsState = adapter.getInitialState({
  listsByKey: {},
  metaByKey: {},
});

function dedupeConcat(base: string[], add: string[]) {
  const set = new Set(base);
  return [...base, ...add.filter((id) => !set.has(id))];
}

const slice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    upsertMany: (state, action: PayloadAction<PublicPostWithMeta[]>) => {
      adapter.upsertMany(state, action.payload);
    },
    upsertOne: (state, action: PayloadAction<PublicPostWithMeta>) => {
      adapter.upsertOne(state, action.payload);
    },
    setListForKey: (
      state,
      action: PayloadAction<{ key: FeedKey; ids: string[] }>
    ) => {
      state.listsByKey[action.payload.key] = [...action.payload.ids];
    },
    appendToList: (
      state,
      action: PayloadAction<{ key: FeedKey; ids: string[] }>
    ) => {
      const key = action.payload.key;
      const prev = state.listsByKey[key] ?? [];
      state.listsByKey[key] = dedupeConcat(prev, action.payload.ids);
    },
    setMetaForKey: (state, action: PayloadAction<{ key: FeedKey } & Meta>) => {
      const { key, page, limit, total } = action.payload;
      state.metaByKey[key] = { page, limit, total };
    },
    resetList: (state, action: PayloadAction<{ key: FeedKey }>) => {
      delete state.listsByKey[action.payload.key];
      delete state.metaByKey[action.payload.key];
    },
    resetAll: (state) => {
      state.listsByKey = {};
      state.metaByKey = {};
    },
  },
});

export const {
  upsertMany,
  upsertOne,
  setListForKey,
  appendToList,
  setMetaForKey,
  resetList,
  resetAll,
} = slice.actions;

export default slice.reducer;

const baseSel = adapter.getSelectors<RootState>((s) => s.posts);
export const selectPostById = baseSel.selectById;

export const selectListIdsByKey = (state: RootState, key: FeedKey): string[] =>
  state.posts.listsByKey[key] ?? [];

export const makeSelectListByKey = (key: FeedKey) =>
  createSelector(
    (s: RootState) => s.posts.entities,
    (s: RootState) => s.posts.listsByKey[key] ?? [],
    (entities, ids: string[]): PublicPostWithMeta[] =>
      ids
        .map((id) => entities[id])
        .filter((p): p is PublicPostWithMeta => Boolean(p))
  );

export const selectMetaByKey = (state: RootState, key: FeedKey): Meta =>
  state.posts.metaByKey[key] ?? { page: 0, limit: 10, total: 0 };
