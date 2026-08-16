import { create } from "zustand";

// Settings has no page of its own anymore — just this popup (ChatGPT/Claude-
// style). Anything that used to link to /dashboard/settings (the Agent page's
// "Configure agent" button, the Tutorial page) opens it from here instead of
// needing to be inside SettingsMenu's own dropdown tree.
interface SettingsDialogState {
  open: boolean;
  openSettings: () => void;
  setOpen: (open: boolean) => void;
}

export const useSettingsDialogStore = create<SettingsDialogState>((set) => ({
  open: false,
  openSettings: () => set({ open: true }),
  setOpen: (open) => set({ open }),
}));
