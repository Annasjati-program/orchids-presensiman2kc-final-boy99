/**
 * Utility untuk sinkronisasi data dari IndexedDB ke Supabase
 * Menangani migrasi data yang ada di IndexedDB tapi belum tersinkronisasi ke Supabase
 */

import { indexedDB, type TableName } from './indexedDB';
import { supabase } from './supabase';

// Mapping tabel IndexedDB ke tabel Supabase
const TABLE_NAME_MAPPING: Record<string, string> = {
  'hari_libur': 'hari_libur_custom'
};

interface SyncResult {
  table: TableName;
  success: boolean;
  recordCount: number;
  error?: string;
}

/**
 * Sync single table dari IndexedDB ke Supabase
 */
export async function syncTableFromIndexedDB(tableName: TableName): Promise<SyncResult> {
  try {
    // Ambil semua data dari IndexedDB
    const localData = await indexedDB.select(tableName);
    
    if (localData.length === 0) {
      return {
        table: tableName,
        success: true,
        recordCount: 0
      };
    }

    // Get Supabase table name (might be different from IndexedDB table name)
    const supabaseTableName = TABLE_NAME_MAPPING[tableName] || tableName;

    // Hapus semua data lama di Supabase untuk tabel ini
    const { error: deleteError } = await supabase
      .from(supabaseTableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      throw new Error(`Delete error: ${deleteError.message}`);
    }

    // Insert semua data dari IndexedDB ke Supabase (KEEP ID!)
    const { error: insertError } = await supabase
      .from(supabaseTableName)
      .insert(localData);

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    console.log(`✅ Synced ${localData.length} records from ${tableName} to Supabase (${supabaseTableName})`);

    return {
      table: tableName,
      success: true,
      recordCount: localData.length
    };
  } catch (error) {
    console.error(`❌ Error syncing ${tableName}:`, error);
    return {
      table: tableName,
      success: false,
      recordCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Sync semua tabel dari IndexedDB ke Supabase
 */
export async function syncAllFromIndexedDB(): Promise<{
  success: boolean;
  results: SyncResult[];
  totalRecords: number;
  errors: string[];
}> {
  const tables: TableName[] = [
    'users', 'guru', 'mata_pelajaran', 'kelas', 'siswa',
    'jenis_kegiatan', 'jurnal', 'kehadiran', 'jenis_penilaian',
    'nilai_siswa', 'jam_pelajaran', 'jadwal_pelajaran', 'pengaturan',
    'agenda_mengajar', 'catatan_kalender', 'periode_non_pembelajaran',
    'ekstrakurikuler', 'anggota_eskul', 'kehadiran_eskul', 'nilai_eskul',
    'app_settings', 'kelompok_siswa', 'hari_libur'
  ];

  console.log('🔄 Starting sync from IndexedDB to Supabase...');

  const results: SyncResult[] = [];
  const errors: string[] = [];
  let totalRecords = 0;

  for (const table of tables) {
    const result = await syncTableFromIndexedDB(table);
    results.push(result);
    
    if (result.success) {
      totalRecords += result.recordCount;
    } else {
      errors.push(`${table}: ${result.error}`);
    }
  }

  const success = errors.length === 0;

  console.log(`
📊 Sync Summary:
  - Total tables: ${tables.length}
  - Successful: ${results.filter(r => r.success).length}
  - Failed: ${errors.length}
  - Total records synced: ${totalRecords}
  `);

  if (errors.length > 0) {
    console.error('❌ Errors:', errors);
  }

  return {
    success,
    results,
    totalRecords,
    errors
  };
}

/**
 * Sync pengaturan dari localStorage ke Supabase via IndexedDB
 */
export async function syncSettingsToSupabase(): Promise<void> {
  const settingsKeys = [
    'pdfFormatSettings',
    'notificationSettings', 
    'userProfile',
    'workday_settings',
    'selectedDate',
    'quickMenuItems'
  ];

  console.log('🔄 Syncing settings to Supabase...');

  for (const key of settingsKeys) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Check if already exists in app_settings
        const existing = await indexedDB.select('app_settings', (s: any) => s.setting_key === key);
        
        const settingData = {
          setting_key: key,
          setting_value: value,
          description: `Application setting: ${key}`
        };

        if (existing.length > 0) {
          await indexedDB.update('app_settings', existing[0].id, settingData);
        } else {
          await indexedDB.insert('app_settings', settingData);
        }

        console.log(`✅ Synced setting: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Error syncing setting ${key}:`, error);
    }
  }

  // Sync app_settings table to Supabase
  await syncTableFromIndexedDB('app_settings');
}

/**
 * Check apakah perlu sinkronisasi
 */
export async function checkSyncNeeded(): Promise<{
  needed: boolean;
  localRecordCount: number;
  supabaseRecordCount: number;
}> {
  try {
    // Count records in IndexedDB
    let localRecordCount = 0;
    const tables: TableName[] = [
      'users', 'guru', 'mata_pelajaran', 'kelas', 'siswa',
      'jenis_kegiatan', 'jurnal', 'kehadiran', 'app_settings'
    ];

    for (const table of tables) {
      const records = await indexedDB.select(table);
      localRecordCount += records.length;
    }

    // Count records in Supabase
    let supabaseRecordCount = 0;
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        supabaseRecordCount += count;
      }
    }

    const needed = localRecordCount > supabaseRecordCount;

    return {
      needed,
      localRecordCount,
      supabaseRecordCount
    };
  } catch (error) {
    console.error('Error checking sync status:', error);
    return {
      needed: false,
      localRecordCount: 0,
      supabaseRecordCount: 0
    };
  }
}