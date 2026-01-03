import { supabase } from '@/supabase/client';
import type {
  AgendaMengajar,
  AnggotaEskul,
  AppSettings,
  AttendanceSessions,
  BobotPenilaianKelas,
  CatatanKalender,
  Ekstrakurikuler,
  GradeThreshold,
  Guru,
  HariLibur,
  HariLiburCustom,
  JadwalPelajaran,
  JamPelajaran,
  JenisKegiatan,
  JenisPenilaian,
  Jurnal,
  JurnalTemplate,
  Kehadiran,
  KehadiranEskul,
  Kelas,
  KelompokSiswa,
  LogPresensiToken,
  MataPelajaran,
  NilaiEskul,
  NilaiSiswa,
  PdfFormatSettings,
  Pengaturan,
  PeriodeNonPembelajaran,
  PresensiOnlineEskul,
  Profile,
  PushSubscription,
  QuickMenuItem,
  Siswa,
  TahunAjaran,
  TokenPresensi,
  User,
} from '@/types/database.types';

type TableName =
  | 'agenda_mengajar'
  | 'anggota_eskul'
  | 'app_settings'
  | 'attendance_sessions'
  | 'bobot_penilaian_kelas'
  | 'catatan_kalender'
  | 'ekstrakurikuler'
  | 'grade_thresholds'
  | 'guru'
  | 'hari_libur'
  | 'hari_libur_custom'
  | 'jadwal_pelajaran'
  | 'jam_pelajaran'
  | 'jenis_kegiatan'
  | 'jenis_penilaian'
  | 'jurnal'
  | 'jurnal_template'
  | 'kehadiran'
  | 'kehadiran_eskul'
  | 'kelas'
  | 'kelompok_siswa'
  | 'log_presensi_token'
  | 'mata_pelajaran'
  | 'nilai_eskul'
  | 'nilai_siswa'
  | 'pdf_format_settings'
  | 'pengaturan'
  | 'periode_non_pembelajaran'
  | 'presensi_online_eskul'
  | 'profiles'
  | 'push_subscriptions'
  | 'quick_menu_items'
  | 'siswa'
  | 'tahun_ajaran'
  | 'token_presensi'
  | 'users';

export class DatabaseService<T> {
  constructor(private tableName: TableName) {}

  async getAll() {
    const { data, error } = await supabase.from(this.tableName).select('*');
    return { data: data as T[] | null, error };
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    return { data: data as T | null, error };
  }

  async create(item: Partial<T>) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
    return { data: data as T | null, error };
  }

  async update(id: string, item: Partial<T>) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(item)
      .eq('id', id)
      .select()
      .single();
    return { data: data as T | null, error };
  }

  async delete(id: string) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    return { error };
  }

  async query(filters: Record<string, any>) {
    let query = supabase.from(this.tableName).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    return { data: data as T[] | null, error };
  }
}

export const agendaMengajarService = new DatabaseService<AgendaMengajar>('agenda_mengajar');
export const anggotaEskulService = new DatabaseService<AnggotaEskul>('anggota_eskul');
export const appSettingsService = new DatabaseService<AppSettings>('app_settings');
export const attendanceSessionsService = new DatabaseService<AttendanceSessions>('attendance_sessions');
export const bobotPenilaianKelasService = new DatabaseService<BobotPenilaianKelas>('bobot_penilaian_kelas');
export const catatanKalenderService = new DatabaseService<CatatanKalender>('catatan_kalender');
export const ekstrakurikulerService = new DatabaseService<Ekstrakurikuler>('ekstrakurikuler');
export const gradeThresholdService = new DatabaseService<GradeThreshold>('grade_thresholds');
export const guruService = new DatabaseService<Guru>('guru');
export const hariLiburService = new DatabaseService<HariLibur>('hari_libur');
export const hariLiburCustomService = new DatabaseService<HariLiburCustom>('hari_libur_custom');
export const jadwalPelajaranService = new DatabaseService<JadwalPelajaran>('jadwal_pelajaran');
export const jamPelajaranService = new DatabaseService<JamPelajaran>('jam_pelajaran');
export const jenisKegiatanService = new DatabaseService<JenisKegiatan>('jenis_kegiatan');
export const jenisPenilaianService = new DatabaseService<JenisPenilaian>('jenis_penilaian');
export const jurnalService = new DatabaseService<Jurnal>('jurnal');
export const jurnalTemplateService = new DatabaseService<JurnalTemplate>('jurnal_template');
export const kehadiranService = new DatabaseService<Kehadiran>('kehadiran');
export const kehadiranEskulService = new DatabaseService<KehadiranEskul>('kehadiran_eskul');
export const kelasService = new DatabaseService<Kelas>('kelas');
export const kelompokSiswaService = new DatabaseService<KelompokSiswa>('kelompok_siswa');
export const logPresensiTokenService = new DatabaseService<LogPresensiToken>('log_presensi_token');
export const mataPelajaranService = new DatabaseService<MataPelajaran>('mata_pelajaran');
export const nilaiEskulService = new DatabaseService<NilaiEskul>('nilai_eskul');
export const nilaiSiswaService = new DatabaseService<NilaiSiswa>('nilai_siswa');
export const pdfFormatSettingsService = new DatabaseService<PdfFormatSettings>('pdf_format_settings');
export const pengaturanService = new DatabaseService<Pengaturan>('pengaturan');
export const periodeNonPembelajaranService = new DatabaseService<PeriodeNonPembelajaran>('periode_non_pembelajaran');
export const presensiOnlineEskulService = new DatabaseService<PresensiOnlineEskul>('presensi_online_eskul');
export const profileService = new DatabaseService<Profile>('profiles');
export const pushSubscriptionService = new DatabaseService<PushSubscription>('push_subscriptions');
export const quickMenuItemService = new DatabaseService<QuickMenuItem>('quick_menu_items');
export const siswaService = new DatabaseService<Siswa>('siswa');
export const tahunAjaranService = new DatabaseService<TahunAjaran>('tahun_ajaran');
export const tokenPresensiService = new DatabaseService<TokenPresensi>('token_presensi');
export const userService = new DatabaseService<User>('users');