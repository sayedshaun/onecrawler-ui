import { create } from "zustand";

import type { AgentConversationSummary } from "@/lib/types";

// Bridges the Agent page's conversation history into the global Sidebar,
// which renders it (like ChatGPT's nav) directly under the main nav items on
// every page, not just while the Agent page itself is open. AgentsPage owns
// the data and the actual selection logic (message loading, streaming,
// aborts); the Sidebar reads state and calls the handler AgentsPage
// registers while mounted. From any other page, `onSelect` is null — the
// Sidebar instead stashes `pendingSelectId` and navigates to the Agent page,
// which consumes it on mount. (Starting a new chat isn't a Sidebar action —
// the Agent tab itself is the entry point for that.)
interface AgentChatUIState {
  conversations: AgentConversationSummary[];
  activeId: string | null;
  loading: boolean;
  pendingSelectId: string | null;
  onSelect: ((id: string) => void) | null;
  setConversations: (conversations: AgentConversationSummary[]) => void;
  setActiveId: (activeId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingSelectId: (id: string | null) => void;
  setSelectHandler: (onSelect: ((id: string) => void) | null) => void;
}

export const useAgentChatStore = create<AgentChatUIState>((set) => ({
  conversations: [],
  activeId: null,
  loading: true,
  pendingSelectId: null,
  onSelect: null,
  setConversations: (conversations) => set({ conversations }),
  setActiveId: (activeId) => set({ activeId }),
  setLoading: (loading) => set({ loading }),
  setPendingSelectId: (pendingSelectId) => set({ pendingSelectId }),
  setSelectHandler: (onSelect) => set({ onSelect }),
}));
