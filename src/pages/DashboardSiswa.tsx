import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Camera, Scan, QrCode, User, GraduationCap, KeyRound, History, LogOut, Sun, Moon, AlertCircle, HeartPulse, CheckCircle2, XCircle, Eye, EyeOff, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

export default function DashboardSiswa() {
    const navigate = useNavigate();
    const [siswaData, setSiswaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [token, setToken] = useState("");
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [hasActiveToken, setHasActiveToken] = useState(false);
    const [confirmAbsenceDialog, setConfirmAbsenceDialog] = useState<{ open: boolean; type: 'Izin' | 'Sakit' | null }>({ open: false, type: null });
      const [confirmTokenDialog, setConfirmTokenDialog] = useState(false);
      const [confirmLogoutDialog, setConfirmLogoutDialog] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
        const { theme, setTheme } = useTheme();
      const [currentDateTime, setCurrentDateTime] = useState(new Date());

    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const siswaLoggedIn = localStorage.getItem('siswa_logged_in');
    
    if (!siswaLoggedIn) {
      navigate('/login-siswa', { replace: true });
      return;
    }
    
    loadSiswaData(siswaLoggedIn);
  }, [navigate]);

  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault();
      setConfirmLogoutDialog(true);
      window.history.pushState(null, '', window.location.pathname);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

    useEffect(() => {
      if (siswaData?.id) {
        checkAttendanceStatus();
      }
    }, [siswaData]);

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

  const checkAttendanceStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's an active token for today
      const { data: activeToken, error: tokenError } = await supabase
        .from("token_presensi")
        .select("id")
        .eq("ekstrakurikuler_id", siswaData.ekstrakurikuler_id)
        .eq("tanggal", today)
        .eq("status", "aktif")
        .maybeSingle();

      if (tokenError && tokenError.code !== 'PGRST116') {
        console.error("Error checking active token:", tokenError);
      }
      
      setHasActiveToken(!!activeToken);
      
      // Check attendance status
      const { data, error } = await supabase
        .from("kehadiran_eskul")
        .select("tanggal, status_kehadiran, keterangan")
        .eq("anggota_id", siswaData.id)
        .eq("tanggal", today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setAttendanceStatus(data);
      setLoadingAttendance(false);
    } catch (error) {
      console.error("Error checking attendance:", error);
      setLoadingAttendance(false);
    }
  };

  const loadSiswaData = async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      setSiswaData(parsedData);
      setLoading(false);
    } catch (error) {
      console.error("Error parsing siswa data:", error);
      navigate('/login-siswa', { replace: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("siswa_logged_in");
    toast.success("Berhasil logout");
    navigate("/login-siswa");
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRDetected = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setShowQRScanner(false);
    setToken(decodedText);
    toast.success("QR Code berhasil di-scan!");
  };

  useEffect(() => {
    if (!showQRScanner) return;

    const mountId = "html5qr-reader";
    
    const initScanner = () => {
      const element = document.getElementById(mountId);
      if (!element) {
        console.error("QR reader element not found");
        return;
      }

      const scanner = new Html5QrcodeScanner(
        mountId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText: string) => handleQRDetected(decodedText),
        (err: any) => {
          if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
            toast.error("Izin kamera diperlukan untuk scan QR Code. Mohon izinkan akses kamera di pengaturan browser.");
            setShowQRScanner(false);
          } else if (err.name === "NotFoundError") {
            toast.error("Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.");
            setShowQRScanner(false);
          } else if (err.name === "NotSupportedError") {
            toast.error("Browser tidak mendukung akses kamera. Gunakan HTTPS atau browser lain.");
            setShowQRScanner(false);
          }
        }
      );

      scannerRef.current = scanner;
    };

    setTimeout(initScanner, 100);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [showQRScanner]);

  const handleUbahPassword = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Semua field harus diisi");
      return;
    }

    if (passwordForm.currentPassword !== siswaData.password) {
      toast.error("Password lama tidak sesuai");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase
        .from("anggota_eskul")
        .update({ password: passwordForm.newPassword })
        .eq("username", siswaData.username);

      if (error) throw error;

      const updatedData = { ...siswaData, password: passwordForm.newPassword };
      localStorage.setItem("siswa_logged_in", JSON.stringify(updatedData));
      setSiswaData(updatedData);

      toast.success("Password berhasil diubah!");
      setShowPasswordDialog(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Gagal mengubah password. Silakan coba lagi.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSubmitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token tidak boleh kosong");
      return;
    }

    try {
      console.log("=== DEBUG START ===");
      console.log("Token input:", token);
      console.log("Siswa data:", siswaData);

      const { data: tokenData, error: tokenError } = await supabase
        .from("token_presensi")
        .select("id, ekstrakurikuler_id, tanggal, waktu_mulai, waktu_selesai, status, token_code")
        .eq("token_code", token.toUpperCase())
        .eq("status", "aktif")
        .single();

      console.log("Token data from DB:", tokenData);
      console.log("Token error:", tokenError);

      if (tokenError || !tokenData) {
        toast.error("Token tidak valid atau sudah tidak aktif");
        return;
      }

      console.log("Validating eskul_id:", {
        tokenEskulId: tokenData.ekstrakurikuler_id,
        siswaEskulId: siswaData.ekstrakurikuler_id,
        match: tokenData.ekstrakurikuler_id === siswaData.ekstrakurikuler_id
      });

      if (tokenData.ekstrakurikuler_id !== siswaData.ekstrakurikuler_id) {
        toast.error("Token ini bukan untuk ekstrakurikuler Anda");
        return;
      }

      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const today = now.toISOString().split('T')[0];
      
      console.log("Date validation:", {
        tokenDate: tokenData.tanggal,
        today: today,
        match: tokenData.tanggal === today
      });

      if (tokenData.tanggal !== today) {
        toast.error("Token ini untuk tanggal yang berbeda");
        return;
      }

      const currentTime = now.toTimeString().split(' ')[0];
      console.log("Time validation:", {
        currentTime: currentTime,
        waktuMulai: tokenData.waktu_mulai,
        waktuSelesai: tokenData.waktu_selesai,
        valid: currentTime >= tokenData.waktu_mulai && currentTime <= tokenData.waktu_selesai
      });

      if (currentTime < tokenData.waktu_mulai || currentTime > tokenData.waktu_selesai) {
        toast.error("Token ini hanya berlaku antara " + tokenData.waktu_mulai + " - " + tokenData.waktu_selesai);
        return;
      }

      console.log("Checking existing kehadiran...");
      const { data: existingKehadiran, error: kehadiranCheckError } = await supabase
        .from("kehadiran_eskul")
        .select("id")
        .eq("anggota_id", siswaData.id)
        .eq("tanggal", tokenData.tanggal)
        .single();

      console.log("Existing kehadiran:", existingKehadiran);
      console.log("Kehadiran check error:", kehadiranCheckError);

      if (existingKehadiran) {
        toast.warning("Anda sudah melakukan presensi untuk hari ini");
        setToken("");
        return;
      }

      console.log("Checking existing log...");
      const { data: existingLog, error: checkError } = await supabase
        .from("log_presensi_token")
        .select("id")
        .eq("token_id", tokenData.id)
        .eq("anggota_eskul_id", siswaData.id)
        .single();

      console.log("Existing log:", existingLog);
      console.log("Log check error:", checkError);

      if (existingLog) {
        toast.warning("Anda sudah melakukan presensi untuk token ini");
        setToken("");
        return;
      }

      console.log("Inserting log_presensi_token...");
      const { data: logData, error: insertError } = await supabase
        .from("log_presensi_token")
        .insert({
          token_id: tokenData.id,
          anggota_eskul_id: siswaData.id,
          waktu_presensi: new Date().toISOString(),
          metode: token.length > 10 ? "qr_scan" : "input_manual",
        })
        .select();

      console.log("Log insert result:", logData);
      console.log("Log insert error:", insertError);

      if (insertError) throw insertError;

      console.log("Inserting kehadiran_eskul...");
      const { data: kehadiranData, error: kehadiranError } = await supabase
        .from("kehadiran_eskul")
        .insert({
          ekstrakurikuler_id: tokenData.ekstrakurikuler_id,
          anggota_id: siswaData.id,
          tanggal: tokenData.tanggal,
          status_kehadiran: "Hadir",
          keterangan: "Presensi via token",
        })
        .select();

      console.log("Kehadiran insert result:", kehadiranData);
      console.log("Kehadiran insert error:", kehadiranError);

      console.log("=== SUCCESS ===");
      
      setAttendanceStatus({
        tanggal: tokenData.tanggal,
        status_kehadiran: "Hadir",
        keterangan: "Presensi via token"
      });
      
      toast.success("Presensi berhasil dicatat!");
      setToken("");
    } catch (error) {
      console.error("=== ERROR ===");
      console.error("Full error:", error);
      toast.error("Gagal mencatat presensi. Silakan coba lagi.");
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result as string);
        setShowPhotoDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      toast.error("Tidak ada gambar yang dipilih");
      return;
    }

    setUploading(true);

    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      const fileName = `${siswaData.id}-${Date.now()}.jpg`;
      const filePath = `profile-photos/${fileName}`;

      if (siswaData.foto_url) {
        const oldFileName = siswaData.foto_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("student-photos").remove([`profile-photos/${oldFileName}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("student-photos")
        .upload(filePath, croppedImage, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("student-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("anggota_eskul")
        .update({ foto_url: publicUrl })
        .eq("id", siswaData.id);

      if (updateError) throw updateError;

      const updatedData = { ...siswaData, foto_url: publicUrl };
      localStorage.setItem("siswa_logged_in", JSON.stringify(updatedData));
      setSiswaData(updatedData);

      toast.success("Foto profil berhasil diupload!");
      setShowPhotoDialog(false);
      setSelectedImage(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Gagal mengupload foto. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const handleAbsence = async (type: 'Izin' | 'Sakit') => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingKehadiran, error: checkError } = await supabase
        .from("kehadiran_eskul")
        .select("id")
        .eq("anggota_id", siswaData.id)
        .eq("tanggal", today)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingKehadiran) {
        toast.warning("Anda sudah melakukan presensi untuk hari ini");
        return;
      }

      const { data: activeToken, error: tokenError } = await supabase
        .from("token_presensi")
        .select("id")
        .eq("ekstrakurikuler_id", siswaData.ekstrakurikuler_id)
        .eq("tanggal", today)
        .eq("status", "aktif")
        .maybeSingle();

      if (tokenError && tokenError.code !== 'PGRST116') {
        throw tokenError;
      }

      if (!activeToken) {
        toast.error("Tidak ada token aktif untuk hari ini. Presensi izin/sakit hanya bisa dilakukan saat ada token aktif.");
        return;
      }

      const { data, error } = await supabase
        .from("kehadiran_eskul")
        .insert({
          ekstrakurikuler_id: siswaData.ekstrakurikuler_id,
          anggota_id: siswaData.id,
          tanggal: today,
          status_kehadiran: type,
          keterangan: `${type} - Langsung dari dashboard`,
        })
        .select();

      if (error) throw error;

      setAttendanceStatus({
        tanggal: today,
        status_kehadiran: type,
        keterangan: `${type} - Langsung dari dashboard`
      });

      toast.success(`Presensi ${type} berhasil dicatat!`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mencatat presensi. Silakan coba lagi.");
    }
  };

  if (!siswaData) {
    return null;
  }

  return (
      <div className="min-h-screen bg-background p-3 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">Halo, {siswaData.nama}!</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="outline"
                size="icon"
                className="sm:hidden h-9 w-9"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
                <Button
                  onClick={() => setConfirmLogoutDialog(true)}
                  variant="outline"
                  size="icon"
                  className="sm:hidden h-9 w-9"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Terang" : "Gelap"}
              </Button>
                <Button
                  onClick={() => setConfirmLogoutDialog(true)}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>

                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-4 h-4" />
                      Profil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex gap-4">
                    <div className="relative group flex-shrink-0">
                      <div 
                        className="cursor-pointer relative overflow-hidden rounded-lg"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Avatar className="w-32 h-40 rounded-lg">
                          <AvatarImage src={siswaData.foto_url || ""} className="object-cover" />
                          <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-2xl font-bold">
                            {siswaData.nama?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-center text-white">
                            <Upload className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs font-medium">Upload Foto</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        Klik foto untuk upload
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>

                  <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Nama Lengkap</p>
                      <p className="font-semibold">{siswaData.nama}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Username</p>
                      <p className="font-semibold">{siswaData.username}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Tingkat</p>
                      <p className="font-semibold">{siswaData.tingkat || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Kelas</p>
                      <p className="font-semibold">{siswaData.kelas || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Ekstrakurikuler</p>
                      <p className="font-semibold text-primary">{siswaData.eskul_nama || "-"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

{!loadingAttendance && (
            attendanceStatus ? (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-700 dark:text-green-400">
                        Sudah Presensi Hari Ini
                      </h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="font-medium text-foreground">{attendanceStatus.status_kehadiran}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : hasActiveToken ? (
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/10">
                      <XCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                        Belum Presensi Hari Ini
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Silakan scan QR atau masukkan token untuk melakukan presensi
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-500/30 bg-slate-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-500/10">
                      <AlertCircle className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-600 dark:text-slate-400">
                        Tidak Ada Presensi Hari Ini
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tidak ada token presensi yang aktif untuk ekstrakurikuler Anda hari ini
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}

          {!attendanceStatus && !loadingAttendance && hasActiveToken && (
            <>
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                        Informasi Izin & Sakit
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Untuk presensi <span className="font-medium text-blue-600">Izin</span> atau <span className="font-medium text-red-600">Sakit</span>, Anda <span className="font-semibold">tidak perlu token</span>. Cukup klik tombol di bawah ini untuk langsung mencatat presensi.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setConfirmAbsenceDialog({ open: true, type: 'Izin' })}
                  variant="outline"
                  className="h-20 flex flex-col gap-2 bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold">Izin</span>
                </Button>
                <Button
                  onClick={() => setConfirmAbsenceDialog({ open: true, type: 'Sakit' })}
                  variant="outline"
                  className="h-20 flex flex-col gap-2 bg-red-500/5 border-red-500/30 hover:bg-red-500/10"
                >
                  <HeartPulse className="w-6 h-6 text-red-600" />
                  <span className="font-semibold">Sakit</span>
                </Button>
              </div>
            </>
          )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="w-4 h-4" />
              Presensi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-sm">Token Presensi</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Masukkan token dari guru"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                onClick={() => {
                  if (!token) {
                    toast.error("Token tidak boleh kosong");
                    return;
                  }
                  setConfirmTokenDialog(true);
                }}
                className="w-full h-10"
              >
                Submit Token
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-muted-foreground">Atau</span>
              </div>
            </div>

            <Button
              onClick={handleScanQR}
              variant="outline"
              className="w-full h-12 gap-2 group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base">Scan QR Code</span>
                <Scan className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </Button>

            <Button
              onClick={() => navigate("/siswa/riwayat-presensi")}
              variant="outline"
              className="w-full h-10 gap-2"
            >
              <History className="w-4 h-4" />
              Lihat Riwayat Presensi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="w-4 h-4" />
              Pengaturan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleUbahPassword}
              variant="outline"
              className="w-full h-10 gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Ubah Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Ubah Password
            </DialogTitle>
            <DialogDescription>
              Masukkan password lama dan password baru untuk mengubah password Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordUpdate} className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-sm">Password Lama</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="Masukkan password lama"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-sm">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="flex-1 h-10"
                disabled={isUpdatingPassword}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
                <Camera className="w-5 h-5 text-white" />
              </div>
              Scan QR Code
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Arahkan kamera ke QR Code untuk presensi
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-xl"></div>
            <div className="relative bg-slate-900 rounded-xl p-4 border border-slate-800 overflow-hidden">
              <div id="html5qr-reader" className="w-full rounded-lg overflow-hidden"></div>
              <div className="absolute top-8 left-8 right-8 bottom-8 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-500 rounded-tl-xl animate-pulse"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-500 rounded-tr-xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-500 rounded-bl-xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-500 rounded-br-xl animate-pulse"></div>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowQRScanner(false)}
            variant="outline"
            className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600"
          >
            Tutup
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAbsenceDialog.open} onOpenChange={(open) => setConfirmAbsenceDialog({ open, type: confirmAbsenceDialog.type })}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmAbsenceDialog.type === 'Izin' ? (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <HeartPulse className="w-5 h-5 text-red-600" />
              )}
              Konfirmasi Presensi {confirmAbsenceDialog.type}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan presensi {confirmAbsenceDialog.type}? Presensi ini akan langsung tercatat di sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAbsenceDialog({ open: false, type: null })}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmAbsenceDialog.type) {
                  handleAbsence(confirmAbsenceDialog.type);
                }
                setConfirmAbsenceDialog({ open: false, type: null });
              }}
              className={confirmAbsenceDialog.type === 'Izin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Ya, {confirmAbsenceDialog.type}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={confirmTokenDialog} onOpenChange={setConfirmTokenDialog}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Konfirmasi Submit Token
              </AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin submit token presensi? Pastikan token yang dimasukkan sudah benar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmTokenDialog(false)}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  setConfirmTokenDialog(false);
                  handleSubmitToken(e as any);
                }}
              >
                Ya, Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmLogoutDialog} onOpenChange={setConfirmLogoutDialog}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-destructive" />
                Konfirmasi Logout
              </AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin keluar dari dashboard siswa?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmLogoutDialog(false)}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setConfirmLogoutDialog(false);
                  handleLogout();
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Ya, Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showPhotoDialog} onOpenChange={(open) => {
          if (!open) {
            setShowPhotoDialog(false);
            setSelectedImage(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Crop Foto Profil
              </DialogTitle>
              <DialogDescription>
                Sesuaikan posisi dan zoom foto Anda. Rasio 3:4 (foto standar)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
                {selectedImage && (
                  <Cropper
                    image={selectedImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={3 / 4}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Zoom</Label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPhotoDialog(false);
                    setSelectedImage(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="flex-1"
                  disabled={uploading}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleUploadPhoto}
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? "Mengupload..." : "Upload Foto"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }