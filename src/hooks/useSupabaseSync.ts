import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { indexedDB } from '@/lib/indexedDB';
import type { TableName } from '@/lib/localDB';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
}

export function useSupabaseSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0
  });

  const syncAllTables = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      await indexedDB.syncFromSupabase();
    } catch (error) {
      console.error('Error syncing from Supabase:', error);
    }

    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: false,
      lastSyncTime: new Date() 
    }));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      syncAllTables();
    };
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncAllTables]);

  return {
    syncStatus,
    syncAllTables
  };
}