import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Exported for direct unit testing (see client.test.ts) — a 401 means
 * "session expired" everywhere except the login endpoint itself, where it
 * means "wrong password" and must NOT trigger a redirect that would swallow
 * the error message before the user sees it. */
export function isSessionExpiredError(status: number | undefined, requestUrl: string | undefined): boolean {
  return status === 401 && requestUrl !== "/auth/login";
}

// A 401 on any authenticated request means the token is missing/expired/
// invalid — clear the stale session and send the user back to log in,
// rather than leaving them stuck on a page where every action silently
// fails.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionExpiredError(error.response?.status, error.config?.url)) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
