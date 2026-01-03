# Auto Database Migration System

## Overview
Aplikasi ini sekarang dilengkapi dengan **auto-migration check** yang akan otomatis mengecek apakah database Supabase sudah tersetup lengkap atau belum, plus fitur **one-click copy & download** migration script.

## ⚡ NEW: One-Click Migration Setup

### Fitur Baru
- ✅ **Copy Migration Script** - Copy langsung ke clipboard dengan satu klik
- ✅ **Download SQL File** - Download migration script sebagai file .sql
- ✅ **Quick Access to SQL Editor** - Tombol langsung ke Supabase SQL Editor
- ✅ **Auto-Check Database** - Otomatis detect apakah database sudah lengkap

## Apa yang Terjadi Ketika Menghubungkan ke Database Baru?

### 1. Auto Check saat Aplikasi Dimuat
Ketika aplikasi dimuat, sistem akan:
- ✅ Mengecek apakah database sudah memiliki minimal 10 tabel utama
- ⚠️ Menampilkan **warning banner** di Dashboard jika database belum lengkap
- 📋 Memberikan instruksi setup yang jelas di UI
- 🔘 Menyediakan tombol **Copy**, **Download**, dan **Open SQL Editor**

### 2. Visual Guide di Dashboard
Jika database belum tersetup lengkap, akan muncul:
- **Banner kuning** dengan peringatan "Database Belum Tersetup Lengkap"
- **Instruksi lengkap** cara setup database (step-by-step)
- **Tombol "Copy Migration Script"** - Copy script langsung ke clipboard
- **Tombol "Download SQL File"** - Download file .sql untuk backup
- **Tombol "Buka SQL Editor"** - Langsung membuka Supabase SQL Editor
- **Tombol "Cek Ulang Database"** - Re-check setelah migration dijalankan

## 🚀 Cara Setup Database Baru (Super Cepat!)

### Opsi 1: One-Click Copy & Paste (Recommended)

1. **Copy Migration Script**
   - Klik tombol **"Copy Migration Script"** di banner
   - Script otomatis tersalin ke clipboard ✨

2. **Buka SQL Editor**
   - Klik tombol **"Buka SQL Editor"**
   - Atau manual: `Supabase Dashboard → SQL Editor`

3. **Paste & Run**
   - Paste script (Ctrl+V / Cmd+V)
   - Klik tombol **"Run"**
   - Tunggu hingga selesai (5-10 detik)

4. **Refresh & Verify**
   - Kembali ke aplikasi
   - Klik **"Cek Ulang Database"**
   - Banner akan hilang otomatis jika berhasil ✅

### Opsi 2: Download & Upload SQL File

1. **Download SQL File**
   - Klik tombol **"Download SQL File"** di banner
   - File `00_complete_database_setup.sql` akan terdownload

2. **Buka SQL Editor**
   - Klik tombol **"Buka SQL Editor"**

3. **Upload & Run**
   - Di SQL Editor, klik tombol "Upload"
   - Pilih file yang sudah didownload
   - Klik **"Run"**

4. **Verify**
   - Klik **"Cek Ulang Database"** di aplikasi

### Opsi 3: Via Supabase CLI

Jika Anda sudah setup Supabase CLI:

```bash
# Di terminal, di folder project
supabase db push
```

### Opsi 4: Manual Copy dari File

```bash
# Copy manual dari file project
src/supabase/migrations/00_complete_database_setup.sql
```

## Tabel yang Akan Dibuat (31 Tabel)

Migration script akan membuat **31 tabel** lengkap:

### Core Tables (5)
- `users` - Data user aplikasi
- `guru` - Data guru
- `kelas` - Data kelas
- `siswa` - Data siswa
- `mata_pelajaran` - Data mata pelajaran

### Academic Tables (8)
- `tahun_ajaran` - Tahun ajaran
- `jam_pelajaran` - Jam pelajaran
- `jadwal_pelajaran` - Jadwal pelajaran
- `kehadiran` - Kehadiran siswa
- `jenis_penilaian` - Jenis penilaian
- `nilai_siswa` - Nilai siswa
- `bobot_penilaian_kelas` - Bobot penilaian per kelas
- `grade_thresholds` - Threshold grade nilai

### Journal & Activities (3)
- `jenis_kegiatan` - Jenis kegiatan
- `jurnal` - Jurnal guru
- `jurnal_template` - Template jurnal

### Ekstrakurikuler (4)
- `ekstrakurikuler` - Data ekstrakurikuler
- `anggota_eskul` - Anggota ekstrakurikuler
- `kehadiran_eskul` - Kehadiran ekstrakurikuler
- `nilai_eskul` - Nilai ekstrakurikuler

### Calendar & Planning (4)
- `agenda_mengajar` - Agenda mengajar guru
- `catatan_kalender` - Catatan kalender
- `periode_non_pembelajaran` - Periode ujian/libur
- `hari_libur` - Hari libur nasional
- `hari_libur_custom` - Hari libur custom

### Settings & Groups (4)
- `pengaturan` - Pengaturan aplikasi
- `app_settings` - App settings (sync-able)
- `kelompok_siswa` - Kelompok siswa
- `pdf_format_settings` - Format PDF settings

### UI Preferences (2)
- `quick_menu_items` - Quick menu items
- `profiles` - User profiles (Supabase Auth)

## Features

### ✅ Auto-Detection
- Sistem otomatis detect apakah database sudah lengkap
- Tidak perlu konfigurasi manual
- Check dilakukan saat aplikasi dimuat

### 📋 One-Click Actions
- **Copy to Clipboard** - Copy script dengan satu klik
- **Download SQL File** - Download untuk backup atau manual upload
- **Quick Access** - Langsung ke SQL Editor dari aplikasi
- **Re-check** - Verify database status setelah migration

### 🔄 Re-check Capability
- Tombol "Cek Ulang Database" tersedia
- Bisa re-check setelah migration dijalankan
- Banner otomatis hilang jika database sudah lengkap

### 🎯 Smart Validation
- Check minimal 5 tabel core (users, guru, kelas, siswa, mata_pelajaran)
- Fallback validation jika RPC tidak tersedia
- Error handling yang robust

## Troubleshooting

### Banner Tidak Hilang Setelah Migration?
1. Pastikan migration script sudah berhasil dijalankan
2. Check di Supabase Dashboard → Database → Tables
3. Verifikasi ada 31 tabel
4. Klik tombol "Cek Ulang Database" di banner
5. Refresh browser (hard refresh: Ctrl+Shift+R)

### Copy Script Gagal?
- Gunakan tombol **"Download SQL File"** sebagai alternatif
- Atau copy manual dari file: `src/supabase/migrations/00_complete_database_setup.sql`

### Error Saat Execute Migration Script?
- Pastikan Anda login sebagai `postgres` role
- Check koneksi database
- Pastikan tidak ada constraint conflicts
- Lihat error message di SQL Editor

### Migration Script Tidak Lengkap?
- File asli ada di: `src/supabase/migrations/00_complete_database_setup.sql`
- Total 1238 baris
- Pastikan copy seluruh file (tombol "Copy Migration Script" sudah handle ini)

## Technical Details

### Auto-Check Implementation
```typescript
// src/lib/autoMigration.ts
export async function isDatabaseSetup(supabaseClient: SupabaseClient): Promise<boolean> {
  // Check if database has minimum 10 tables
  // Fallback to checking core tables individually
}
```

### Migration Executor
```typescript
// src/lib/migrationExecutor.ts
export async function copyMigrationScriptToClipboard(): Promise<boolean> {
  // Fetch migration script dari file
  // Copy ke clipboard menggunakan Clipboard API
}
```

### Database Setup Component
```typescript
// src/components/DatabaseSetupGuide.tsx
export function DatabaseSetupGuide() {
  // Show warning banner if database not fully setup
  // Provide one-click copy, download, and SQL Editor access
}
```

### Integration in App
```typescript
// src/main.tsx
// Auto-check runs after Supabase sync
const dbSetup = await isDatabaseSetup(supabase);
if (!dbSetup) {
  // Show instructions with one-click actions
}
```

## Best Practices

1. **Gunakan One-Click Copy** untuk setup tercepat
2. **Download SQL File** sebagai backup migration script
3. **Selalu run migration di database baru** sebelum mulai input data
4. **Backup database** sebelum run migration (jika database sudah ada data)
5. **Test di local** dulu sebelum deploy ke production
6. **Verifikasi 31 tabel** setelah migration
7. **Check RLS policies** jika ada masalah akses data

## Next Steps

Setelah database tersetup:
1. ✅ Login ke aplikasi
2. ✅ Setup tahun ajaran aktif
3. ✅ Input data guru
4. ✅ Input data kelas
5. ✅ Input data siswa
6. ✅ Mulai gunakan aplikasi

---

**Note**: Migration script sudah include:
- ✅ Table creation (31 tables)
- ✅ RLS policies
- ✅ Triggers untuk updated_at
- ✅ Foreign key constraints
- ✅ Indexes untuk performance
- ✅ Storage bucket setup (avatars)

**New Features**:
- 🆕 One-click copy migration script
- 🆕 Download SQL file
- 🆕 Quick access to SQL Editor
- 🆕 Auto-check & re-check database