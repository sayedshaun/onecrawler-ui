import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/store/auth-store";
import type { UsageStats, UserSession } from "@/lib/types";

export function renameAccount(name: string): Promise<AuthUser> {
  return apiFetch("/api/users/me/name", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function changeEmail(email: string, password: string): Promise<AuthUser> {
  return apiFetch("/api/users/me/email", {
    method: "PATCH",
    body: JSON.stringify({ email, password }),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<{ detail: string }> {
  return apiFetch("/api/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export function getUsage(): Promise<UsageStats> {
  return apiFetch("/api/users/me/usage");
}

export function listSessions(): Promise<UserSession[]> {
  return apiFetch<{ items: UserSession[] }>("/api/users/me/sessions").then((r) => r.items);
}

export function revokeSession(sessionId: string): Promise<void> {
  return apiFetch(`/api/users/me/sessions/${sessionId}`, { method: "DELETE" });
}

export function revokeAllSessions(): Promise<void> {
  return apiFetch("/api/users/me/sessions/revoke-all", { method: "POST" });
}
