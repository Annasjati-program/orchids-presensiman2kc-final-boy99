// IndexedDB wrapper with same interface as localStorage version
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface User extends BaseRecord {
  user_id: string;
  nama: string;
  email: string;
  role: 'admin' | 'guru';
  status: string;
  avatar_url?: string;
}

export interface Guru extends BaseRecord {
  nama_guru: string;
  nip: string;
  mata_pelajaran: string;
  email: string;
  telepon?: string;
  jabatan?: string;
  kepala_sekolah_nama?: string;
  kepala_sekolah_nip?: string;
}

export interface MataPelajaran extends BaseRecord {
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  deskripsi?: string;
  status: string;
}

export interface Kelas extends BaseRecord {
  nama_kelas: string;
  tingkat: string;
  jurusan?: string;
  wali_kelas_id?: string;
  tahun_ajaran: string;
  kapasitas: number;
  status: string;
}

export interface Siswa extends BaseRecord {
  nisn: string;
  nama_siswa: string;
  kelas_id?: string;
  jenis_kelamin?: 'Laki-laki' | 'Perempuan';
  tanggal_lahir?: string;
  tempat_lahir?: string;
  alamat?: string;
  nama_orang_tua?: string;
  telepon_orang_tua?: string;
  email?: string;
  status: string;
  tahun_ajaran: string;
}

export interface JenisKegiatan extends BaseRecord {
  nama_kegiatan: string;
  deskripsi?: string;
}

export interface Jurnal extends BaseRecord {
  tanggal: string;
  jenis_kegiatan_id: string;
  guru_id?: string;
  volume?: number;
  uraian_kegiatan?: string;
  satuan_hasil?: string;
}

export interface Kehadiran extends BaseRecord {
  siswa_id: string;
  kelas_id: string;
  tanggal: string;
  mata_pelajaran_id?: string;
  status_kehadiran: string;
  keterangan?: string;
  keaktifan?: string;
  tahun_ajaran: string;
}

export interface JenisPenilaian extends BaseRecord {
  nama_kategori: string;
  bobot?: number;
  deskripsi?: string;
  status: string;
}

export interface NilaiSiswa extends BaseRecord {
  siswa_id: string;
  mata_pelajaran_id: string;
  jenis_penilaian_id: string;
  nilai: number;
  tanggal: string;
  semester: string;
  tahun_ajaran: string;
}

export interface JamPelajaran extends BaseRecord {
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
}

export interface JadwalPelajaran extends BaseRecord {
  hari: string;
  jam_ke: number;
  kelas_id: string;
  mata_pelajaran_id: string;
  jumlah_jp: number;
  semester: string;
  tahun_ajaran: string;
}

export interface Pengaturan extends BaseRecord {
  key: string;
  value: string;
}

export interface ActivityLog extends BaseRecord {
  description: string;
  user: string;
  timestamp: string;
  action_type: string;
}

export interface AgendaMengajar extends BaseRecord {
  tanggal: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  materi: string;
  keterangan: string;
  tahun_ajaran: string;
  jenis_pembelajaran?: string;
}

export interface CatatanKalender extends BaseRecord {
  tanggal: string;
  catatan: string;
  warna?: string;
}

export interface HariLibur extends BaseRecord {
  tanggal: string;
  nama: string;
  keterangan?: string;
}

export interface PeriodeNonPembelajaran extends BaseRecord {
  tanggal_mulai: string;
  tanggal_selesai: string;
  nama: string;
  keterangan?: string;
  jenis: 'ujian' | 'libur' | 'kegiatan' | 'lainnya';
}

export interface Ekstrakurikuler extends BaseRecord {
  nama_eskul: string;
  pembimbing: string;
  hari_pertemuan: string;
  jam_pertemuan: string;
  deskripsi?: string;
  status: string;
}

export interface AnggotaEskul extends BaseRecord {
  ekstrakurikuler_id: string;
  nisn: string;
  nama_siswa: string;
  tingkat: string;
  nama_kelas: string;
  tanggal_masuk: string;
  status: string;
}

export interface KehadiranEskul extends BaseRecord {
  ekstrakurikuler_id: string;
  anggota_id: string;
  tanggal: string;
  status_kehadiran: string;
  keterangan?: string;
}

export interface NilaiEskul extends BaseRecord {
  anggota_id: string;
  ekstrakurikuler_id: string;
  tahun_ajaran_id: string;
  semester: string;
  nilai: string;
}

export interface AppSettings extends BaseRecord {
  setting_key: string;
  setting_value: string;
  description?: string;
}

export interface KelompokSiswa extends BaseRecord {
  kelas_id: string;
  mapel_id?: string | null;
  nama_kelompok: string;
  tanggal_dibuat: string;
  jumlah_kelompok: number;
  metode: 'by-count' | 'by-size';
  balance_gender: boolean;
  data_kelompok: string;
  keterangan?: string;
}

export type TableName = 'users' | 'guru' | 'mata_pelajaran' | 'kelas' | 'siswa' | 'jenis_kegiatan' | 'jurnal' | 'kehadiran' | 'jenis_penilaian' | 'nilai_siswa' | 'jam_pelajaran' | 'jadwal_pelajaran' | 'pengaturan' | 'activity_log' | 'agenda_mengajar' | 'catatan_kalender' | 'hari_libur' | 'periode_non_pembelajaran' | 'ekstrakurikuler' | 'anggota_eskul' | 'kehadiran_eskul' | 'nilai_eskul' | 'app_settings' | 'kelompok_siswa';

function generateId(): string {
  return uuidv4();
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

class IndexedDBManager {
  private dbName = 'SekolahDB';
  private dbVersion = 10;
  private db: IDBDatabase | null = null;
  private realtimeChannels: any[] = [];

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran', 'jenis_penilaian', 'nilai_siswa', 'jam_pelajaran', 'jadwal_pelajaran', 'pengaturan', 'activity_log', 'agenda_mengajar', 'catatan_kalender', 'hari_libur', 'periode_non_pembelajaran', 'ekstrakurikuler', 'anggota_eskul', 'kehadiran_eskul', 'nilai_eskul', 'app_settings', 'kelompok_siswa'];
        
        tables.forEach(tableName => {
          if (!db.objectStoreNames.contains(tableName)) {
            const store = db.createObjectStore(tableName, { keyPath: 'id' });
            store.createIndex('created_at', 'created_at', { unique: false });
            
            if (tableName === 'app_settings') {
              store.createIndex('setting_key', 'setting_key', { unique: true });
            }
          }
        });
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  async initializeDefaultData(): Promise<void> {
    await this.ensureDB();
    
    const jenisKegiatan = await this.select('jenis_kegiatan');
    if (jenisKegiatan.length === 0) {
      const defaultKegiatan = [
        { nama_kegiatan: 'Mengajar', deskripsi: 'Kegiatan pembelajaran di kelas' },
        { nama_kegiatan: 'Piket', deskripsi: 'Tugas piket sekolah' },
        { nama_kegiatan: 'Pembinaan', deskripsi: 'Kegiatan pembinaan siswa' },
        { nama_kegiatan: 'Rapat', deskripsi: 'Rapat koordinasi' },
        { nama_kegiatan: 'Administrasi', deskripsi: 'Tugas administrasi' }
      ];

      for (const kegiatan of defaultKegiatan) {
        await this.insert('jenis_kegiatan', kegiatan);
      }
    }
  }

  async syncHolidaysFromGoogle(holidays: Array<{ tanggal: string; nama: string; keterangan: string }>): Promise<void> {
    await this.ensureDB();
    
    const existingHolidays = await this.select('hari_libur');
    for (const holiday of existingHolidays) {
      await this.delete('hari_libur', holiday.id);
    }
    
    for (const holiday of holidays) {
      await this.insert('hari_libur', holiday);
    }

    try {
      const { syncTableFromIndexedDB } = await import('./syncIndexedDBToSupabase');
      await syncTableFromIndexedDB('hari_libur');
      console.log('✅ Holidays synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync holidays to Supabase:', error);
    }
  }

  async select(tableName: TableName, filter?: (record: any) => boolean): Promise<any[]> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result || [];
          resolve(filter ? records.filter(filter) : records);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error reading from ${tableName}:`, error);
      return [];
    }
  }

  async selectById(tableName: TableName, id: string): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error reading record from ${tableName}:`, error);
      return null;
    }
  }

  async insert(tableName: TableName, data: Partial<any>): Promise<{ data: any; error: null } | { data: null; error: string }> {
    try {
      const db = await this.ensureDB();
      const newRecord = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      };

      return new Promise(async (resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.add(newRecord);

        request.onsuccess = async () => {
          if (navigator.onLine) {
            try {
              if (tableName === 'jenis_kegiatan' && data.nama_kegiatan) {
                const { data: existing } = await supabase
                  .from(tableName)
                  .select('id')
                  .ilike('nama_kegiatan', data.nama_kegiatan.trim())
                  .maybeSingle();
                
                if (existing) {
                  console.warn(`⚠️ Skipping Supabase insert - jenis_kegiatan "${data.nama_kegiatan}" already exists`);
                  resolve({ data: newRecord, error: null });
                  return;
                }
              }
              
              const { error: supabaseError } = await supabase
                .from(tableName)
                .insert(newRecord);
              
              if (supabaseError) {
                console.warn(`⚠️ Supabase sync skipped for ${tableName}:`, supabaseError.message);
              }
            } catch (syncError: any) {
              console.warn(`⚠️ Offline or network error for ${tableName}:`, syncError?.message || 'Unknown error');
            }
          }
          
          resolve({ data: newRecord, error: null });
        };
        
        request.onerror = () => {
          resolve({ data: null, error: `Failed to insert record: ${request.error}` });
        };
      });
    } catch (error) {
      return { data: null, error: `Failed to insert record: ${error}` };
    }
  }

  async update(tableName: TableName, id: string, data: Partial<any>): Promise<{ data: any; error: null } | { data: null; error: string }> {
    try {
      const db = await this.ensureDB();
      const existingRecord = await this.selectById(tableName, id);
      
      if (!existingRecord) {
        return { data: null, error: 'Record not found' };
      }

      const updatedRecord = {
        ...existingRecord,
        ...data,
        updated_at: getCurrentTimestamp()
      };

      return new Promise(async (resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.put(updatedRecord);

        request.onsuccess = async () => {
          if (navigator.onLine) {
            try {
              const { error: supabaseError } = await supabase
                .from(tableName)
                .update(updatedRecord)
                .eq('id', id);
              
              if (supabaseError) {
                console.warn(`⚠️ Supabase sync skipped for ${tableName}:`, supabaseError.message);
              }
            } catch (syncError: any) {
              console.warn(`⚠️ Offline or network error for ${tableName}:`, syncError?.message || 'Unknown error');
            }
          }
          
          resolve({ data: updatedRecord, error: null });
        };
        
        request.onerror = () => {
          resolve({ data: null, error: `Failed to update record: ${request.error}` });
        };
      });
    } catch (error) {
      return { data: null, error: `Failed to update record: ${error}` };
    }
  }

  async delete(tableName: TableName, id: string): Promise<{ error: null } | { error: string }> {
    try {
      const db = await this.ensureDB();
      
      return new Promise(async (resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.delete(id);

        request.onsuccess = async () => {
          if (navigator.onLine) {
            try {
              const { error: supabaseError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);
              
              if (supabaseError) {
                console.warn(`⚠️ Supabase sync skipped for ${tableName}:`, supabaseError.message);
              }
            } catch (syncError: any) {
              console.warn(`⚠️ Offline or network error for ${tableName}:`, syncError?.message || 'Unknown error');
            }
          }
          
          resolve({ error: null });
        };
        
        request.onerror = () => {
          resolve({ error: `Failed to delete record: ${request.error}` });
        };
      });
    } catch (error) {
      return { error: `Failed to delete record: ${error}` };
    }
  }

  async count(tableName: TableName, filter?: (record: any) => boolean): Promise<number> {
    const records = await this.select(tableName, filter);
    return records.length;
  }

  async getAll(tableName: TableName, filter?: (record: any) => boolean): Promise<any[]> {
    return this.select(tableName, filter);
  }

  async clear(tableName: TableName): Promise<{ error: null } | { error: string }> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve({ error: null });
        };

        request.onerror = () => {
          resolve({ error: `Failed to clear table: ${request.error}` });
        };
      });
    } catch (error) {
      return { error: `Failed to clear table: ${error}` };
    }
  }

  async exportAll(): Promise<Record<TableName, any[]>> {
    const tables: TableName[] = [
      'users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 
      'jenis_kegiatan', 'jurnal', 'kehadiran', 'jenis_penilaian', 
      'nilai_siswa', 'jam_pelajaran', 'jadwal_pelajaran', 'pengaturan', 
      'activity_log', 'agenda_mengajar', 'catatan_kalender', 'hari_libur',
      'periode_non_pembelajaran', 'ekstrakurikuler', 'anggota_eskul', 
      'kehadiran_eskul', 'nilai_eskul'
    ];
    const exportData: Record<TableName, any[]> = {} as Record<TableName, any[]>;
    
    for (const table of tables) {
      exportData[table] = await this.select(table);
    }

    return exportData;
  }

  async importAll(data: Record<TableName, any[]>): Promise<{ error: null } | { error: string }> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction(Object.keys(data) as TableName[], 'readwrite');
        let pendingOperations = 0;
        let hasError = false;

        Object.entries(data).forEach(([tableName, records]) => {
          const store = transaction.objectStore(tableName as TableName);
          
          records.forEach(record => {
            pendingOperations++;
            const request = store.put(record);
            
            request.onsuccess = () => {
              pendingOperations--;
              if (pendingOperations === 0 && !hasError) {
                resolve({ error: null });
              }
            };
            
            request.onerror = () => {
              hasError = true;
              resolve({ error: `Failed to import data: ${request.error}` });
            };
          });
        });

        if (pendingOperations === 0) {
          resolve({ error: null });
        }
      });
    } catch (error) {
      return { error: `Failed to import data: ${error}` };
    }
  }

  async syncFromSupabase(): Promise<void> {
    if (!supabase) {
      console.log('Supabase not initialized');
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline, skipping sync');
      return;
    }

    console.log('🔄 Starting sync from Supabase...');

    const tables = [
      'guru', 'kelas', 'mata_pelajaran', 'siswa', 
      'jenis_kegiatan', 'jurnal', 'kehadiran', 'jenis_penilaian', 
      'nilai_siswa', 'jam_pelajaran', 'jadwal_pelajaran', 'pengaturan',
      'agenda_mengajar', 'catatan_kalender', 'hari_libur',
      'periode_non_pembelajaran', 'ekstrakurikuler', 'anggota_eskul', 
      'kehadiran_eskul', 'nilai_eskul', 'app_settings', 'kelompok_siswa'
    ];

    let totalSynced = 0;

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error(`Error syncing ${tableName}:`, error);
          continue;
        }

        if (data) {
          const db = await this.ensureDB();
          const clearTransaction = db.transaction([tableName], 'readwrite');
          const clearStore = clearTransaction.objectStore(tableName);
          await new Promise((resolve, reject) => {
            const clearRequest = clearStore.clear();
            clearRequest.onsuccess = () => resolve(true);
            clearRequest.onerror = () => reject(clearRequest.error);
          });

          const transformedData = data.map(record => {
            if (tableName === 'jam_pelajaran') {
              return {
                ...record,
                jam_ke: record.urutan,
                waktu_mulai: record.jam_mulai,
                waktu_selesai: record.jam_selesai
              };
            }
            return record;
          });

          const insertTransaction = db.transaction([tableName], 'readwrite');
          const insertStore = insertTransaction.objectStore(tableName);

          for (const record of transformedData) {
            await new Promise((resolve, reject) => {
              const request = insertStore.put(record);
              request.onsuccess = () => resolve(true);
              request.onerror = () => reject(request.error);
            });
          }

          totalSynced += data.length;
          console.log(`✅ Synced ${data.length} records to ${tableName}`);
        }
      } catch (error) {
        console.error(`Error syncing table ${tableName}:`, error);
      }
    }

    console.log(`✅ Sync completed: ${totalSynced} records synced`);
  }

  async setupRealtimeSync(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline, skipping realtime setup');
      return;
    }

    const tables: TableName[] = [
      'users', 'kehadiran', 'siswa', 'guru', 'kelas', 'mata_pelajaran',
      'nilai_siswa', 'jadwal_pelajaran', 'agenda_mengajar', 'jurnal',
      'jenis_penilaian', 'jenis_kegiatan', 'jam_pelajaran', 'pengaturan',
      'catatan_kalender', 'hari_libur', 'periode_non_pembelajaran',
      'ekstrakurikuler', 'anggota_eskul', 'kehadiran_eskul', 
      'nilai_eskul', 'kelompok_siswa', 'app_settings'
    ];

    for (const tableName of tables) {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: tableName 
          },
          async (payload) => {
            const db = await this.ensureDB();
            const transaction = db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              await new Promise((resolve, reject) => {
                const request = store.put(payload.new);
                request.onsuccess = () => {
                  console.log(`✓ Realtime: ${payload.eventType} on ${tableName}`);
                  resolve(true);
                };
                request.onerror = () => reject(request.error);
              });
            } else if (payload.eventType === 'DELETE') {
              await new Promise((resolve, reject) => {
                const request = store.delete(payload.old.id);
                request.onsuccess = () => {
                  console.log(`✓ Realtime: DELETE on ${tableName}`);
                  resolve(true);
                };
                request.onerror = () => reject(request.error);
              });
            }

            window.dispatchEvent(new Event('storage'));
          }
        )
        .subscribe();

      this.realtimeChannels.push(channel);
    }

    console.log('✓ Realtime sync enabled for all tables');
  }

  async cleanupRealtimeSync(): Promise<void> {
    for (const channel of this.realtimeChannels) {
      await supabase.removeChannel(channel);
    }
    this.realtimeChannels = [];
  }
}

export const indexedDB = new IndexedDBManager();
