"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthSession,
  getAuthSession,
  getTokenExpiresAt,
  isTokenExpired,
  setAuthSession,
} from "@/utils/storage";

const AuthContext = createContext(null);

const normalizeAuthData = (payload = {}) => ({
  token: payload.token || payload.accessToken || null,
  tokenExpiresAt:
    payload.tokenExpiresAt ||
    payload.expiresAt ||
    payload.accessTokenExpiresAt ||
    null,
  user:
    payload.user ||
    payload.profile ||
    (payload._id || payload.email
      ? {
          _id: payload._id || null,
          name: payload.name || "",
          email: payload.email || "",
          role: payload.role || "user",
        }
      : null),
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = window.setTimeout(() => {
      const session = getAuthSession();

      if (session?.token && session?.tokenExpiresAt && !isTokenExpired(session.tokenExpiresAt)) {
        setUser(session.user || null);
        setToken(session.token);
      } else {
        clearAuthSession();
      }

      setIsLoading(false);
    }, 0);

    return () => window.clearTimeout(initializeAuth);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession();
      setUser(null);
      setToken(null);
      router.replace("/auth/login");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [router]);

  useEffect(() => {
    const tokenExpiresAt = getTokenExpiresAt();

    if (!token || !tokenExpiresAt) {
      return undefined;
    }

    const timeoutMs = new Date(tokenExpiresAt).getTime() - Date.now();

    if (timeoutMs <= 0) {
      const immediateLogout = window.setTimeout(() => {
        clearAuthSession();
        setUser(null);
        setToken(null);
        router.replace("/auth/login");
      }, 0);

      return () => window.clearTimeout(immediateLogout);
    }

    const timeoutId = window.setTimeout(() => {
      clearAuthSession();
      setUser(null);
      setToken(null);
      router.replace("/auth/login");
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [router, token]);

  const login = (payload) => {
    const authData = normalizeAuthData(payload);

    setAuthSession(authData);
    setUser(authData.user);
    setToken(authData.token);
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
    router.replace("/auth/login");
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
