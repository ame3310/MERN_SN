let accessToken: string | null = null;
let onAuthFailed: (() => void) | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

export const setOnAuthFailed = (cb: () => void) => {
  onAuthFailed = cb;
};
export const notifyAuthFailed = () => {
  onAuthFailed?.();
};