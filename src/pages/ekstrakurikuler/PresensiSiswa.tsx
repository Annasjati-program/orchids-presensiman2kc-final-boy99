import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function PresensiSiswa() {
  const { user } = useAuth();
  const [tokenInput, setTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadStudentProfile();
  }, [user]);

  const loadStudentProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('anggota_eskul')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Gagal memuat profil siswa');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmitToken = async () => {
    if (!tokenInput.trim()) {
      toast.error("Token tidak boleh kosong");
      return;
    }

    if (!profile) {
      toast.error("Profil siswa belum dimuat");
      return;
    }

    setIsLoading(true);
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_presensi')
        .select('*, ekstrakurikuler:ekstrakurikuler_id(nama_ekstrakurikuler)')
        .eq('token_code', tokenInput.toUpperCase())
        .eq('status', 'aktif')
        .single();

      if (tokenError || !tokenData) {
        toast.error('Token tidak valid atau sudah tidak aktif');
        return;
      }

      const now = new Date();
      const tokenDate = new Date(tokenData.tanggal);
      const [jamMulai, menitMulai] = tokenData.waktu_mulai.split(':');
      const [jamSelesai, menitSelesai] = tokenData.waktu_selesai.split(':');
      
      const waktuMulai = new Date(tokenDate);
      waktuMulai.setHours(parseInt(jamMulai), parseInt(menitMulai), 0);
      
      const waktuSelesai = new Date(tokenDate);
      waktuSelesai.setHours(parseInt(jamSelesai), parseInt(menitSelesai), 0);

      if (now < waktuMulai || now > waktuSelesai) {
        toast.error('Token belum aktif atau sudah expired');
        return;
      }

      const { data: existingLog, error: logCheckError } = await supabase
        .from('log_presensi_token')
        .select('*')
        .eq('token_id', tokenData.id)
        .eq('user_id', user!.id)
        .single();

      if (existingLog) {
        toast.error('Anda sudah melakukan presensi dengan token ini');
        return;
      }

      const { error: logError } = await supabase
        .from('log_presensi_token')
        .insert({
          token_id: tokenData.id,
          user_id: user!.id,
          nama_siswa: profile.nama_siswa,
          waktu_presensi: new Date().toISOString()
        });

      if (logError) throw logError;

      const { error: kehadiranError } = await supabase
        .from('kehadiran_eskul')
        .insert({
          anggota_id: profile.id,
          ekstrakurikuler_id: tokenData.ekstrakurikuler_id,
          tanggal: tokenData.tanggal,
          status: 'hadir',
          keterangan: `Presensi via token: ${tokenInput}`
        });

      if (kehadiranError) throw kehadiranError;

      toast.success(`Presensi berhasil untuk ${tokenData.ekstrakurikuler?.nama_ekstrakurikuler || 'ekstrakurikuler'}`);
      setTokenInput("");
    } catch (error: any) {
      toast.error(error.message || "Gagal memvalidasi token");
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Presensi Ekstrakurikuler</h1>
        <p className="text-muted-foreground">Masukkan kode token untuk presensi</p>
      </div>

      {profile && (
        <Card className="max-w-md bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profil Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-semibold text-lg">{profile.nama_siswa}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NISN</p>
              <p className="font-mono">{profile.nisn}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kelas</p>
              <p>{profile.tingkat} - {profile.nama_kelas}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Input Token Presensi
          </CardTitle>
          <CardDescription>
            Masukkan 8 karakter kode token yang diberikan oleh guru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Kode Token</Label>
            <Input
              id="token"
              placeholder="Contoh: A1B2C3D4"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-lg font-mono tracking-widest"
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleSubmitToken} 
            className="w-full"
            disabled={isLoading || !profile}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memvalidasi...
              </>
            ) : (
              "Submit Presensi"
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Token hanya valid pada waktu dan tanggal yang ditentukan guru
          </div>
        </CardContent>
      </Card>
    </div>
  );
}