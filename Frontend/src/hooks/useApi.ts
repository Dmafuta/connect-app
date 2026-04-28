import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.VITE_API_URL;

export function useApi() {
  const { logout, setAccessToken } = useAuth();

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
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setAccessToken(data.token, data.refreshToken);
            return request<T>(path, options, true);
          }
        } catch {
          // refresh request itself failed — fall through to logout
        }
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
