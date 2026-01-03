import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, Calendar } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PresensiLog {
  id: string;
  tanggal: string;
  status_kehadiran: string;
  keterangan: string | null;
  created_at: string;
  metode?: string;
  token_code?: string;
}

export default function RiwayatPresensiSiswa() {
  const navigate = useNavigate();
  const [siswaData, setSiswaData] = useState<any>(null);
  const [eskulData, setEskulData] = useState<any[]>([]);
  const [riwayatPresensi, setRiwayatPresensi] = useState<PresensiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const siswaLoggedIn = localStorage.getItem('siswa_logged_in');
    
    if (!siswaLoggedIn) {
      navigate('/login-siswa', { replace: true });
      return;
    }
    
    if (user && (user.role === 'admin' || user.role === 'guru')) {
      navigate('/', { replace: true });
      return;
    }
    
    loadData(siswaLoggedIn);
  }, [navigate, user]);

  const loadData = async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      setSiswaData(parsedData);
      loadRiwayatPresensi(parsedData.id);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    }
  };

  const loadRiwayatPresensi = async (anggotaEskulId: string) => {
    try {
      setLoading(true);
      const { data: kehadiranData, error } = await supabase
        .from("kehadiran_eskul")
        .select("id, tanggal, status_kehadiran, keterangan, created_at")
        .eq("anggota_id", anggotaEskulId)
        .order("tanggal", { ascending: false });

      if (error) throw error;

      const idsToFetch = (kehadiranData || []).map((k: any) => k.id);
      
      let logMap: Record<string, any> = {};
      if (idsToFetch.length > 0) {
        const kehadiranDates = (kehadiranData || []).map((k: any) => k.tanggal);
        
        const { data: logData } = await supabase
          .from("log_presensi_token")
          .select(`
            metode,
            waktu_presensi,
            token_presensi (
              token_code,
              tanggal
            )
          `)
          .eq("anggota_eskul_id", anggotaEskulId)
          .in("token_presensi.tanggal", kehadiranDates);

        if (logData) {
          logData.forEach((log: any) => {
            const tanggal = log.token_presensi?.tanggal;
            if (tanggal) {
              logMap[tanggal] = {
                metode: log.metode,
                token_code: log.token_presensi?.token_code
              };
            }
          });
        }
      }

      const formattedData = (kehadiranData || []).map((item: any) => ({
        id: item.id,
        tanggal: item.tanggal,
        status_kehadiran: item.status_kehadiran,
        keterangan: item.keterangan,
        created_at: item.created_at,
        metode: logMap[item.tanggal]?.metode || "-",
        token_code: logMap[item.tanggal]?.token_code || "-",
      }));

      setRiwayatPresensi(formattedData);
    } catch (error) {
      console.error("Error loading riwayat presensi:", error);
      toast.error("Gagal memuat riwayat presensi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hadir":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hadir</Badge>;
      case "Izin":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Izin</Badge>;
      case "Sakit":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Sakit</Badge>;
      case "Alpha":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alpha</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMetodeBadge = (metode: string) => {
    if (metode === "-") return null;
    switch (metode) {
      case "qr_scan":
        return <Badge variant="outline" className="text-xs">QR Scan</Badge>;
      case "input_manual":
        return <Badge variant="outline" className="text-xs">Input Manual</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{metode}</Badge>;
    }
  };

  const calculateStats = () => {
    const stats = {
      totalHadir: riwayatPresensi.filter((r) => r.status_kehadiran === "Hadir").length,
      totalIzin: riwayatPresensi.filter((r) => r.status_kehadiran === "Izin").length,
      totalSakit: riwayatPresensi.filter((r) => r.status_kehadiran === "Sakit").length,
      totalAlpha: riwayatPresensi.filter((r) => r.status_kehadiran === "Alpha").length,
      total: riwayatPresensi.length,
    };
    const persentase = stats.total > 0 ? Math.round((stats.totalHadir / stats.total) * 100) : 0;
    return { ...stats, persentase };
  };

  const stats = calculateStats();

  if (!siswaData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <Button
            onClick={() => navigate("/siswa/dashboard")}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Riwayat Presensi</h1>
            <p className="text-sm text-muted-foreground">{siswaData.nama}</p>
          </div>
</div>

          {!loading && riwayatPresensi.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.totalHadir}</p>
                  <p className="text-sm text-muted-foreground">Hadir</p>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalIzin}</p>
                  <p className="text-sm text-muted-foreground">Izin</p>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.totalSakit}</p>
                  <p className="text-sm text-muted-foreground">Sakit</p>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.totalAlpha}</p>
                  <p className="text-sm text-muted-foreground">Alpha</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4" />
              Daftar Kehadiran
            </CardTitle>
            {!loading && riwayatPresensi.length > 0 && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Persentase Kehadiran:</span>{" "}
                  <span className="font-bold text-lg">{stats.persentase}%</span>
                  <span className="ml-3 text-muted-foreground">
                    ({stats.totalHadir} dari {stats.total} pertemuan)
                  </span>
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data...
              </div>
            ) : riwayatPresensi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada riwayat presensi
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-center">Waktu</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatPresensi.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(item.tanggal)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {formatTime(item.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(item.status_kehadiran)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}