import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { PublicCommentWithMeta } from "@/services/comments";

type CommentsKey = `comments:post=${string}`;
const makeKey = (postId: string): CommentsKey => `comments:post=${postId}`;

const adapter = createEntityAdapter<PublicCommentWithMeta>();
type Meta = { page: number; limit: number; total: number };

type CommentsState = ReturnType<typeof adapter.getInitialState> & {
  listsByKey: Record<string, string[]>;
  metaByKey: Record<string, Meta>;
};

const initialState: CommentsState = adapter.getInitialState({
  listsByKey: {},
  metaByKey: {},
});

function dedupeConcat(base: string[], add: string[]) {
  const set = new Set(base);
  return [...base, ...add.filter((id) => !set.has(id))];
}

const slice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    upsertMany: (state, action: PayloadAction<PublicCommentWithMeta[]>) => {
      adapter.upsertMany(state, action.payload);
    },
    upsertOne: (state, action: PayloadAction<PublicCommentWithMeta>) => {
      adapter.upsertOne(state, action.payload);
    },
    removeOne: (state, action: PayloadAction<string>) => {
      adapter.removeOne(state, action.payload);
      for (const key of Object.keys(state.listsByKey)) {
        state.listsByKey[key] = (state.listsByKey[key] ?? []).filter(
          (id) => id !== action.payload
        );
      }
    },
    setListForPost: (
      state,
      action: PayloadAction<{ postId: string; ids: string[] }>
    ) => {
      const key = makeKey(action.payload.postId);
      state.listsByKey[key] = [...action.payload.ids];
    },
    appendToListForPost: (
      state,
      action: PayloadAction<{ postId: string; ids: string[] }>
    ) => {
      const key = makeKey(action.payload.postId);
      const prev = state.listsByKey[key] ?? [];
      state.listsByKey[key] = dedupeConcat(prev, action.payload.ids);
    },
    setMetaForPost: (
      state,
      action: PayloadAction<{ postId: string } & Meta>
    ) => {
      const key = makeKey(action.payload.postId);
      state.metaByKey[key] = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
      };
    },
    resetForPost: (state, action: PayloadAction<{ postId: string }>) => {
      const key = makeKey(action.payload.postId);
      delete state.listsByKey[key];
      delete state.metaByKey[key];
    },
  },
});

export const {
  upsertMany,
  upsertOne,
  removeOne,
  setListForPost,
  appendToListForPost,
  setMetaForPost,
  resetForPost,
} = slice.actions;

export default slice.reducer;

const baseSel = adapter.getSelectors<RootState>((s) => s.comments);

export const selectCommentById = baseSel.selectById;

export const makeSelectCommentsByPost = (postId: string) =>
  createSelector(
    (s: RootState) => s.comments.entities,
    (s: RootState) => s.comments.listsByKey[`comments:post=${postId}`] ?? [],
    (entities, ids: string[]) =>
      ids
        .map((id) => entities[id])
        .filter((c): c is PublicCommentWithMeta => Boolean(c))
  );

export const selectMetaByPost = (state: RootState, postId: string): Meta =>
  state.comments.metaByKey[`comments:post=${postId}`] ?? {
    page: 0,
    limit: 10,
    total: 0,
  };
