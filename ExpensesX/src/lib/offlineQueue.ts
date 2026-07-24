import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  console.warn('[OfflineQueue] NetInfo not available');
}

const QUEUE_KEY = 'expensex_offline_queue';

export interface QueuedAction {
  id: string;
  type: 'add_expense' | 'add_settlement' | 'send_message' | 'add_note';
  payload: any;
  createdAt: string;
  retryCount: number;
}

// ─── Queue Management ────────────────────────────────────────────────────────

/** Get all queued actions from local storage */
export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Save queue to local storage */
async function saveQueue(queue: QueuedAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Add an action to the offline queue */
export async function enqueue(type: QueuedAction['type'], payload: any): Promise<void> {
  const queue = await getQueue();
  const action: QueuedAction = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(action);
  await saveQueue(queue);
}

/** Remove a successfully processed action from queue */
async function dequeue(id: string): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter((a) => a.id !== id));
}

/** Get pending queue count */
export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

// ─── Network Status ──────────────────────────────────────────────────────────

let isOnline = true;

/** Check if device is currently online */
export function getIsOnline(): boolean {
  return isOnline;
}

/** Initialize network listener — call once on app startup */
export function initNetworkListener(onStatusChange?: (online: boolean) => void): () => void {
  if (!NetInfo) {
    // NetInfo not available — assume online
    isOnline = true;
    return () => {};
  }

  const unsubscribe = NetInfo.addEventListener((state: any) => {
    const wasOffline = !isOnline;
    isOnline = !!(state.isConnected && state.isInternetReachable !== false);

    onStatusChange?.(isOnline);

    // Auto-sync when coming back online
    if (wasOffline && isOnline) {
      processQueue();
    }
  });

  return unsubscribe;
}

// ─── Process Queue (sync when online) ────────────────────────────────────────

/** Process all queued actions — called automatically when back online */
export async function processQueue(): Promise<{ success: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      await executeAction(action);
      await dequeue(action.id);
      success++;
    } catch (err) {
      console.warn(`[OfflineQueue] Failed to process ${action.type}:`, err);
      // Increment retry count
      action.retryCount++;
      if (action.retryCount >= 5) {
        // Give up after 5 retries
        await dequeue(action.id);
        failed++;
      }
    }
  }

  // Save updated retry counts for remaining items
  const remaining = await getQueue();
  const updatedRemaining = remaining.map((item) => {
    const match = queue.find((q) => q.id === item.id);
    return match ? match : item;
  });
  await saveQueue(updatedRemaining);

  return { success, failed };
}

/** Execute a single queued action against Supabase */
async function executeAction(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case 'add_expense': {
      const { splits, ...expenseData } = action.payload;
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          trip_id: expenseData.trip_id,
          title: expenseData.title,
          amount: expenseData.amount,
          category: expenseData.category,
          paid_by: expenseData.paid_by,
          notes: expenseData.notes || null,
          split_method: expenseData.split_method,
          created_by: expenseData.created_by,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!expense) throw new Error('No expense returned');

      const { error: splitError } = await supabase.from('expense_splits').insert(
        splits.map((s: any) => ({ expense_id: expense.id, user_id: s.user_id, amount: s.amount }))
      );
      if (splitError) throw splitError;
      break;
    }

    case 'add_settlement': {
      const { error } = await supabase.from('settlements').insert({
        ...action.payload,
        status: 'pending_confirmation',
      });
      if (error) throw error;
      break;
    }

    case 'send_message': {
      const { error } = await supabase.from('messages').insert(action.payload);
      if (error) throw error;
      break;
    }

    case 'add_note': {
      const { error } = await supabase.from('trip_notes').insert(action.payload);
      if (error) throw error;
      break;
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

// ─── Helper: Try online first, fallback to queue ─────────────────────────────

/**
 * Attempt to execute an action online. If offline, queue it for later.
 * Returns true if executed immediately, false if queued.
 */
export async function executeOrQueue(
  type: QueuedAction['type'],
  payload: any,
  onlineExecutor: () => Promise<void>
): Promise<{ queued: boolean }> {
  if (isOnline) {
    try {
      await onlineExecutor();
      return { queued: false };
    } catch (err: any) {
      // If it's a network error, queue it
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        await enqueue(type, payload);
        return { queued: true };
      }
      throw err; // Re-throw non-network errors
    }
  } else {
    await enqueue(type, payload);
    return { queued: true };
  }
}
