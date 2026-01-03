import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from './App.tsx'
import './index.css'
import { initNotificationScheduler } from './lib/notificationScheduler'
import { indexedDB } from './lib/indexedDB'
import { initializeSettings } from './lib/appSettings'
import { isDatabaseSetup, getMigrationInstructions } from './lib/autoMigration'
import { supabase } from './lib/supabase'

// Initialize IndexedDB and default data
indexedDB.initDB().then(async () => {
  indexedDB.initializeDefaultData();
  
  // Auto-sync from Supabase when opening on new device
  if (navigator.onLine) {
    try {
      await indexedDB.syncFromSupabase();
      console.log('✅ Data synced from Supabase');
      
      // Check if database is properly setup
      const dbSetup = await isDatabaseSetup(supabase);
      
        if (!dbSetup) {
          console.warn('⚠️ Database not fully setup. Please run migration.');
          console.log(getMigrationInstructions());
        } else {
        console.log('✅ Database fully setup');
      }
      
      // Set global flag and dispatch event to notify components that sync is complete
      (window as any).supabaseSyncComplete = true;
      window.dispatchEvent(new CustomEvent('supabase-sync-complete'));
      
      // Enable realtime sync after initial sync
      await indexedDB.setupRealtimeSync();
      console.log('✅ Realtime sync enabled');
    } catch (error) {
      console.error('❌ Error syncing from Supabase:', error);
      // Still dispatch event even if sync fails
      (window as any).supabaseSyncComplete = true;
      window.dispatchEvent(new CustomEvent('supabase-sync-complete'));
    }
  } else {
    // Offline mode - dispatch event immediately
    (window as any).supabaseSyncComplete = true;
    window.dispatchEvent(new CustomEvent('supabase-sync-complete'));
  }
  
  // Initialize and migrate settings from localStorage to IndexedDB
  await initializeSettings();
  
  // Run academic year migration
  const { migrateToAcademicYear } = await import('./lib/academicYearMigration');
  await migrateToAcademicYear();
  
  // Check if migration is needed (only check, don't auto-migrate)
  const { dataMigration } = await import('./lib/migrationUtils');
  const migrationStatus = await dataMigration.getMigrationStatus();
  
  if (migrationStatus.needsMigration) {
    // Set flag for StorageMonitor to show migration banner
    sessionStorage.setItem('needsMigration', 'true');
    sessionStorage.setItem('migrationData', JSON.stringify(migrationStatus));
  }
});

// Register service worker and initialize notification scheduler
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In development, just initialize notification scheduler without SW
    initNotificationScheduler();
  } else {
    // Production: VitePWA will auto-register the SW via injectRegister: 'auto'
    window.addEventListener('load', () => {
      initNotificationScheduler();
    });
  }
}

if (typeof window !== "undefined") {
  const sendToParent = (data: any) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, "*");
      }
    } catch {}
  };

  window.addEventListener("error", (event) => {
    // Send structured payload to parent iframe
    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: "window.onerror",
      },
      timestamp: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason: any = event.reason;
    const message =
      typeof reason === "object" && reason?.message
        ? String(reason.message)
        : String(reason);
    const stack = typeof reason === "object" ? reason?.stack : undefined;

    // Mirror to parent iframe as well
    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message,
        stack,
        filename: undefined,
        lineno: undefined,
        colno: undefined,
        source: "unhandledrejection",
      },
      timestamp: Date.now(),
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);