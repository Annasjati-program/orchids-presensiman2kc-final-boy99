import { useEffect, useState } from 'react';
import {
  agendaMengajarService,
  anggotaEskulService,
  appSettingsService,
  bobotPenilaianKelasService,
  catatanKalenderService,
  ekstrakurikulerService,
  gradeThresholdService,
  guruService,
  hariLiburService,
  hariLiburCustomService,
  jadwalPelajaranService,
  jamPelajaranService,
  jenisKegiatanService,
  jenisPenilaianService,
  jurnalService,
  jurnalTemplateService,
  kehadiranService,
  kehadiranEskulService,
  kelasService,
  kelompokSiswaService,
  mataPelajaranService,
  nilaiEskulService,
  nilaiSiswaService,
  pdfFormatSettingsService,
  pengaturanService,
  periodeNonPembelajaranService,
  profileService,
  quickMenuItemService,
  siswaService,
  tahunAjaranService,
  userService,
} from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TableStatus {
  name: string;
  count: number;
  success: boolean;
  error?: string;
}

export default function TestDatabase() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const results: TableStatus[] = [];

    const tables = [
      { name: 'Agenda Mengajar', service: agendaMengajarService },
      { name: 'Anggota Ekstrakurikuler', service: anggotaEskulService },
      { name: 'App Settings', service: appSettingsService },
      { name: 'Bobot Penilaian Kelas', service: bobotPenilaianKelasService },
      { name: 'Catatan Kalender', service: catatanKalenderService },
      { name: 'Ekstrakurikuler', service: ekstrakurikulerService },
      { name: 'Grade Thresholds', service: gradeThresholdService },
      { name: 'Guru', service: guruService },
      { name: 'Hari Libur', service: hariLiburService },
      { name: 'Hari Libur Custom', service: hariLiburCustomService },
      { name: 'Jadwal Pelajaran', service: jadwalPelajaranService },
      { name: 'Jam Pelajaran', service: jamPelajaranService },
      { name: 'Jenis Kegiatan', service: jenisKegiatanService },
      { name: 'Jenis Penilaian', service: jenisPenilaianService },
      { name: 'Jurnal', service: jurnalService },
      { name: 'Jurnal Template', service: jurnalTemplateService },
      { name: 'Kehadiran', service: kehadiranService },
      { name: 'Kehadiran Ekstrakurikuler', service: kehadiranEskulService },
      { name: 'Kelas', service: kelasService },
      { name: 'Kelompok Siswa', service: kelompokSiswaService },
      { name: 'Mata Pelajaran', service: mataPelajaranService },
      { name: 'Nilai Ekstrakurikuler', service: nilaiEskulService },
      { name: 'Nilai Siswa', service: nilaiSiswaService },
      { name: 'PDF Format Settings', service: pdfFormatSettingsService },
      { name: 'Pengaturan', service: pengaturanService },
      { name: 'Periode Non Pembelajaran', service: periodeNonPembelajaranService },
      { name: 'Profiles', service: profileService },
      { name: 'Quick Menu Items', service: quickMenuItemService },
      { name: 'Siswa', service: siswaService },
      { name: 'Tahun Ajaran', service: tahunAjaranService },
      { name: 'Users', service: userService },
    ];

    for (const table of tables) {
      try {
        const data = await table.service.getAll();
        results.push({
          name: table.name,
          count: data.length,
          success: true,
        });
      } catch (err) {
        results.push({
          name: table.name,
          count: 0,
          success: false,
          error: (err as Error).message,
        });
      }
    }

    setTableStatuses(results);
    setLoading(false);
  };

  useEffect(() => {
    testConnection();
  }, []);

  const successCount = tableStatuses.filter(t => t.success).length;
  const totalRecords = tableStatuses.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Testing connection to all 31 tables - {successCount}/31 tables connected
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Total records: {totalRecords.toLocaleString()}
          </p>
        </div>
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Refresh Test'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tableStatuses.map((table, i) => (
          <Card key={i} className={!table.success ? 'border-destructive' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{table.name}</CardTitle>
                <Badge variant={table.success ? 'default' : 'destructive'} className="text-xs">
                  {table.success ? '✓' : '✗'}
                </Badge>
              </div>
              <CardDescription>
                {table.success ? `${table.count} records` : 'Connection failed'}
              </CardDescription>
            </CardHeader>
            {!table.success && table.error && (
              <CardContent className="pt-0">
                <p className="text-xs text-destructive font-mono">{table.error}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}