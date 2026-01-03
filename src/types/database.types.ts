export interface AgendaMengajar {
  id: string;
  tanggal: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  materi: string;
  keterangan?: string;
  tahun_ajaran: string;
  jenis_pembelajaran?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnggotaEskul {
  id: string;
  ekstrakurikuler_id: string;
  nisn: string;
  nama_siswa: string;
  tingkat: string;
  nama_kelas: string;
  tanggal_masuk: string;
  status: string;
  user_id?: string;
  username?: string;
  password?: string;
  foto_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSessions {
  id: string;
  ekstrakurikuler_id: string;
  token: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  is_active?: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BobotPenilaianKelas {
  id: string;
  kelas_id: string;
  kategori_id: string;
  bobot: number;
  created_at?: string;
  updated_at?: string;
}

export interface CatatanKalender {
  id: string;
  tanggal: string;
  catatan: string;
  warna?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ekstrakurikuler {
  id: string;
  nama_eskul: string;
  pembimbing: string;
  hari_pertemuan: string;
  jam_pertemuan: string;
  deskripsi?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface GradeThreshold {
  id: string;
  grade: string;
  threshold: number;
}

export interface Guru {
  id: string;
  nama_guru: string;
  nip: string;
  mata_pelajaran: string;
  email: string;
  telepon?: string;
  jabatan?: string;
  kepala_sekolah_nama?: string;
  kepala_sekolah_nip?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HariLibur {
  id: string;
  tanggal: string;
  nama_libur: string;
  jenis: string;
  created_at?: string;
}

export interface HariLiburCustom {
  id: string;
  tanggal: string;
  nama_libur: string;
  created_at?: string;
}

export interface JadwalPelajaran {
  id: string;
  kelas_id: string;
  hari: string;
  jam_pelajaran_id: string;
  mata_pelajaran_id: string;
  guru_id?: string;
  tahun_ajaran: string;
  created_at?: string;
  updated_at?: string;
}

export interface JamPelajaran {
  id: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  created_at?: string;
}

export interface JenisKegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi?: string;
  created_at?: string;
}

export interface JenisPenilaian {
  id: string;
  nama_kategori: string;
  deskripsi?: string;
  urutan?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Jurnal {
  id: string;
  tanggal: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  jam_pelajaran_id: string;
  kegiatan: string;
  catatan?: string;
  tahun_ajaran: string;
  created_at?: string;
  updated_at?: string;
}

export interface JurnalTemplate {
  id: string;
  nama_template: string;
  kegiatan: string;
  catatan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Kehadiran {
  id: string;
  tanggal: string;
  nisn: string;
  kelas_id: string;
  status: string;
  keterangan?: string;
  tahun_ajaran: string;
  created_at?: string;
  updated_at?: string;
}

export interface KehadiranEskul {
  id: string;
  ekstrakurikuler_id: string;
  nisn: string;
  tanggal: string;
  status: string;
  keterangan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
  wali_kelas?: string;
  tahun_ajaran: string;
  created_at?: string;
  updated_at?: string;
}

export interface KelompokSiswa {
  id: string;
  nama_kelompok: string;
  kelas_id: string;
  mata_pelajaran_id?: string;
  anggota: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MataPelajaran {
  id: string;
  nama_pelajaran: string;
  kode_pelajaran: string;
  kelompok?: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NilaiEskul {
  id: string;
  ekstrakurikuler_id: string;
  nisn: string;
  nilai: string;
  keterangan?: string;
  tahun_ajaran: string;
  semester: string;
  created_at?: string;
  updated_at?: string;
}

export interface NilaiSiswa {
  id: string;
  nisn: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  kategori_id: string;
  nilai: number;
  keterangan?: string;
  tahun_ajaran: string;
  semester: string;
  created_at?: string;
  updated_at?: string;
}

export interface PdfFormatSettings {
  id: string;
  format_name: string;
  settings: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Pengaturan {
  id: string;
  key: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PeriodeNonPembelajaran {
  id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  nama_periode: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuickMenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nama_siswa: string;
  kelas_id?: string;
  jenis_kelamin?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  alamat?: string;
  nama_orang_tua?: string;
  telepon_orang_tua?: string;
  email?: string;
  tanggal_masuk?: string;
  status: string;
  tahun_ajaran?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LogPresensiToken {
  id: string;
  token_id: string;
  anggota_eskul_id: string;
  waktu_presensi: string;
  metode: string;
  created_at: string;
}

export interface PresensiOnlineEskul {
  id: string;
  session_id: string;
  anggota_id: string;
  waktu_presensi?: string;
  metode_input?: string;
  created_at?: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: string;
  updated_at?: string;
}

export interface TokenPresensi {
  id: string;
  ekstrakurikuler_id: string;
  token_code: string;
  qr_data?: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TahunAjaran {
  id: string;
  tahun: string;
  semester: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  nama_lengkap: string;
  role: string;
  email?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}