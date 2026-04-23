import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TECHNICIAN" | "CUSTOMER";

interface AuthUser {
  token: string;
  email: string;
  role: UserRole;
  fullName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token    = localStorage.getItem("token");
    const email    = localStorage.getItem("email");
    const role     = localStorage.getItem("role") as UserRole | null;
    const fullName = localStorage.getItem("fullName") ?? "";
    if (token && email && role) return { token, email, role, fullName };
    return null;
  });

  const login = (data: AuthUser) => {
    localStorage.setItem("token",    data.token);
    localStorage.setItem("email",    data.email);
    localStorage.setItem("role",     data.role);
    localStorage.setItem("fullName", data.fullName);
    setUser(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
