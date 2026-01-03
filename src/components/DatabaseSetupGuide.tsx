import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, ExternalLink, Copy, Download } from 'lucide-react';
import { isDatabaseSetup } from '@/lib/autoMigration';
import { copyMigrationScriptToClipboard } from '@/lib/migrationExecutor';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function DatabaseSetupGuide() {
  const [isSetup, setIsSetup] = useState<boolean>(true);
  const [checking, setChecking] = useState(true);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    const cacheKey = 'db_setup_status';
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { isSetup: cachedSetup, timestamp } = JSON.parse(cached);
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - timestamp < oneHour) {
        setIsSetup(cachedSetup);
        setChecking(false);
        return;
      }
    }
    
    setChecking(true);
    try {
      const setup = await isDatabaseSetup(supabase);
      setIsSetup(setup);
      localStorage.setItem(cacheKey, JSON.stringify({ 
        isSetup: setup, 
        timestamp: Date.now() 
      }));
    } catch (error) {
      console.error('Error checking database:', error);
    }
    setChecking(false);
  };

  const handleCopyScript = async () => {
    setCopying(true);
    try {
      const success = await copyMigrationScriptToClipboard();
      if (success) {
        toast({
          title: "Script Copied!",
          description: "Migration script telah disalin ke clipboard. Paste di SQL Editor Supabase.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Copy Failed",
          description: "Gagal copy script. Silakan copy manual dari file.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi error saat copy script.",
      });
    }
    setCopying(false);
  };

  const handleDownloadScript = async () => {
    try {
      const response = await fetch('/src/supabase/migrations/00_complete_database_setup.sql');
      if (!response.ok) throw new Error('Migration script tidak ditemukan');
      
      const migrationScript = await response.text();
      const blob = new Blob([migrationScript], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '00_complete_database_setup.sql';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: "Migration script berhasil didownload.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Gagal download script.",
      });
    }
  };

  if (checking || isSetup) {
    return null;
  }

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="h-5 w-5" />
          Database Belum Tersetup Lengkap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            Aplikasi membutuhkan 31 tabel di database. Saat ini database Anda belum lengkap.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Cara Setup Database:</h3>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Langkah Setup (Recommended)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Klik tombol "Copy Migration Script" di bawah</li>
              <li>Klik tombol "Buka SQL Editor" untuk membuka Supabase SQL Editor</li>
              <li>Paste script yang sudah dicopy ke SQL Editor</li>
              <li>Klik "Run" untuk execute</li>
              <li>Kembali ke aplikasi dan klik "Cek Ulang Database"</li>
            </ol>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                variant="default"
                size="sm"
                onClick={handleCopyScript}
                disabled={copying}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copying ? 'Copying...' : 'Copy Migration Script'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL?.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buka SQL Editor
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleDownloadScript}
              >
                <Download className="h-4 w-4 mr-2" />
                Download SQL File
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Atau Via Terminal (Supabase CLI)</h4>
            <pre className="bg-gray-900 text-white p-3 rounded-md text-xs overflow-x-auto">
              <code>supabase db push</code>
            </pre>
          </div>

          <div className="mt-4">
            <Button onClick={checkDatabase} variant="default" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Cek Ulang Database
            </Button>
          </div>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Tabel yang Dibutuhkan (31 tabel)</AlertTitle>
          <AlertDescription className="text-xs">
            users, guru, kelas, siswa, mata_pelajaran, jadwal_pelajaran, jam_pelajaran, 
            kehadiran, jenis_kegiatan, jurnal, jurnal_template, jenis_penilaian, nilai_siswa, 
            bobot_penilaian_kelas, grade_thresholds, ekstrakurikuler, anggota_eskul, 
            kehadiran_eskul, nilai_eskul, kelompok_siswa, pengaturan, app_settings, 
            pdf_format_settings, quick_menu_items, agenda_mengajar, catatan_kalender, 
            periode_non_pembelajaran, hari_libur, hari_libur_custom, tahun_ajaran, profiles
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}