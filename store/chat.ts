import { create } from "zustand";

interface ChatStore {
  isOpen: boolean;
  activeConversationId: string | null;
  pendingShopId: string | null;
  open: () => void;
  openWithShop: (shopId: string) => void;
  close: () => void;
  setActiveConversation: (id: string | null) => void;
  clearPendingShop: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  activeConversationId: null,
  pendingShopId: null,
  open: () => set({ isOpen: true }),
  openWithShop: (shopId) => set({ isOpen: true, pendingShopId: shopId }),
  close: () => set({ isOpen: false, activeConversationId: null }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  clearPendingShop: () => set({ pendingShopId: null }),
}));
