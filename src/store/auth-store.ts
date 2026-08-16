import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiFetch, configureApiAuth } from "@/lib/api";
import { decodeJwt, isExpired } from "@/lib/jwt";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

interface AuthStore {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

function userFromToken(token: string): AuthUser {
  const claims = decodeJwt(token);
  if (!claims) throw new Error("Received an invalid session token");
  return { id: claims.sub, name: claims.name, email: claims.email, userType: claims.user_type };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,

      login: async (email, password) => {
        const res = await apiFetch<TokenResponse>("/api/users/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        set({ token: res.accessToken, refreshToken: res.refreshToken, user: userFromToken(res.accessToken) });
      },

      register: async (name, email, password) => {
        await apiFetch("/api/users/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        await get().login(email, password);
      },

      logout: async () => {
        const { token, refreshToken } = get();
        set({ token: null, refreshToken: null, user: null });
        if (!token) return;
        try {
          await apiFetch("/api/users/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
        } catch {
          // best-effort — local session is already cleared either way
        }
      },

      setUser: (user) => set({ user }),
    }),
    { name: "onecrawler-auth" },
  ),
);

// A live refresh token counts as "authenticated" even once the access token has
// expired — apiFetch transparently refreshes on the next request, so bouncing to
// the login page here would be premature.
export function selectIsAuthenticated(state: AuthStore): boolean {
  if (!state.user) return false;
  if (state.token) {
    const claims = decodeJwt(state.token);
    if (claims && !isExpired(claims)) return true;
  }
  return state.refreshToken !== null;
}

// Concurrent 401s must share one in-flight refresh — issuing the refresh token
// twice would have the second call invalidate the first's freshly-rotated token.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (!currentRefreshToken) return false;
      try {
        // Raw fetch, not apiFetch — apiFetch retries 401s through this same function,
        // and a failed refresh must not recurse back into itself.
        const res = await fetch("/api/users/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ refresh_token: currentRefreshToken }),
        });
        if (!res.ok) return false;
        const data: TokenResponse = await res.json();
        useAuthStore.setState({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          user: userFromToken(data.accessToken),
        });
        return true;
      } catch {
        return false;
      }
    })();
  }
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

configureApiAuth({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.setState({ token: null, refreshToken: null, user: null }),
  refreshAccessToken,
});
