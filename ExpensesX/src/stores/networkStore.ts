import { create } from 'zustand';
import { initNetworkListener, processQueue, getQueueCount, getIsOnline } from '../lib/offlineQueue';

interface NetworkState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;

  initialize: () => () => void;
  refreshPendingCount: () => Promise<void>;
  syncNow: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,

  initialize: () => {
    // Set initial state
    set({ isOnline: getIsOnline() });
    get().refreshPendingCount();

    // Listen for network changes
    const unsubscribe = initNetworkListener(async (online) => {
      set({ isOnline: online });

      if (online) {
        // Auto-sync when back online
        set({ isSyncing: true });
        const { success } = await processQueue();
        set({ isSyncing: false });
        if (success > 0) {
          await get().refreshPendingCount();
        }
      }
    });

    return unsubscribe;
  },

  refreshPendingCount: async () => {
    const count = await getQueueCount();
    set({ pendingCount: count });
  },

  syncNow: async () => {
    if (!get().isOnline || get().isSyncing) return;
    set({ isSyncing: true });
    await processQueue();
    await get().refreshPendingCount();
    set({ isSyncing: false });
  },
}));
