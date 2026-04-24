import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.VITE_API_URL;

export function useApi() {
  const { user, logout } = useAuth();

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
        ...options.headers,
      },
    });
    if (res.status === 401) { logout(); throw new Error("Session expired"); }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP ${res.status}`);
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
