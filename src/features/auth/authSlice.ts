import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type Role = "user" | "admin";
export type User = { id: string; email: string; username: string; role: Role };

type AuthState = { user: User | null; accessToken: string | null };
const initialState: AuthState = { user: null, accessToken: null };

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      s,
      a: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      s.user = a.payload.user;
      s.accessToken = a.payload.accessToken;
    },
    clearCredentials: (s) => {
      s.user = null;
      s.accessToken = null;
    },
  },
});

export const { setCredentials, clearCredentials } = slice.actions;
export default slice.reducer;
