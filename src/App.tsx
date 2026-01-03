import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { schemaMigrations } from "@/lib/dataMigrations";
import { googleDriveBackup } from "@/lib/googleDriveBackup";
import { indexedDB } from "@/lib/indexedDB";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import LoginGuru from "./pages/LoginGuru";
import Dashboard from "./pages/Dashboard";

const TestDatabase = lazy(() => import("./pages/TestDatabase"));
const DatabaseIntegrationExample = lazy(() => import("./pages/DatabaseIntegrationExample"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Index = lazy(() => import("./pages/Index"));

const User = lazy(() => import("./pages/pengaturan/User"));
const Guru = lazy(() => import("./pages/pengaturan/Guru"));
const Kelas = lazy(() => import("./pages/pengaturan/Kelas"));
const Siswa = lazy(() => import("./pages/pengaturan/Siswa"));
const MataPelajaran = lazy(() => import("./pages/pengaturan/MataPelajaran"));
const JadwalPelajaran = lazy(() => import("./pages/pengaturan/JadwalPelajaran"));
const BobotPenilaian = lazy(() => import("./pages/pengaturan/BobotPenilaian"));
const TahunAjaran = lazy(() => import("./pages/pengaturan/TahunAjaran"));
const PembuatKelompok = lazy(() => import("./pages/pengaturan/PembuatKelompok"));
const FormatPDF = lazy(() => import("./pages/pengaturan/FormatPDF"));
const Notifikasi = lazy(() => import("./pages/pengaturan/Notifikasi"));

const InputNilai = lazy(() => import("./pages/penilaian/InputNilai"));
const RekapNilai = lazy(() => import("./pages/penilaian/RekapNilai"));

const InputKehadiran = lazy(() => import("./pages/kehadiran/InputKehadiran"));
const RekapKehadiran = lazy(() => import("./pages/kehadiran/RekapKehadiran"));

const ManajemenData = lazy(() => import("./pages/data/ManajemenData"));
const BackupRestore = lazy(() => import("./pages/data/BackupRestore"));
const BackupGoogleDrive = lazy(() => import("./pages/data/BackupGoogleDrive"));
const StorageMonitor = lazy(() => import("./pages/data/StorageMonitor"));
const CleanupStorage = lazy(() => import("./pages/data/CleanupStorage"));

const JurnalGuru = lazy(() => import("./pages/jurnal/JurnalGuru"));
const AgendaMengajar = lazy(() => import("./pages/jurnal/AgendaMengajar"));

const Kalender = lazy(() => import("./pages/kalender/Kalender"));

const Profil = lazy(() => import("./pages/akun/Profil"));
const Bantuan = lazy(() => import("./pages/akun/Bantuan"));

const LaporanKehadiran = lazy(() => import("./pages/laporan/LaporanKehadiran"));
const LaporanPenilaian = lazy(() => import("./pages/laporan/LaporanPenilaian"));
const LaporanJurnalGuru = lazy(() => import("./pages/laporan/LaporanJurnalGuru"));

const KelolaEkstrakurikuler = lazy(() => import("./pages/ekstrakurikuler/KelolaEkstrakurikuler"));
const KelolaAnggota = lazy(() => import("./pages/ekstrakurikuler/KelolaAnggota"));
const KehadiranEskul = lazy(() => import("./pages/ekstrakurikuler/KehadiranEskul"));
const InputNilaiEskul = lazy(() => import("./pages/ekstrakurikuler/InputNilaiEskul"));
const RekapKehadiranEskul = lazy(() => import("./pages/ekstrakurikuler/RekapKehadiranEskul"));
const GenerateToken = lazy(() => import("./pages/ekstrakurikuler/GenerateToken"));
const PresensiSiswa = lazy(() => import("./pages/ekstrakurikuler/PresensiSiswa"));

const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));
const LoginSiswa = lazy(() => import("./pages/LoginSiswa"));
const DashboardSiswa = lazy(() => import("./pages/DashboardSiswa"));
const RiwayatPresensiSiswa = lazy(() => import("./pages/RiwayatPresensiSiswa"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverReceiver />
      <BrowserRouter>
        <Routes>
          {/* Login Routes */}
          <Route path="/" element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginGuru />
            </Suspense>
          } />
          <Route path="/login-guru" element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginGuru />
            </Suspense>
          } />
          
{/* Siswa Routes - Outside DashboardLayout */}
            <Route path="/login-siswa" element={
              <Suspense fallback={<LoadingFallback />}>
                <LoginSiswa />
              </Suspense>
            } />
            <Route path="/siswa/dashboard" element={
              <AuthProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardSiswa />
                </Suspense>
              </AuthProvider>
            } />
            <Route path="/siswa/riwayat-presensi" element={
              <AuthProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <RiwayatPresensiSiswa />
                </Suspense>
              </AuthProvider>
            } />

          {/* Admin/Guru Routes - Inside DashboardLayout */}
          <Route path="/dashboard/*" element={
            <AuthProvider>
              <NotificationProvider>
                <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="test-database" element={<TestDatabase />} />
                  <Route path="database-example" element={<DatabaseIntegrationExample />} />
                  
                  {/* Pengaturan Routes */}
                  <Route path="pengaturan/user" element={<User />} />
                  <Route path="pengaturan/guru" element={<Guru />} />
                  <Route path="pengaturan/kelas" element={<Kelas />} />
                  <Route path="pengaturan/siswa" element={<Siswa />} />
                  <Route path="pengaturan/mata-pelajaran" element={<MataPelajaran />} />
                  <Route path="pengaturan/jadwal-pelajaran" element={<JadwalPelajaran />} />
                  <Route path="pengaturan/bobot-penilaian" element={<BobotPenilaian />} />
                  <Route path="pengaturan/tahun-ajaran" element={<TahunAjaran />} />
                  <Route path="pengaturan/format-pdf" element={<FormatPDF />} />
                  <Route path="pengaturan/notifikasi" element={<Notifikasi />} />
                  <Route path="pengaturan/pembuat-kelompok" element={<PembuatKelompok />} />

                  {/* Penilaian Routes */}
                  <Route path="penilaian/input-nilai" element={<InputNilai />} />
                  <Route path="penilaian/rekap-nilai" element={<RekapNilai />} />

                  {/* Kehadiran Routes */}
                  <Route path="kehadiran/input-kehadiran" element={<InputKehadiran />} />
                  <Route path="kehadiran/rekap-kehadiran" element={<RekapKehadiran />} />
                  <Route 
                    path="kehadiran/statistik-kehadiran" 
                    element={<PlaceholderPage title="Statistik Kehadiran" description="Lihat statistik kehadiran" />} 
                  />

                  {/* Jurnal Routes */}
                  <Route path="jurnal/jurnal-guru" element={<JurnalGuru />} />
                  <Route path="jurnal/agenda-mengajar" element={<AgendaMengajar />} />
                  <Route 
                    path="jurnal/input-jurnal" 
                    element={<PlaceholderPage title="Input Jurnal" description="Input jurnal mengajar" />} 
                  />

                  {/* Kalender Route */}
                  <Route path="kalender" element={<Kalender />} />

                  {/* Data Routes */}
                  <Route path="data/manajemen-data" element={<ManajemenData />} />
                  <Route path="data/backup-restore" element={<BackupRestore />} />
                  <Route path="data/backup-google-drive" element={<BackupGoogleDrive />} />
                  <Route path="data/storage-monitor" element={<StorageMonitor />} />
                  <Route path="data/cleanup-storage" element={<CleanupStorage />} />

                  {/* Laporan Routes */}
                  <Route path="laporan/kehadiran" element={<LaporanKehadiran />} />
                  <Route path="laporan/penilaian" element={<LaporanPenilaian />} />
                  <Route path="laporan/jurnal-guru" element={<LaporanJurnalGuru />} />

                  {/* Ekstrakurikuler Routes */}
                  <Route path="ekstrakurikuler/kelola" element={<KelolaEkstrakurikuler />} />
                  <Route path="ekstrakurikuler/anggota" element={<KelolaAnggota />} />
                  <Route path="ekstrakurikuler/kehadiran" element={<KehadiranEskul />} />
                  <Route path="ekstrakurikuler/generate-token" element={<GenerateToken />} />
                  <Route path="ekstrakurikuler/presensi-siswa" element={<PresensiSiswa />} />
                  <Route path="ekstrakurikuler/input-nilai" element={<InputNilaiEskul />} />
                  <Route path="ekstrakurikuler/rekap-kehadiran" element={<RekapKehadiranEskul />} />

                  {/* Akun Routes */}
                  <Route path="akun/profil" element={<Profil />} />
                  <Route path="akun/bantuan" element={<Bantuan />} />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </DashboardLayout>
            </NotificationProvider>
          </AuthProvider>
        } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;