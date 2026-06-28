import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { api, saveToken, clearToken } from "./api";

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarColor: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync("auth_token");
      if (t) {
        try {
          const res = await api.get("/api/auth/me");
          setUser(res.data);
          setToken(t);
        } catch {
          await clearToken();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post("/api/auth/login", { username, password });
    await saveToken(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (username: string, email: string, password: string, displayName: string) => {
    const res = await api.post("/api/auth/register", { username, email, password, displayName });
    await saveToken(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
