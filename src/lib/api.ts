import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, notifyAuthFailed, setAccessToken } from "@/lib/token";

function setAuthHeader(cfg: InternalAxiosRequestConfig, token: string) {
  if (!token) return cfg;

  if (!cfg.headers) {
    cfg.headers = new AxiosHeaders();
  }
  if (cfg.headers instanceof AxiosHeaders) {
    cfg.headers.set("Authorization", `Bearer ${token}`);
  } else {
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return cfg;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
});

api.interceptors.request.use((config) => {
  const t = getAccessToken();
  if (t) setAuthHeader(config, t);
  return config;
});

let refreshing = false;
let queue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  queue.forEach((fn) => fn(t));
  queue = [];
};

const REFRESHABLE = new Set(["ACCESS_TOKEN_EXPIRED", "INVALID_ACCESS_TOKEN"]);
const HARD_LOGOUT = new Set([
  "INVALID_REFRESH_TOKEN",
  "REFRESH_REUSE_DETECTED",
  "SESSION_NOT_FOUND",
  "UNAUTHORIZED",
]);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (!response || !config) return Promise.reject(error);

    const status = response.status;
    const code = response.data?.code as string | undefined;
    const url = config.url ?? "";

    const isAuthPath =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/logout");

    if (status !== 401 || isAuthPath || config._retry) {
      return Promise.reject(error);
    }

    if (code && HARD_LOGOUT.has(code)) {
      setAccessToken(null);
      notifyAuthFailed();
      return Promise.reject(error);
    }

    if (!code || !REFRESHABLE.has(code)) {
      notifyAuthFailed();
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      if (refreshing) {
        const newToken = await new Promise<string | null>((resolve) =>
          queue.push(resolve)
        );
        if (newToken)
          setAuthHeader(config as InternalAxiosRequestConfig, newToken);
        return api(config);
      }

      refreshing = true;
      const { data } = await api.post("/auth/refresh-token");
      const newAccessToken: string = data.accessToken;

      setAccessToken(newAccessToken);
      refreshing = false;
      flush(newAccessToken);

      setAuthHeader(config as InternalAxiosRequestConfig, newAccessToken);
      return api(config);
    } catch (e) {
      refreshing = false;
      flush(null);
      setAccessToken(null);
      notifyAuthFailed();
      return Promise.reject(e);
    }
  }
);

export default api;
