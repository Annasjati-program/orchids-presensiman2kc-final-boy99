# Panduan Setup Database Baru

## Cara Menghubungkan ke Database Baru

Ketika Anda ingin menghubungkan aplikasi ke database Supabase baru, ikuti langkah berikut:

### 1. Jalankan Migration Script

Buka Supabase Dashboard > SQL Editor, lalu jalankan file:
```
src/supabase/migrations/00_complete_database_setup.sql
```

Script ini akan membuat **semua 31 tabel** yang dibutuhkan aplikasi secara otomatis:

1. users
2. guru
3. tahun_ajaran
4. kelas
5. siswa
6. mata_pelajaran
7. jam_pelajaran
8. jadwal_pelajaran
9. kehadiran
10. jenis_kegiatan
11. jurnal
12. jurnal_template
13. jenis_penilaian
14. nilai_siswa
15. bobot_penilaian_kelas
16. grade_thresholds
17. ekstrakurikuler
18. anggota_eskul
19. kehadiran_eskul
20. nilai_eskul
21. kelompok_siswa
22. pengaturan
23. app_settings
24. pdf_format_settings
25. quick_menu_items
26. agenda_mengajar
27. catatan_kalender
28. periode_non_pembelajaran
29. hari_libur
30. hari_libur_custom
31. profiles

### 2. Update Environment Variables

Update file `.env` dengan credentials database baru:

```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan otomatis:
- Sinkronisasi data dari IndexedDB lokal ke Supabase (jika ada data lokal)
- Sinkronisasi data dari Supabase ke IndexedDB (untuk offline access)

### 4. Verifikasi

Cek di Supabase Dashboard > Table Editor untuk memastikan semua 31 tabel terbuat dengan benar.

## Catatan Penting

- Script migration menggunakan `CREATE TABLE IF NOT EXISTS` sehingga aman dijalankan berulang kali
- Script menggunakan `DROP POLICY IF EXISTS` untuk menghindari error saat re-run
- Semua tabel sudah dilengkapi dengan:
  - Row Level Security (RLS) enabled
  - Policies untuk authenticated users
  - Triggers untuk auto-update `updated_at`
  - Foreign key relationships
  - Indexes (automatic via primary keys dan unique constraints)

## Troubleshooting

Jika ada masalah:

1. **Error "relation already exists"**: Script sudah menghandle ini dengan `IF NOT EXISTS`
2. **Error "policy already exists"**: Script sudah menghandle ini dengan `DROP POLICY IF EXISTS`
3. **Data tidak sinkron**: Refresh browser untuk trigger sinkronisasi ulang
4. **Kolom tidak muncul**: Pastikan mapping field di `src/lib/indexedDB.ts` sudah benar

## Struktur Field Penting

Beberapa tabel memiliki field mapping khusus dari Supabase ke IndexedDB:

### jam_pelajaran
- `urutan` (Supabase) → `jam_ke` (IndexedDB)
- `jam_mulai` (Supabase) → `waktu_mulai` (IndexedDB)
- `jam_selesai` (Supabase) → `waktu_selesai` (IndexedDB)

### hari_libur
- `hari_libur` (IndexedDB) → `hari_libur_custom` (Supabase)

Mapping ini sudah ditangani otomatis di kode.
