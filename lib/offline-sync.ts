import { get, set } from 'idb-keyval';
import { supabase } from './supabase';

const isBrowser = typeof window !== 'undefined';

export type SyncAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncTask {
  id: string;
  action: SyncAction;
  table: string;
  payload: any;
  recordId: string;
  timestamp: number;
}

const QUEUE_KEY = 'applyflow_sync_queue';
const OFFLINE_MODE_KEY = 'applyflow_offline_mode';

export async function isOfflineModeEnabled(): Promise<boolean> {
  if (!isBrowser) return true;
  const val = await get(OFFLINE_MODE_KEY);
  return val === undefined ? true : val; // Default to true
}

export async function setOfflineModeEnabled(enabled: boolean): Promise<void> {
  if (!isBrowser) return;
  await set(OFFLINE_MODE_KEY, enabled);
}

export async function getSyncQueue(): Promise<SyncTask[]> {
  if (!isBrowser) return [];
  const queue = await get(QUEUE_KEY);
  return queue || [];
}

export async function addToSyncQueue(task: Omit<SyncTask, 'id' | 'timestamp'>) {
  if (!isBrowser) return;
  const queue = await getSyncQueue();
  const newTask: SyncTask = {
    ...task,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  queue.push(newTask);
  await set(QUEUE_KEY, queue);
}

export async function processSyncQueue() {
  if (!isBrowser || !navigator.onLine) return;

  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  const failedTasks: SyncTask[] = [];

  for (const task of queue) {
    let error = null;
    
    if (task.action === 'INSERT') {
      const { error: err } = await supabase.from(task.table).insert(task.payload);
      error = err;
    } else if (task.action === 'UPDATE') {
      // Don't send id in update payload to avoid conflict
      const { id, ...updatePayload } = task.payload;
      const { error: err } = await supabase.from(task.table).update(updatePayload).eq('id', task.recordId);
      error = err;
    } else if (task.action === 'DELETE') {
      const { error: err } = await supabase.from(task.table).delete().eq('id', task.recordId);
      error = err;
    }

    if (error) {
      console.error(`Sync failed for task ${task.id}:`, error);
      failedTasks.push(task);
    }
  }

  await set(QUEUE_KEY, failedTasks);
}

export async function saveToLocalCache(key: string, data: any) {
  if (!isBrowser) return;
  await set(key, data);
}

export async function getFromLocalCache(key: string) {
  if (!isBrowser) return null;
  return await get(key);
}
