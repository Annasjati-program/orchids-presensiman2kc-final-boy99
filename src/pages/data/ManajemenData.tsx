import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Users, BookOpen, GraduationCap, School, Calendar, FileText, Database, Trash, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/common/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DeleteYearDataDialog } from "@/components/data/DeleteYearDataDialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { indexedDB } from "@/lib/indexedDB";

interface DataStats {
  guru: number;
  kelas: number;
  mata_pelajaran: number;
  siswa: number;
  kehadiran: number;
  jenis_kegiatan: number;
  jurnal: number;
  nilai_siswa: number;
  jenis_penilaian: number;
  jadwal_pelajaran: number;
  jam_pelajaran: number;
  agenda_mengajar: number;
  catatan_kalender: number;
  hari_libur: number;
  ekstrakurikuler: number;
  anggota_eskul: number;
  kehadiran_eskul: number;
  nilai_eskul: number;
  tahun_ajaran: number;
}

const ManajemenData = () => {
  const [stats, setStats] = useState<DataStats>({
    guru: 0,
    kelas: 0,
    mata_pelajaran: 0,
    siswa: 0,
    kehadiran: 0,
    jenis_kegiatan: 0,
    jurnal: 0,
    nilai_siswa: 0,
    jenis_penilaian: 0,
    jadwal_pelajaran: 0,
    jam_pelajaran: 0,
    agenda_mengajar: 0,
    catatan_kalender: 0,
    hari_libur: 0,
    ekstrakurikuler: 0,
    anggota_eskul: 0,
    kehadiran_eskul: 0,
    nilai_eskul: 0,
    tahun_ajaran: 0
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [deleteYearDialogOpen, setDeleteYearDialogOpen] = useState(false);
  const [selectedYearStats, setSelectedYearStats] = useState<any>(null);
  const [yearDataStats, setYearDataStats] = useState<any[]>([]);
  const { toast } = useToast();

  const syncFromSupabase = async () => {
    setSyncing(true);
    try {
      await indexedDB.syncFromSupabase();
      toast({
        variant: "success",
        title: "Sinkronisasi Berhasil",
        description: "Data lokal berhasil diperbarui dari server"
      });
      window.location.reload();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Error",
        description: "Gagal menyinkronkan data dari server",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Fetch data statistics
  const fetchStats = async () => {
    try {
      const [
        { count: guruCount },
        { count: kelasCount },
        { count: mataPelajaranCount },
        { count: siswaCount },
        { count: kehadiranCount },
        { count: jenisKegiatanCount },
        { count: jurnalCount },
        { count: nilaiSiswaCount },
        { count: jenisPenilaianCount },
        { count: jadwalPelajaranCount },
        { count: jamPelajaranCount },
        { count: agendaMengajarCount },
        { count: catatanKalenderCount },
        { count: hariLiburCount },
        { count: ekstrakurikulerCount },
        { count: anggotaEskulCount },
        { count: kehadiranEskulCount },
        { count: nilaiEskulCount },
        { count: tahunAjaranCount }
      ] = await Promise.all([
        supabase.from('guru').select('*', { count: 'exact', head: true }),
        supabase.from('kelas').select('*', { count: 'exact', head: true }),
        supabase.from('mata_pelajaran').select('*', { count: 'exact', head: true }),
        supabase.from('siswa').select('*', { count: 'exact', head: true }),
        supabase.from('kehadiran').select('*', { count: 'exact', head: true }),
        supabase.from('jenis_kegiatan').select('*', { count: 'exact', head: true }),
        supabase.from('jurnal').select('*', { count: 'exact', head: true }),
        supabase.from('nilai_siswa').select('*', { count: 'exact', head: true }),
        supabase.from('jenis_penilaian').select('*', { count: 'exact', head: true }),
        supabase.from('jadwal_pelajaran').select('*', { count: 'exact', head: true }),
        supabase.from('jam_pelajaran').select('*', { count: 'exact', head: true }),
        supabase.from('agenda_mengajar').select('*', { count: 'exact', head: true }),
        supabase.from('catatan_kalender').select('*', { count: 'exact', head: true }),
        supabase.from('hari_libur').select('*', { count: 'exact', head: true }),
        supabase.from('ekstrakurikuler').select('*', { count: 'exact', head: true }),
        supabase.from('anggota_eskul').select('*', { count: 'exact', head: true }),
        supabase.from('kehadiran_eskul').select('*', { count: 'exact', head: true }),
        supabase.from('nilai_eskul').select('*', { count: 'exact', head: true }),
        supabase.from('tahun_ajaran').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        guru: guruCount || 0,
        kelas: kelasCount || 0,
        mata_pelajaran: mataPelajaranCount || 0,
        siswa: siswaCount || 0,
        kehadiran: kehadiranCount || 0,
        jenis_kegiatan: jenisKegiatanCount || 0,
        jurnal: jurnalCount || 0,
        nilai_siswa: nilaiSiswaCount || 0,
        jenis_penilaian: jenisPenilaianCount || 0,
        jadwal_pelajaran: jadwalPelajaranCount || 0,
        jam_pelajaran: jamPelajaranCount || 0,
        agenda_mengajar: agendaMengajarCount || 0,
        catatan_kalender: catatanKalenderCount || 0,
        hari_libur: hariLiburCount || 0,
        ekstrakurikuler: ekstrakurikulerCount || 0,
        anggota_eskul: anggotaEskulCount || 0,
        kehadiran_eskul: kehadiranEskulCount || 0,
        nilai_eskul: nilaiEskulCount || 0,
        tahun_ajaran: tahunAjaranCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    loadYearDataStats();
  }, []);

  const loadYearDataStats = async () => {
    try {
      const { data: years } = await supabase.from('tahun_ajaran').select('nama_tahun_ajaran').order('nama_tahun_ajaran');
      if (!years) return;

      const [
        { data: allKelas },
        { data: allSiswa },
        { data: allNilai },
        { data: allKehadiran },
        { data: allJadwal },
        { data: allAgenda }
      ] = await Promise.all([
        supabase.from('kelas').select('*'),
        supabase.from('siswa').select('*'),
        supabase.from('nilai_siswa').select('*'),
        supabase.from('kehadiran').select('*'),
        supabase.from('jadwal_pelajaran').select('*'),
        supabase.from('agenda_mengajar').select('*')
      ]);
      
      const statsPerYear = years.map((year) => {
        const kelasInYear = allKelas?.filter((k: any) => k.tahun_ajaran === year.nama_tahun_ajaran) || [];
        const kelasIds = kelasInYear.map((k: any) => k.id);
        const siswaInYear = allSiswa?.filter((s: any) => kelasIds.includes(s.kelas_id)) || [];
        const siswaIds = siswaInYear.map((s: any) => s.id);
        
        return {
          tahunAjaran: year.nama_tahun_ajaran,
          totalKelas: kelasInYear.length,
          totalSiswa: siswaInYear.length,
          totalNilai: allNilai?.filter((n: any) => siswaIds.includes(n.siswa_id) && n.tahun_ajaran === year.nama_tahun_ajaran).length || 0,
          totalKehadiran: allKehadiran?.filter((k: any) => kelasIds.includes(k.kelas_id)).length || 0,
          totalJadwal: allJadwal?.filter((j: any) => j.tahun_ajaran === year.nama_tahun_ajaran).length || 0,
          totalAgenda: allAgenda?.filter((a: any) => a.tahun_ajaran === year.nama_tahun_ajaran).length || 0,
        };
      });
      
      setYearDataStats(statsPerYear.sort((a, b) => a.tahunAjaran.localeCompare(b.tahunAjaran)));
    } catch (error) {
      console.error("Error loading year data stats:", error);
    }
  };

  const handleDeleteYearClick = (yearStats: any) => {
    setSelectedYearStats(yearStats);
    setDeleteYearDialogOpen(true);
  };

  // Delete all data from a table
  const deleteAllData = async (tableName: string, displayName: string) => {
    setDeleting(tableName);
    try {
      const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;

      toast({
        variant: "success",
        title: "Berhasil Dihapus",
        description: `Semua ${displayName} berhasil dihapus`
      });

      fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus semua ${displayName}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const dataTypes = [
    { key: 'guru', title: 'Guru', icon: Users, count: stats.guru },
    { key: 'mata_pelajaran', title: 'Mata Pelajaran', icon: BookOpen, count: stats.mata_pelajaran },
    { key: 'kelas', title: 'Kelas', icon: School, count: stats.kelas },
    { key: 'siswa', title: 'Siswa', icon: GraduationCap, count: stats.siswa },
    { key: 'tahun_ajaran', title: 'Tahun Ajaran', icon: Calendar, count: stats.tahun_ajaran },
    { key: 'nilai_siswa', title: 'Nilai Siswa', icon: FileText, count: stats.nilai_siswa },
    { key: 'jenis_penilaian', title: 'Jenis Penilaian', icon: Database, count: stats.jenis_penilaian },
    { key: 'kehadiran', title: 'Kehadiran', icon: Calendar, count: stats.kehadiran },
    { key: 'jadwal_pelajaran', title: 'Jadwal Pelajaran', icon: Calendar, count: stats.jadwal_pelajaran },
    { key: 'jam_pelajaran', title: 'Jam Pelajaran', icon: Calendar, count: stats.jam_pelajaran },
    { key: 'jenis_kegiatan', title: 'Jenis Kegiatan', icon: Database, count: stats.jenis_kegiatan },
    { key: 'jurnal', title: 'Jurnal', icon: FileText, count: stats.jurnal },
    { key: 'agenda_mengajar', title: 'Agenda Mengajar', icon: FileText, count: stats.agenda_mengajar },
    { key: 'catatan_kalender', title: 'Catatan Kalender', icon: Calendar, count: stats.catatan_kalender },
    { key: 'hari_libur', title: 'Hari Libur', icon: Calendar, count: stats.hari_libur },
    { key: 'ekstrakurikuler', title: 'Ekstrakurikuler', icon: GraduationCap, count: stats.ekstrakurikuler },
    { key: 'anggota_eskul', title: 'Anggota Eskul', icon: Users, count: stats.anggota_eskul },
    { key: 'kehadiran_eskul', title: 'Kehadiran Eskul', icon: Calendar, count: stats.kehadiran_eskul },
    { key: 'nilai_eskul', title: 'Nilai Eskul', icon: FileText, count: stats.nilai_eskul }
  ];

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Manajemen Data" 
        description="Kelola dan hapus data sistem"
      />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs sm:text-sm">
          Penghapusan data bersifat <strong>permanen</strong> dan tidak dapat dibatalkan. Backup terlebih dahulu.
        </AlertDescription>
      </Alert>

      {/* Sync from Supabase */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sinkronisasi Data
          </CardTitle>
          <CardDescription className="text-xs">
            Sinkronkan data lokal dengan server. Gunakan jika data lokal tidak sesuai dengan server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyinkronkan...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync dari Server
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Konfirmasi Sinkronisasi
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm">
                  Data lokal akan ditimpa dengan data dari server Supabase.
                  <br />
                  <span className="font-medium">Halaman akan dimuat ulang setelah sinkronisasi.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="m-0">Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={syncFromSupabase}
                  className="m-0"
                >
                  Sync Sekarang
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Hapus Data Master</CardTitle>
          <CardDescription className="text-xs">Hapus semua data per kategori</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <div className="grid grid-cols-[1fr,60px,50px] sm:grid-cols-[1fr,80px,60px] gap-2 p-2 text-xs font-medium bg-muted/50 min-w-[300px]">
              <div>Kategori</div>
              <div className="text-center">Jumlah</div>
              <div className="text-center">Aksi</div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto min-w-[300px]">
                {dataTypes.map((dataType) => {
                  const Icon = dataType.icon;
                  const isDeleting = deleting === dataType.key;
                  
                  return (
                    <div 
                      key={dataType.key} 
                      className="grid grid-cols-[1fr,60px,50px] sm:grid-cols-[1fr,80px,60px] gap-2 p-2 items-center hover:bg-muted/30 transition-colors text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate text-xs sm:text-sm">{dataType.title}</span>
                      </div>
                      
                      <div className="flex justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {dataType.count}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-center items-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isDeleting || dataType.count === 0}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                                Konfirmasi Penghapusan
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-xs sm:text-sm">
                                Anda akan menghapus <strong>{dataType.count} record</strong> dari {dataType.title}.
                                <br />
                                <span className="text-destructive font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="m-0">Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteAllData(dataType.key, dataType.title)}
                                className="m-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Year Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Trash className="h-4 w-4 text-destructive" />
            Hapus Per Tahun Ajaran
          </CardTitle>
          <CardDescription className="text-xs">Hapus semua data terkait tahun ajaran tertentu</CardDescription>
        </CardHeader>
        <CardContent>
          {yearDataStats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Tidak ada data tahun ajaran
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <div className="grid grid-cols-[1fr,auto] sm:grid-cols-[1fr,auto,auto] gap-2 p-2 text-xs font-medium bg-muted/50 min-w-[300px]">
                <div>Tahun Ajaran</div>
                <div className="text-center hidden sm:block w-24">Total Data</div>
                <div className="w-16 sm:w-20 text-center">Aksi</div>
              </div>
              
              <div className="divide-y min-w-[300px]">
                {yearDataStats.map((yearStat) => {
                  const totalData = yearStat.totalKelas + yearStat.totalSiswa + yearStat.totalNilai + 
                                  yearStat.totalKehadiran + yearStat.totalJadwal + yearStat.totalAgenda;
                  
                  return (
                    <div 
                      key={yearStat.tahunAjaran}
                      className="grid grid-cols-[1fr,auto] sm:grid-cols-[1fr,auto,auto] gap-2 p-2 items-center hover:bg-muted/30 transition-colors text-xs sm:text-sm"
                    >
                      <div>
                        <div className="font-medium">{yearStat.tahunAjaran}</div>
                        <div className="text-xs text-muted-foreground">
                          Kelas: {yearStat.totalKelas} • Siswa: {yearStat.totalSiswa} • Nilai: {yearStat.totalNilai}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          Total: <Badge variant="secondary" className="text-xs ml-1">{totalData}</Badge>
                        </div>
                      </div>
                      
                      <div className="text-center w-24 hidden sm:block">
                        <Badge variant="secondary" className="text-xs">
                          {totalData}
                        </Badge>
                      </div>
                      
                      <div className="w-16 sm:w-20 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteYearClick(yearStat)}
                          disabled={totalData === 0}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteYearDataDialog
        open={deleteYearDialogOpen}
        onOpenChange={setDeleteYearDialogOpen}
        yearStats={selectedYearStats}
        onDeleteSuccess={() => {
          fetchStats();
          loadYearDataStats();
        }}
      />
    </div>
  );
};

export default ManajemenData;