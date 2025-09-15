import { configureStore } from "@reduxjs/toolkit";
import auth from "@/features/auth/authSlice";
import posts from "@/features/posts/postSlice";
import comments from "@/features/comments/commentSlice";
import { setAccessToken } from "@/lib/token";

export const store = configureStore({
  reducer: { auth, posts, comments },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

let last: string | null = null;
store.subscribe(() => {
  const t = store.getState().auth.accessToken ?? null;
  if (t !== last) {
    setAccessToken(t);
    last = t;
  }
});
