import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import api from "@/lib/api";
import { setCredentials } from "@/features/auth/authSlice";

export default function AuthBootstrap() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const dispatch = useAppDispatch();
  const attempted = useRef(false);

  useEffect(() => {
    if (token) return;         
    if (attempted.current) return; 
    attempted.current = true;

    (async () => {
      try {
        const { data } = await api.post("/auth/refresh-token");
        if (data?.user && data?.accessToken) {
          dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        }
      } catch {
      }
    })();
  }, [token, dispatch]);

  return null;
}
