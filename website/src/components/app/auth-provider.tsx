"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@prism/shared";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch {
      // Best-effort refresh
    }
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        // Middleware already ensures tokens are fresh before the page loads.
        // We only need to fetch the profile with the valid access token.
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            return;
          }
        }
        // If profile fails here, middleware didn't catch it — redirect to login
        router.push("/login");
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
