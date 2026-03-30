import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/queryClient";
import type { UserRole } from "@shared/schema";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canWrite: boolean;
  canFinance: boolean;
  canAttendance: boolean;
  isAdmin: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'sas_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth/me", {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (username: string, password: string) => {
    const res = await authFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(err.message || "Login failed");
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    const { token: _, ...userData } = data;
    setUser(userData);
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    await authFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const role = user?.role;
  const canWrite = role === "admin" || role === "manager";
  const canFinance = role === "admin" || role === "manager" || role === "accountant";
  const canAttendance = role === "admin" || role === "manager" || role === "coach";
  const isAdmin = role === "admin";
  const isViewer = role === "viewer";

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, canWrite, canFinance, canAttendance, isAdmin, isViewer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
