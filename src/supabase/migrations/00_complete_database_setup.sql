-- ====================================================================
-- COMPLETE DATABASE SETUP SCRIPT FOR SISTEM PRESENSI
-- ====================================================================
-- This script contains ALL 31 tables required for the application
-- Run this script when setting up a new database
-- ====================================================================

-- ====================================================================
-- 1. CREATE CORE FUNCTIONS AND ENUMS
-- ====================================================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS 
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public;

-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'guru');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 2. CREATE USERS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'guru',
  status TEXT NOT NULL DEFAULT 'Aktif',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users data is viewable by authenticated users" ON public.users;
CREATE POLICY "Users data is viewable by authenticated users" 
ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users data can be inserted by authenticated users" ON public.users;
CREATE POLICY "Users data can be inserted by authenticated users" 
ON public.users FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users data can be updated by authenticated users" ON public.users;
CREATE POLICY "Users data can be updated by authenticated users" 
ON public.users FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users data can be deleted by authenticated users" ON public.users;
CREATE POLICY "Users data can be deleted by authenticated users" 
ON public.users FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 3. CREATE GURU TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.guru (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_guru TEXT NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  mata_pelajaran TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telepon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guru data is viewable by authenticated users" ON public.guru;
CREATE POLICY "Guru data is viewable by authenticated users" 
ON public.guru FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Guru data can be inserted by authenticated users" ON public.guru;
CREATE POLICY "Guru data can be inserted by authenticated users" 
ON public.guru FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Guru data can be updated by authenticated users" ON public.guru;
CREATE POLICY "Guru data can be updated by authenticated users" 
ON public.guru FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Guru data can be deleted by authenticated users" ON public.guru;
CREATE POLICY "Guru data can be deleted by authenticated users" 
ON public.guru FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_guru_updated_at ON public.guru;
CREATE TRIGGER update_guru_updated_at
BEFORE UPDATE ON public.guru
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 4. CREATE TAHUN_AJARAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tahun TEXT NOT NULL UNIQUE,
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tahun ajaran viewable" ON public.tahun_ajaran;
CREATE POLICY "Tahun ajaran viewable" 
ON public.tahun_ajaran FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Tahun ajaran insertable" ON public.tahun_ajaran;
CREATE POLICY "Tahun ajaran insertable" 
ON public.tahun_ajaran FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Tahun ajaran updatable" ON public.tahun_ajaran;
CREATE POLICY "Tahun ajaran updatable" 
ON public.tahun_ajaran FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Tahun ajaran deletable" ON public.tahun_ajaran;
CREATE POLICY "Tahun ajaran deletable" 
ON public.tahun_ajaran FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_tahun_ajaran_updated_at ON public.tahun_ajaran;
CREATE TRIGGER update_tahun_ajaran_updated_at
BEFORE UPDATE ON public.tahun_ajaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 5. CREATE KELAS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.kelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelas TEXT NOT NULL,
  tingkat TEXT NOT NULL,
  jurusan TEXT,
  wali_kelas_id UUID REFERENCES public.guru(id),
  tahun_ajaran TEXT NOT NULL,
  kapasitas INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kelas data is viewable by authenticated users" ON public.kelas;
CREATE POLICY "Kelas data is viewable by authenticated users" 
ON public.kelas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Kelas data can be inserted by authenticated users" ON public.kelas;
CREATE POLICY "Kelas data can be inserted by authenticated users" 
ON public.kelas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Kelas data can be updated by authenticated users" ON public.kelas;
CREATE POLICY "Kelas data can be updated by authenticated users" 
ON public.kelas FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Kelas data can be deleted by authenticated users" ON public.kelas;
CREATE POLICY "Kelas data can be deleted by authenticated users" 
ON public.kelas FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_kelas_updated_at ON public.kelas;
CREATE TRIGGER update_kelas_updated_at
BEFORE UPDATE ON public.kelas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 6. CREATE SISWA TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.siswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  nama_siswa TEXT NOT NULL,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  tanggal_lahir DATE,
  tempat_lahir TEXT,
  alamat TEXT,
  nama_orang_tua TEXT,
  telepon_orang_tua TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa data is viewable by authenticated users" ON public.siswa;
CREATE POLICY "Siswa data is viewable by authenticated users" 
ON public.siswa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Siswa data can be inserted by authenticated users" ON public.siswa;
CREATE POLICY "Siswa data can be inserted by authenticated users" 
ON public.siswa FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Siswa data can be updated by authenticated users" ON public.siswa;
CREATE POLICY "Siswa data can be updated by authenticated users" 
ON public.siswa FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Siswa data can be deleted by authenticated users" ON public.siswa;
CREATE POLICY "Siswa data can be deleted by authenticated users" 
ON public.siswa FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_siswa_updated_at ON public.siswa;
CREATE TRIGGER update_siswa_updated_at
BEFORE UPDATE ON public.siswa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 7. CREATE MATA_PELAJARAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_mata_pelajaran TEXT NOT NULL,
  kode_mata_pelajaran TEXT NOT NULL UNIQUE,
  deskripsi TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mata pelajaran data is viewable by authenticated users" ON public.mata_pelajaran;
CREATE POLICY "Mata pelajaran data is viewable by authenticated users" 
ON public.mata_pelajaran FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Mata pelajaran data can be inserted by authenticated users" ON public.mata_pelajaran;
CREATE POLICY "Mata pelajaran data can be inserted by authenticated users" 
ON public.mata_pelajaran FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Mata pelajaran data can be updated by authenticated users" ON public.mata_pelajaran;
CREATE POLICY "Mata pelajaran data can be updated by authenticated users" 
ON public.mata_pelajaran FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Mata pelajaran data can be deleted by authenticated users" ON public.mata_pelajaran;
CREATE POLICY "Mata pelajaran data can be deleted by authenticated users" 
ON public.mata_pelajaran FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_mata_pelajaran_updated_at ON public.mata_pelajaran;
CREATE TRIGGER update_mata_pelajaran_updated_at
BEFORE UPDATE ON public.mata_pelajaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 8. CREATE JAM_PELAJARAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.jam_pelajaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_jam TEXT NOT NULL,
  jam_mulai TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  urutan INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jam_pelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jam pelajaran data is viewable by authenticated users" ON public.jam_pelajaran;
CREATE POLICY "Jam pelajaran data is viewable by authenticated users" 
ON public.jam_pelajaran FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Jam pelajaran data can be inserted by authenticated users" ON public.jam_pelajaran;
CREATE POLICY "Jam pelajaran data can be inserted by authenticated users" 
ON public.jam_pelajaran FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Jam pelajaran data can be updated by authenticated users" ON public.jam_pelajaran;
CREATE POLICY "Jam pelajaran data can be updated by authenticated users" 
ON public.jam_pelajaran FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Jam pelajaran data can be deleted by authenticated users" ON public.jam_pelajaran;
CREATE POLICY "Jam pelajaran data can be deleted by authenticated users" 
ON public.jam_pelajaran FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_jam_pelajaran_updated_at ON public.jam_pelajaran;
CREATE TRIGGER update_jam_pelajaran_updated_at
BEFORE UPDATE ON public.jam_pelajaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 9. CREATE JADWAL_PELAJARAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.jadwal_pelajaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  mata_pelajaran_id UUID NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  hari TEXT NOT NULL,
  jam_ke INTEGER NOT NULL,
  jumlah_jp INTEGER NOT NULL DEFAULT 1,
  semester INTEGER NOT NULL DEFAULT 1,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jadwal_pelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jadwal pelajaran data is viewable by authenticated users" ON public.jadwal_pelajaran;
CREATE POLICY "Jadwal pelajaran data is viewable by authenticated users" 
ON public.jadwal_pelajaran FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Jadwal pelajaran data can be inserted by authenticated users" ON public.jadwal_pelajaran;
CREATE POLICY "Jadwal pelajaran data can be inserted by authenticated users" 
ON public.jadwal_pelajaran FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Jadwal pelajaran data can be updated by authenticated users" ON public.jadwal_pelajaran;
CREATE POLICY "Jadwal pelajaran data can be updated by authenticated users" 
ON public.jadwal_pelajaran FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Jadwal pelajaran data can be deleted by authenticated users" ON public.jadwal_pelajaran;
CREATE POLICY "Jadwal pelajaran data can be deleted by authenticated users" 
ON public.jadwal_pelajaran FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_jadwal_pelajaran_updated_at ON public.jadwal_pelajaran;
CREATE TRIGGER update_jadwal_pelajaran_updated_at
BEFORE UPDATE ON public.jadwal_pelajaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 10. CREATE KEHADIRAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.kehadiran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL,
  kelas_id UUID NOT NULL,
  tanggal DATE NOT NULL,
  status_kehadiran TEXT NOT NULL DEFAULT 'Hadir',
  mata_pelajaran_id UUID,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, tanggal)
);

ALTER TABLE public.kehadiran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kehadiran data is viewable by authenticated users" ON public.kehadiran;
CREATE POLICY "Kehadiran data is viewable by authenticated users" 
ON public.kehadiran FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Kehadiran data can be inserted by authenticated users" ON public.kehadiran;
CREATE POLICY "Kehadiran data can be inserted by authenticated users" 
ON public.kehadiran FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Kehadiran data can be updated by authenticated users" ON public.kehadiran;
CREATE POLICY "Kehadiran data can be updated by authenticated users" 
ON public.kehadiran FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Kehadiran data can be deleted by authenticated users" ON public.kehadiran;
CREATE POLICY "Kehadiran data can be deleted by authenticated users" 
ON public.kehadiran FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_kehadiran_updated_at ON public.kehadiran;
CREATE TRIGGER update_kehadiran_updated_at
BEFORE UPDATE ON public.kehadiran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 11. CREATE JENIS_KEGIATAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.jenis_kegiatan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kegiatan TEXT NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jenis_kegiatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jenis kegiatan data is viewable by authenticated users" ON public.jenis_kegiatan;
CREATE POLICY "Jenis kegiatan data is viewable by authenticated users" 
ON public.jenis_kegiatan FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Jenis kegiatan data can be inserted by authenticated users" ON public.jenis_kegiatan;
CREATE POLICY "Jenis kegiatan data can be inserted by authenticated users" 
ON public.jenis_kegiatan FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Jenis kegiatan data can be updated by authenticated users" ON public.jenis_kegiatan;
CREATE POLICY "Jenis kegiatan data can be updated by authenticated users" 
ON public.jenis_kegiatan FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Jenis kegiatan data can be deleted by authenticated users" ON public.jenis_kegiatan;
CREATE POLICY "Jenis kegiatan data can be deleted by authenticated users" 
ON public.jenis_kegiatan FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_jenis_kegiatan_updated_at ON public.jenis_kegiatan;
CREATE TRIGGER update_jenis_kegiatan_updated_at
BEFORE UPDATE ON public.jenis_kegiatan
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 12. CREATE JURNAL TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.jurnal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  jenis_kegiatan_id UUID NOT NULL REFERENCES public.jenis_kegiatan(id),
  uraian_kegiatan TEXT,
  volume INTEGER,
  satuan_hasil TEXT,
  guru_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jurnal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jurnal data is viewable by authenticated users" ON public.jurnal;
CREATE POLICY "Jurnal data is viewable by authenticated users" 
ON public.jurnal FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Jurnal data can be inserted by authenticated users" ON public.jurnal;
CREATE POLICY "Jurnal data can be inserted by authenticated users" 
ON public.jurnal FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Jurnal data can be updated by authenticated users" ON public.jurnal;
CREATE POLICY "Jurnal data can be updated by authenticated users" 
ON public.jurnal FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Jurnal data can be deleted by authenticated users" ON public.jurnal;
CREATE POLICY "Jurnal data can be deleted by authenticated users" 
ON public.jurnal FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_jurnal_updated_at ON public.jurnal;
CREATE TRIGGER update_jurnal_updated_at
BEFORE UPDATE ON public.jurnal
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 13. CREATE JURNAL_TEMPLATE TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.jurnal_template (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_template TEXT NOT NULL,
  jenis_kegiatan_id UUID REFERENCES public.jenis_kegiatan(id),
  uraian_kegiatan TEXT,
  volume INTEGER,
  satuan_hasil TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jurnal_template ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jurnal template viewable" ON public.jurnal_template;
CREATE POLICY "Jurnal template viewable" 
ON public.jurnal_template FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Jurnal template insertable" ON public.jurnal_template;
CREATE POLICY "Jurnal template insertable" 
ON public.jurnal_template FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Jurnal template updatable" ON public.jurnal_template;
CREATE POLICY "Jurnal template updatable" 
ON public.jurnal_template FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Jurnal template deletable" ON public.jurnal_template;
CREATE POLICY "Jurnal template deletable" 
ON public.jurnal_template FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_jurnal_template_updated_at ON public.jurnal_template;
CREATE TRIGGER update_jurnal_template_updated_at
BEFORE UPDATE ON public.jurnal_template
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 14. CREATE JENIS_PENILAIAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.jenis_penilaian (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_penilaian TEXT NOT NULL,
  kode_penilaian TEXT NOT NULL UNIQUE,
  bobot INTEGER NOT NULL DEFAULT 0,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jenis_penilaian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jenis penilaian viewable" ON public.jenis_penilaian;
CREATE POLICY "Jenis penilaian viewable" 
ON public.jenis_penilaian FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Jenis penilaian insertable" ON public.jenis_penilaian;
CREATE POLICY "Jenis penilaian insertable" 
ON public.jenis_penilaian FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Jenis penilaian updatable" ON public.jenis_penilaian;
CREATE POLICY "Jenis penilaian updatable" 
ON public.jenis_penilaian FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Jenis penilaian deletable" ON public.jenis_penilaian;
CREATE POLICY "Jenis penilaian deletable" 
ON public.jenis_penilaian FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_jenis_penilaian_updated_at ON public.jenis_penilaian;
CREATE TRIGGER update_jenis_penilaian_updated_at
BEFORE UPDATE ON public.jenis_penilaian
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 15. CREATE NILAI_SISWA TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.nilai_siswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  mata_pelajaran_id UUID NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  jenis_penilaian_id UUID NOT NULL REFERENCES public.jenis_penilaian(id) ON DELETE CASCADE,
  nilai NUMERIC(5,2) NOT NULL,
  tanggal_penilaian DATE NOT NULL,
  keterangan TEXT,
  semester INTEGER NOT NULL DEFAULT 1,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nilai_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nilai siswa viewable" ON public.nilai_siswa;
CREATE POLICY "Nilai siswa viewable" 
ON public.nilai_siswa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Nilai siswa insertable" ON public.nilai_siswa;
CREATE POLICY "Nilai siswa insertable" 
ON public.nilai_siswa FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Nilai siswa updatable" ON public.nilai_siswa;
CREATE POLICY "Nilai siswa updatable" 
ON public.nilai_siswa FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Nilai siswa deletable" ON public.nilai_siswa;
CREATE POLICY "Nilai siswa deletable" 
ON public.nilai_siswa FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_nilai_siswa_updated_at ON public.nilai_siswa;
CREATE TRIGGER update_nilai_siswa_updated_at
BEFORE UPDATE ON public.nilai_siswa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 16. CREATE BOBOT_PENILAIAN_KELAS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.bobot_penilaian_kelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  jenis_penilaian_id UUID NOT NULL REFERENCES public.jenis_penilaian(id) ON DELETE CASCADE,
  bobot INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kelas_id, jenis_penilaian_id)
);

ALTER TABLE public.bobot_penilaian_kelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bobot penilaian kelas viewable" ON public.bobot_penilaian_kelas;
CREATE POLICY "Bobot penilaian kelas viewable" 
ON public.bobot_penilaian_kelas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Bobot penilaian kelas insertable" ON public.bobot_penilaian_kelas;
CREATE POLICY "Bobot penilaian kelas insertable" 
ON public.bobot_penilaian_kelas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Bobot penilaian kelas updatable" ON public.bobot_penilaian_kelas;
CREATE POLICY "Bobot penilaian kelas updatable" 
ON public.bobot_penilaian_kelas FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Bobot penilaian kelas deletable" ON public.bobot_penilaian_kelas;
CREATE POLICY "Bobot penilaian kelas deletable" 
ON public.bobot_penilaian_kelas FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_bobot_penilaian_kelas_updated_at ON public.bobot_penilaian_kelas;
CREATE TRIGGER update_bobot_penilaian_kelas_updated_at
BEFORE UPDATE ON public.bobot_penilaian_kelas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 17. CREATE GRADE_THRESHOLDS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.grade_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade TEXT NOT NULL,
  min_nilai NUMERIC(5,2) NOT NULL,
  max_nilai NUMERIC(5,2) NOT NULL,
  predikat TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Grade thresholds viewable" ON public.grade_thresholds;
CREATE POLICY "Grade thresholds viewable" 
ON public.grade_thresholds FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grade thresholds insertable" ON public.grade_thresholds;
CREATE POLICY "Grade thresholds insertable" 
ON public.grade_thresholds FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Grade thresholds updatable" ON public.grade_thresholds;
CREATE POLICY "Grade thresholds updatable" 
ON public.grade_thresholds FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Grade thresholds deletable" ON public.grade_thresholds;
CREATE POLICY "Grade thresholds deletable" 
ON public.grade_thresholds FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_grade_thresholds_updated_at ON public.grade_thresholds;
CREATE TRIGGER update_grade_thresholds_updated_at
BEFORE UPDATE ON public.grade_thresholds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 18. CREATE EKSTRAKURIKULER TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.ekstrakurikuler (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_eskul TEXT NOT NULL,
  pembimbing TEXT NOT NULL,
  hari_pertemuan TEXT NOT NULL,
  jam_pertemuan TEXT NOT NULL,
  deskripsi TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ekstrakurikuler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ekstrakurikuler data is viewable by authenticated users" ON public.ekstrakurikuler;
CREATE POLICY "Ekstrakurikuler data is viewable by authenticated users" 
ON public.ekstrakurikuler FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Ekstrakurikuler data can be inserted by authenticated users" ON public.ekstrakurikuler;
CREATE POLICY "Ekstrakurikuler data can be inserted by authenticated users" 
ON public.ekstrakurikuler FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Ekstrakurikuler data can be updated by authenticated users" ON public.ekstrakurikuler;
CREATE POLICY "Ekstrakurikuler data can be updated by authenticated users" 
ON public.ekstrakurikuler FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Ekstrakurikuler data can be deleted by authenticated users" ON public.ekstrakurikuler;
CREATE POLICY "Ekstrakurikuler data can be deleted by authenticated users" 
ON public.ekstrakurikuler FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_ekstrakurikuler_updated_at ON public.ekstrakurikuler;
CREATE TRIGGER update_ekstrakurikuler_updated_at
BEFORE UPDATE ON public.ekstrakurikuler
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 19. CREATE ANGGOTA_ESKUL TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.anggota_eskul (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eskul_id UUID NOT NULL REFERENCES public.ekstrakurikuler(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  tanggal_bergabung DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(eskul_id, siswa_id)
);

ALTER TABLE public.anggota_eskul ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anggota eskul viewable" ON public.anggota_eskul;
CREATE POLICY "Anggota eskul viewable" 
ON public.anggota_eskul FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anggota eskul insertable" ON public.anggota_eskul;
CREATE POLICY "Anggota eskul insertable" 
ON public.anggota_eskul FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anggota eskul updatable" ON public.anggota_eskul;
CREATE POLICY "Anggota eskul updatable" 
ON public.anggota_eskul FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Anggota eskul deletable" ON public.anggota_eskul;
CREATE POLICY "Anggota eskul deletable" 
ON public.anggota_eskul FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_anggota_eskul_updated_at ON public.anggota_eskul;
CREATE TRIGGER update_anggota_eskul_updated_at
BEFORE UPDATE ON public.anggota_eskul
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 20. CREATE KEHADIRAN_ESKUL TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.kehadiran_eskul (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anggota_eskul_id UUID NOT NULL REFERENCES public.anggota_eskul(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  status_kehadiran TEXT NOT NULL DEFAULT 'Hadir',
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(anggota_eskul_id, tanggal)
);

ALTER TABLE public.kehadiran_eskul ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kehadiran eskul viewable" ON public.kehadiran_eskul;
CREATE POLICY "Kehadiran eskul viewable" 
ON public.kehadiran_eskul FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Kehadiran eskul insertable" ON public.kehadiran_eskul;
CREATE POLICY "Kehadiran eskul insertable" 
ON public.kehadiran_eskul FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Kehadiran eskul updatable" ON public.kehadiran_eskul;
CREATE POLICY "Kehadiran eskul updatable" 
ON public.kehadiran_eskul FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Kehadiran eskul deletable" ON public.kehadiran_eskul;
CREATE POLICY "Kehadiran eskul deletable" 
ON public.kehadiran_eskul FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_kehadiran_eskul_updated_at ON public.kehadiran_eskul;
CREATE TRIGGER update_kehadiran_eskul_updated_at
BEFORE UPDATE ON public.kehadiran_eskul
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 21. CREATE NILAI_ESKUL TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.nilai_eskul (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anggota_eskul_id UUID NOT NULL REFERENCES public.anggota_eskul(id) ON DELETE CASCADE,
  nilai NUMERIC(5,2) NOT NULL,
  predikat TEXT,
  keterangan TEXT,
  semester INTEGER NOT NULL DEFAULT 1,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nilai_eskul ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nilai eskul viewable" ON public.nilai_eskul;
CREATE POLICY "Nilai eskul viewable" 
ON public.nilai_eskul FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Nilai eskul insertable" ON public.nilai_eskul;
CREATE POLICY "Nilai eskul insertable" 
ON public.nilai_eskul FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Nilai eskul updatable" ON public.nilai_eskul;
CREATE POLICY "Nilai eskul updatable" 
ON public.nilai_eskul FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Nilai eskul deletable" ON public.nilai_eskul;
CREATE POLICY "Nilai eskul deletable" 
ON public.nilai_eskul FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_nilai_eskul_updated_at ON public.nilai_eskul;
CREATE TRIGGER update_nilai_eskul_updated_at
BEFORE UPDATE ON public.nilai_eskul
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 22. CREATE KELOMPOK_SISWA TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.kelompok_siswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelompok TEXT NOT NULL,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kelompok_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kelompok siswa viewable" ON public.kelompok_siswa;
CREATE POLICY "Kelompok siswa viewable" 
ON public.kelompok_siswa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Kelompok siswa insertable" ON public.kelompok_siswa;
CREATE POLICY "Kelompok siswa insertable" 
ON public.kelompok_siswa FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Kelompok siswa updatable" ON public.kelompok_siswa;
CREATE POLICY "Kelompok siswa updatable" 
ON public.kelompok_siswa FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Kelompok siswa deletable" ON public.kelompok_siswa;
CREATE POLICY "Kelompok siswa deletable" 
ON public.kelompok_siswa FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_kelompok_siswa_updated_at ON public.kelompok_siswa;
CREATE TRIGGER update_kelompok_siswa_updated_at
BEFORE UPDATE ON public.kelompok_siswa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 23. CREATE PENGATURAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.pengaturan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengaturan viewable" ON public.pengaturan;
CREATE POLICY "Pengaturan viewable" 
ON public.pengaturan FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Pengaturan insertable" ON public.pengaturan;
CREATE POLICY "Pengaturan insertable" 
ON public.pengaturan FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Pengaturan updatable" ON public.pengaturan;
CREATE POLICY "Pengaturan updatable" 
ON public.pengaturan FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Pengaturan deletable" ON public.pengaturan;
CREATE POLICY "Pengaturan deletable" 
ON public.pengaturan FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_pengaturan_updated_at ON public.pengaturan;
CREATE TRIGGER update_pengaturan_updated_at
BEFORE UPDATE ON public.pengaturan
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 24. CREATE APP_SETTINGS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App settings viewable" ON public.app_settings;
CREATE POLICY "App settings viewable" 
ON public.app_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "App settings insertable" ON public.app_settings;
CREATE POLICY "App settings insertable" 
ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "App settings updatable" ON public.app_settings;
CREATE POLICY "App settings updatable" 
ON public.app_settings FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "App settings deletable" ON public.app_settings;
CREATE POLICY "App settings deletable" 
ON public.app_settings FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 25. CREATE PDF_FORMAT_SETTINGS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.pdf_format_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  font_size INTEGER DEFAULT 12,
  line_height NUMERIC(3,1) DEFAULT 1.5,
  margin_top INTEGER DEFAULT 20,
  margin_bottom INTEGER DEFAULT 20,
  margin_left INTEGER DEFAULT 20,
  margin_right INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_format_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PDF format settings viewable" ON public.pdf_format_settings;
CREATE POLICY "PDF format settings viewable" 
ON public.pdf_format_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "PDF format settings insertable" ON public.pdf_format_settings;
CREATE POLICY "PDF format settings insertable" 
ON public.pdf_format_settings FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "PDF format settings updatable" ON public.pdf_format_settings;
CREATE POLICY "PDF format settings updatable" 
ON public.pdf_format_settings FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "PDF format settings deletable" ON public.pdf_format_settings;
CREATE POLICY "PDF format settings deletable" 
ON public.pdf_format_settings FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_pdf_format_settings_updated_at ON public.pdf_format_settings;
CREATE TRIGGER update_pdf_format_settings_updated_at
BEFORE UPDATE ON public.pdf_format_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 26. CREATE QUICK_MENU_ITEMS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.quick_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  menu_id TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quick menu items viewable" ON public.quick_menu_items;
CREATE POLICY "Quick menu items viewable" 
ON public.quick_menu_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Quick menu items insertable" ON public.quick_menu_items;
CREATE POLICY "Quick menu items insertable" 
ON public.quick_menu_items FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Quick menu items updatable" ON public.quick_menu_items;
CREATE POLICY "Quick menu items updatable" 
ON public.quick_menu_items FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Quick menu items deletable" ON public.quick_menu_items;
CREATE POLICY "Quick menu items deletable" 
ON public.quick_menu_items FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_quick_menu_items_updated_at ON public.quick_menu_items;
CREATE TRIGGER update_quick_menu_items_updated_at
BEFORE UPDATE ON public.quick_menu_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 27. CREATE AGENDA_MENGAJAR TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.agenda_mengajar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guru_id UUID REFERENCES public.guru(id),
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  mata_pelajaran_id UUID NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  jam_ke INTEGER NOT NULL,
  materi TEXT NOT NULL,
  metode_pembelajaran TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_mengajar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agenda mengajar viewable" ON public.agenda_mengajar;
CREATE POLICY "Agenda mengajar viewable" 
ON public.agenda_mengajar FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Agenda mengajar insertable" ON public.agenda_mengajar;
CREATE POLICY "Agenda mengajar insertable" 
ON public.agenda_mengajar FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Agenda mengajar updatable" ON public.agenda_mengajar;
CREATE POLICY "Agenda mengajar updatable" 
ON public.agenda_mengajar FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Agenda mengajar deletable" ON public.agenda_mengajar;
CREATE POLICY "Agenda mengajar deletable" 
ON public.agenda_mengajar FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_agenda_mengajar_updated_at ON public.agenda_mengajar;
CREATE TRIGGER update_agenda_mengajar_updated_at
BEFORE UPDATE ON public.agenda_mengajar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 28. CREATE CATATAN_KALENDER TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.catatan_kalender (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  jenis TEXT NOT NULL DEFAULT 'umum',
  warna TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.catatan_kalender ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Catatan kalender viewable" ON public.catatan_kalender;
CREATE POLICY "Catatan kalender viewable" 
ON public.catatan_kalender FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Catatan kalender insertable" ON public.catatan_kalender;
CREATE POLICY "Catatan kalender insertable" 
ON public.catatan_kalender FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Catatan kalender updatable" ON public.catatan_kalender;
CREATE POLICY "Catatan kalender updatable" 
ON public.catatan_kalender FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Catatan kalender deletable" ON public.catatan_kalender;
CREATE POLICY "Catatan kalender deletable" 
ON public.catatan_kalender FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_catatan_kalender_updated_at ON public.catatan_kalender;
CREATE TRIGGER update_catatan_kalender_updated_at
BEFORE UPDATE ON public.catatan_kalender
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 29. CREATE PERIODE_NON_PEMBELAJARAN TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.periode_non_pembelajaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_periode TEXT NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  deskripsi TEXT,
  jenis TEXT NOT NULL DEFAULT 'libur',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.periode_non_pembelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Periode non pembelajaran viewable" ON public.periode_non_pembelajaran;
CREATE POLICY "Periode non pembelajaran viewable" 
ON public.periode_non_pembelajaran FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Periode non pembelajaran insertable" ON public.periode_non_pembelajaran;
CREATE POLICY "Periode non pembelajaran insertable" 
ON public.periode_non_pembelajaran FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Periode non pembelajaran updatable" ON public.periode_non_pembelajaran;
CREATE POLICY "Periode non pembelajaran updatable" 
ON public.periode_non_pembelajaran FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Periode non pembelajaran deletable" ON public.periode_non_pembelajaran;
CREATE POLICY "Periode non pembelajaran deletable" 
ON public.periode_non_pembelajaran FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_periode_non_pembelajaran_updated_at ON public.periode_non_pembelajaran;
CREATE TRIGGER update_periode_non_pembelajaran_updated_at
BEFORE UPDATE ON public.periode_non_pembelajaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 30. CREATE HARI_LIBUR TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.hari_libur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL UNIQUE,
  nama_libur TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'nasional',
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hari_libur ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hari libur viewable" ON public.hari_libur;
CREATE POLICY "Hari libur viewable" 
ON public.hari_libur FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hari libur insertable" ON public.hari_libur;
CREATE POLICY "Hari libur insertable" 
ON public.hari_libur FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Hari libur updatable" ON public.hari_libur;
CREATE POLICY "Hari libur updatable" 
ON public.hari_libur FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Hari libur deletable" ON public.hari_libur;
CREATE POLICY "Hari libur deletable" 
ON public.hari_libur FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_hari_libur_updated_at ON public.hari_libur;
CREATE TRIGGER update_hari_libur_updated_at
BEFORE UPDATE ON public.hari_libur
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 31. CREATE HARI_LIBUR_CUSTOM TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.hari_libur_custom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL UNIQUE,
  nama_libur TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'custom',
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hari_libur_custom ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hari libur custom viewable" ON public.hari_libur_custom;
CREATE POLICY "Hari libur custom viewable" 
ON public.hari_libur_custom FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hari libur custom insertable" ON public.hari_libur_custom;
CREATE POLICY "Hari libur custom insertable" 
ON public.hari_libur_custom FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Hari libur custom updatable" ON public.hari_libur_custom;
CREATE POLICY "Hari libur custom updatable" 
ON public.hari_libur_custom FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Hari libur custom deletable" ON public.hari_libur_custom;
CREATE POLICY "Hari libur custom deletable" 
ON public.hari_libur_custom FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_hari_libur_custom_updated_at ON public.hari_libur_custom;
CREATE TRIGGER update_hari_libur_custom_updated_at
BEFORE UPDATE ON public.hari_libur_custom
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 32. CREATE PROFILES TABLE (Supabase Auth Extension)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable" ON public.profiles;
CREATE POLICY "Profiles viewable" 
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles insertable" ON public.profiles;
CREATE POLICY "Profiles insertable" 
ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles updatable" ON public.profiles;
CREATE POLICY "Profiles updatable" 
ON public.profiles FOR UPDATE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 33. CREATE STORAGE BUCKETS
-- ====================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ====================================================================
-- SETUP COMPLETE - ALL 31 TABLES CREATED
-- ====================================================================
