import { useState } from "react";
import { Loader2, LogOut, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePolledResource } from "@/hooks/use-polled-resource";
import { ApiError } from "@/lib/api";
import { listSessions, revokeAllSessions, revokeSession } from "@/lib/account-api";
import { formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export function SessionsCard() {
  const { data: sessions, error, refetch } = usePolledResource(() => listSessions(), {
    cacheKey: "settings:sessions",
  });
  const logout = useAuthStore((s) => s.logout);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    setActionError(null);
    try {
      await revokeSession(sessionId);
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to revoke session.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    setActionError(null);
    try {
      await revokeAllSessions();
      // Revoking every session invalidates this device's refresh token too —
      // clear local auth state rather than leaving a session the server no longer honors.
      await logout();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to revoke sessions.");
      setRevokingAll(false);
    }
  }

  const items = sessions ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Devices and browsers currently signed in.</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={revokingAll || items.length === 0}
          onClick={handleRevokeAll}
        >
          {revokingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          Sign out everywhere
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}

        {items.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        )}

        {items.map((session) => {
          const revoking = revokingId === session.id;
          return (
            <div
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-foreground">{session.id}</p>
                <p className="text-xs text-muted-foreground">
                  Signed in {formatRelativeTime(new Date(session.createdAt))} · expires{" "}
                  {formatRelativeTime(new Date(session.expiresAt))}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={revoking}
                onClick={() => handleRevoke(session.id)}
              >
                {revoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Revoke
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
