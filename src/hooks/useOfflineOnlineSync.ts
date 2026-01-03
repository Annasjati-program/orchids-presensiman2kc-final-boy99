import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SyncableItem {
  id?: string;
  title: string;
  icon: string;
  path: string;
  color: string;
}

const STORAGE_KEY = 'quick_menu_items_offline';
const SYNC_PENDING_KEY = 'quick_menu_sync_pending';

export function useOfflineOnlineSync() {
  const [items, setItems] = useState<SyncableItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return [];
  }, []);

  const saveToLocalStorage = useCallback((data: SyncableItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  const markSyncPending = useCallback(() => {
    localStorage.setItem(SYNC_PENDING_KEY, 'true');
  }, []);

  const clearSyncPending = useCallback(() => {
    localStorage.removeItem(SYNC_PENDING_KEY);
  }, []);

  const isSyncPending = useCallback(() => {
    return localStorage.getItem(SYNC_PENDING_KEY) === 'true';
  }, []);

  const fetchFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quick_menu_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedData: SyncableItem[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        icon: item.icon,
        path: item.path,
        color: item.color,
      }));

      return mappedData;
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      return null;
    }
  }, []);

  const syncToSupabase = useCallback(async (data: SyncableItem[]) => {
    if (!isOnline) {
      markSyncPending();
      return false;
    }

    setIsSyncing(true);
    try {
      const { error: deleteError } = await supabase
        .from('quick_menu_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;

      if (data.length > 0) {
        const insertData = data.map((item) => ({
          title: item.title,
          icon: item.icon,
          path: item.path,
          color: item.color,
        }));

        const { error: insertError } = await supabase
          .from('quick_menu_items')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      clearSyncPending();
      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      markSyncPending();
      setIsSyncing(false);
      return false;
    }
  }, [isOnline, markSyncPending, clearSyncPending]);

  const loadItems = useCallback(async () => {
    const localData = loadFromLocalStorage();

    if (isOnline) {
      const remoteData = await fetchFromSupabase();
      if (remoteData) {
        setItems(remoteData);
        saveToLocalStorage(remoteData);
        
        if (isSyncPending()) {
          await syncToSupabase(localData);
        }
      } else {
        setItems(localData);
      }
    } else {
      setItems(localData);
    }
  }, [isOnline, loadFromLocalStorage, saveToLocalStorage, fetchFromSupabase, syncToSupabase, isSyncPending]);

  const updateItems = useCallback(async (newItems: SyncableItem[]) => {
    setItems(newItems);
    saveToLocalStorage(newItems);

    if (isOnline) {
      await syncToSupabase(newItems);
    } else {
      markSyncPending();
    }
  }, [isOnline, saveToLocalStorage, syncToSupabase, markSyncPending]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (isOnline && isSyncPending()) {
      const localData = loadFromLocalStorage();
      syncToSupabase(localData);
    }
  }, [isOnline, isSyncPending, loadFromLocalStorage, syncToSupabase]);

  return {
    items,
    updateItems,
    isOnline,
    isSyncing,
    refresh: loadItems,
  };
}
