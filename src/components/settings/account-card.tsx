import { useState, type ReactNode } from "react";
import { Loader2, Save, ShieldCheck, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { changeEmail, changePassword, renameAccount } from "@/lib/account-api";
import { useAuthStore } from "@/store/auth-store";

function SettingRow({
  label,
  description,
  value,
  first,
  actionLabel = "Change",
  onAction,
}: {
  label: string;
  description: string;
  value: ReactNode;
  first?: boolean;
  actionLabel?: string;
  onAction: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between",
        !first && "border-t border-border",
      )}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <p className="truncate text-sm text-muted-foreground sm:max-w-48">{value}</p>
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

export function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function openName() {
    setName(user?.name ?? "");
    setNameError(null);
    setNameOpen(true);
  }

  function openEmail() {
    setEmail(user?.email ?? "");
    setEmailPassword("");
    setEmailError(null);
    setEmailOpen(true);
  }

  function openPassword() {
    setCurrentPassword("");
    setNewPassword("");
    setPasswordError(null);
    setPasswordOpen(true);
  }

  async function handleRename() {
    if (!name.trim() || name.trim() === user?.name) return;
    setSavingName(true);
    setNameError(null);
    try {
      const updated = await renameAccount(name.trim());
      setUser(updated);
      setNameOpen(false);
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : "Failed to update name.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangeEmail() {
    if (!email.trim() || !emailPassword) return;
    setSavingEmail(true);
    setEmailError(null);
    try {
      const updated = await changeEmail(email.trim(), emailPassword);
      setUser(updated);
      setEmailOpen(false);
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : "Failed to update email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || newPassword.length < 8) return;
    setSavingPassword(true);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Manage your profile and security. Email and password changes require your current password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingRow label="Name" description="Your display name across the app." value={user?.name} first onAction={openName} />

        <SettingRow label="Email" description="Used to sign in and receive notifications." value={user?.email} onAction={openEmail} />

        <SettingRow label="Password" description="Choose a strong, unique password." value="••••••••" onAction={openPassword} />
      </CardContent>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change name</DialogTitle>
            <DialogDescription>Your display name across the app.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </div>
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameOpen(false)} disabled={savingName}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={savingName || !name.trim() || name.trim() === user?.name}>
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription>Confirm your current password to update your email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="account-email">New email</Label>
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-email-password">Current password</Label>
              <Input
                id="account-email-password"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
              />
            </div>
          </div>
          {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={savingEmail}>
              Cancel
            </Button>
            <Button
              onClick={handleChangeEmail}
              disabled={savingEmail || !email.trim() || !emailPassword || email.trim() === user?.email}
            >
              {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Choose a new password, at least 8 characters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
          </div>
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)} disabled={savingPassword}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || newPassword.length < 8}>
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
