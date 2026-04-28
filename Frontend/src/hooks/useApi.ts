import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.VITE_API_URL;

// Module-level mutex: ensures only one token refresh is in flight at a time.
// Concurrent 401s wait for the same refresh promise instead of each triggering
// their own, which would revoke the refresh token mid-flight.
let refreshPromise: Promise<boolean> | null = null;

export function useApi() {
  const { logout, setAccessToken } = useAuth();

  async function doRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.token, data.refreshToken);
        return true;
      }
    } catch {
      // network error
    }
    return false;
  }

  async function request<T>(path: string, options: RequestInit = {}, retrying = false): Promise<T> {
    // Always read token fresh from localStorage so retries after refresh get the new token
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401 && !retrying) {
      // If a refresh is already in progress, wait for it; otherwise start one.
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        return request<T>(path, options, true);
      }
      logout();
      throw new Error("Session expired");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || (err as any).message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    get:    <T>(path: string)                        => request<T>(path),
    post:   <T>(path: string, body: unknown)         => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
    patch:  <T>(path: string, body: unknown)         => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
    del:    <T>(path: string)                        => request<T>(path, { method: "DELETE" }),
  };
}
