import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TECHNICIAN" | "CUSTOMER";

interface AuthUser {
  token: string;
  email: string;
  role: UserRole;
  fullName: string;
  tenantCode: string;
  tenantName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthUser) => void;
  logout: () => void;
  updateProfile: (firstName: string, lastName: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token      = localStorage.getItem("token");
    const email      = localStorage.getItem("email");
    const role       = localStorage.getItem("role") as UserRole | null;
    const fullName   = localStorage.getItem("fullName") ?? "";
    const tenantCode = localStorage.getItem("tenantCode") ?? "";
    const tenantName = localStorage.getItem("tenantName") ?? "";
    if (token && email && role) return { token, email, role, fullName, tenantCode, tenantName };
    return null;
  });

  const login = (data: AuthUser) => {
    localStorage.setItem("token",      data.token);
    localStorage.setItem("email",      data.email);
    localStorage.setItem("role",       data.role);
    localStorage.setItem("fullName",   data.fullName);
    localStorage.setItem("tenantCode", data.tenantCode);
    localStorage.setItem("tenantName", data.tenantName);
    setUser(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateProfile = (firstName: string, lastName: string) => {
    const fullName = `${firstName} ${lastName}`.trim();
    localStorage.setItem("fullName", fullName);
    setUser(prev => prev ? { ...prev, fullName } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
