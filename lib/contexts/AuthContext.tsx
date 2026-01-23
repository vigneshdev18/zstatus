"use client";

import { createContext, useContext, ReactNode } from "react";
import { useApiQuery } from "@/lib/hooks/useApiQuery";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "viewer";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: userData, isLoading } = useApiQuery("/api/auth/me", {
    // Critical config data, should be fetched immediately and kept fresh
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  const user = userData?.user || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
